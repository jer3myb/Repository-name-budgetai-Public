// GET /api/subscriptions — List subscriptions
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    orderBy: { amount: "desc" },
  });

  return NextResponse.json({ subscriptions });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, isActive } = await request.json();
  const sub = await prisma.subscription.findFirst({ where: { id, userId: user.id } });
  if (!sub) return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });

  const updated = await prisma.subscription.update({ where: { id }, data: { isActive } });
  return NextResponse.json({ subscription: updated });
}
