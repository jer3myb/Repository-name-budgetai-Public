// POST /api/upload — Process bank statement files
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV, parseExcel, validateFile } from "@/lib/file-parser";
import { analyzeTransactions } from "@/lib/ai-analyzer";
import { detectSubscriptions } from "@/lib/subscription-detector";
import { Category } from "@/types";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });

    const validation = validateFile(file.name, file.type, file.size);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create upload record
    const upload = await prisma.bankUpload.create({
      data: { userId: user.id, filename: file.name, fileType: ext || "unknown", status: "processing" },
    });

    let rawTransactions: Awaited<ReturnType<typeof parseCSV>> = [];

    if (ext === "csv" || ext === "txt") {
      rawTransactions = await parseCSV(buffer);
    } else if (ext === "xlsx" || ext === "xls") {
      rawTransactions = await parseExcel(buffer);
    } else if (ext === "pdf") {
      // For PDF, use AI to parse the text
      const pdfParse = await import("pdf-parse");
      const pdfData = await pdfParse.default(buffer);
      const aiResult = await analyzeTransactions(pdfData.text);
      rawTransactions = aiResult.transactions.map(t => ({
        date: t.date, merchant: t.merchant, description: t.description,
        amount: t.amount, currency: "EUR", category: t.category as Category,
      }));
    }

    if (rawTransactions.length === 0) {
      await prisma.bankUpload.update({ where: { id: upload.id }, data: { status: "error", errorMsg: "Aucune transaction trouvée" } });
      return NextResponse.json({ error: "Aucune transaction détectée dans le fichier" }, { status: 422 });
    }

    // Save transactions
    const created = await prisma.$transaction(
      rawTransactions.map(tx => prisma.transaction.create({
        data: {
          userId: user.id,
          uploadId: upload.id,
          date: new Date(tx.date),
          merchant: tx.merchant,
          description: tx.description,
          amount: tx.amount,
          currency: tx.currency,
          category: tx.category,
        },
      }))
    );

    // Run subscription detection on all user transactions
    const allTx = await prisma.transaction.findMany({ where: { userId: user.id, amount: { lt: 0 } } });
    const detected = detectSubscriptions(allTx);

    // Upsert subscriptions
    let subsCount = 0;
    for (const sub of detected) {
      const upserted = await prisma.subscription.upsert({
        where: { userId_normalizedName: { userId: user.id, normalizedName: sub.normalizedName } },
        update: {
          amount: sub.amount,
          lastSeenAt: sub.lastSeenAt,
          nextExpectedAt: sub.nextExpectedAt,
          occurrences: sub.occurrences,
          totalSpent: sub.totalSpent,
          cancelUrl: sub.cancelUrl,
          isActive: true,
        },
        create: {
          userId: user.id,
          name: sub.name,
          normalizedName: sub.normalizedName,
          amount: sub.amount,
          currency: sub.currency,
          frequency: sub.frequency,
          firstSeenAt: sub.firstSeenAt,
          lastSeenAt: sub.lastSeenAt,
          nextExpectedAt: sub.nextExpectedAt,
          occurrences: sub.occurrences,
          totalSpent: sub.totalSpent,
          cancelUrl: sub.cancelUrl,
          isActive: true,
        },
      });

      // Link transactions to subscription
      await prisma.transaction.updateMany({
        where: { id: { in: sub.transactionIds } },
        data: { isSubscription: true, subscriptionId: upserted.id },
      });
      subsCount++;
    }

    await prisma.bankUpload.update({
      where: { id: upload.id },
      data: { status: "done", rowCount: created.length },
    });

    return NextResponse.json({
      uploadId: upload.id,
      transactionsImported: created.length,
      subscriptionsDetected: subsCount,
      success: true,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erreur lors du traitement du fichier" }, { status: 500 });
  }
}
