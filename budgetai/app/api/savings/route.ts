// POST /api/savings — Savings simulator
import { NextRequest, NextResponse } from "next/server";
import { calculateFutureValue } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { monthlySavings, annualRate = 5, years = 10, cancelledSubscriptions = [] } = await request.json();

  const totalMonthlySavings = monthlySavings + cancelledSubscriptions.reduce((s: number, a: number) => s + a, 0);

  const projections = [1, 2, 3, 5, 10, 20].map(y => ({
    years: y,
    futureValue: Math.round(calculateFutureValue(totalMonthlySavings, annualRate, y) * 100) / 100,
    totalContributed: Math.round(totalMonthlySavings * 12 * y * 100) / 100,
    interestEarned: Math.round((calculateFutureValue(totalMonthlySavings, annualRate, y) - totalMonthlySavings * 12 * y) * 100) / 100,
  }));

  return NextResponse.json({ projections, monthlySavings: totalMonthlySavings });
}
