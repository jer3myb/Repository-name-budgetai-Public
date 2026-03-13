// GET /api/dashboard — Main dashboard statistics
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toMonthlyAmount } from "@/lib/subscription-detector";
import { startOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);

  // Recent transactions (last 30 days)
  const recentTx = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: subMonths(now, 1) } },
    orderBy: { date: "desc" },
  });

  // All transactions for trend (6 months)
  const trendTx = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: sixMonthsAgo } },
    orderBy: { date: "asc" },
  });

  // Active subscriptions
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id, isActive: true },
  });

  // Monthly stats
  const totalMonthlySpend = recentTx
    .filter(t => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const totalMonthlyIncome = recentTx
    .filter(t => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const monthlySubscriptionCost = subscriptions.reduce(
    (s, sub) => s + toMonthlyAmount(sub.amount, sub.frequency), 0
  );

  // Category breakdown (last month)
  const categoryMap = new Map<string, { total: number; count: number }>();
  for (const tx of recentTx.filter(t => t.amount < 0)) {
    const current = categoryMap.get(tx.category) || { total: 0, count: 0 };
    categoryMap.set(tx.category, { total: current.total + Math.abs(tx.amount), count: current.count + 1 });
  }
  const topCategories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Monthly trend
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = startOfMonth(subMonths(now, i - 1));
    const monthTx = trendTx.filter(t => {
      const d = new Date(t.date);
      return d >= monthStart && d < monthEnd;
    });
    monthlyTrend.push({
      month: format(monthStart, "MMM yyyy"),
      income: monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
      expenses: monthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    });
  }

  // 5-year savings projection
  const savingsProjection5y = monthlySubscriptionCost * 12 * 5;

  return NextResponse.json({
    totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
    totalMonthlyIncome: Math.round(totalMonthlyIncome * 100) / 100,
    totalSubscriptions: subscriptions.length,
    monthlySubscriptionCost: Math.round(monthlySubscriptionCost * 100) / 100,
    annualSubscriptionCost: Math.round(monthlySubscriptionCost * 12 * 100) / 100,
    savingsProjection5y: Math.round(savingsProjection5y * 100) / 100,
    topCategories,
    monthlyTrend,
  });
}
