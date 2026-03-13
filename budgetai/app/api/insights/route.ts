// GET /api/insights — AI-generated financial insights
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInsights } from "@/lib/ai-analyzer";
import { toMonthlyAmount } from "@/lib/subscription-detector";
import { subMonths } from "date-fns";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Return cached insights
  const existing = await prisma.insight.findMany({
    where: { userId: user.id, createdAt: { gte: subMonths(new Date(), 1) } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (existing.length > 0) return NextResponse.json({ insights: existing });

  // Generate new insights
  const [subscriptions, recentTx] = await Promise.all([
    prisma.subscription.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.transaction.findMany({ where: { userId: user.id, date: { gte: subMonths(new Date(), 1) }, amount: { lt: 0 } } }),
  ]);

  const monthlySubscriptionCost = subscriptions.reduce((s, sub) => s + toMonthlyAmount(sub.amount, sub.frequency), 0);
  const totalMonthlySpend = recentTx.reduce((s, t) => s + Math.abs(t.amount), 0);

  const categoryMap = new Map<string, number>();
  for (const tx of recentTx) {
    categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + Math.abs(tx.amount));
  }

  const aiInsights = await generateInsights({
    monthlySubscriptionCost,
    totalMonthlySpend,
    topCategories: Array.from(categoryMap.entries()).map(([category, total]) => ({ category, total })),
    subscriptions: subscriptions.map(s => ({ name: s.name, amount: s.amount })),
  });

  const created = await prisma.$transaction(
    aiInsights.map(i => prisma.insight.create({
      data: { userId: user.id, type: i.type, title: i.title, body: i.body },
    }))
  );

  return NextResponse.json({ insights: created });
}
