// BudgetAI — Subscription Detection Algorithm
import { Transaction } from "@prisma/client";
import { CANCEL_URLS } from "@/types";

export interface DetectedSubscription {
  normalizedName: string;
  name: string;
  amount: number;
  currency: string;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  firstSeenAt: Date;
  lastSeenAt: Date;
  nextExpectedAt: Date;
  occurrences: number;
  totalSpent: number;
  cancelUrl?: string;
  transactionIds: string[];
}

// Normalize merchant name for grouping
export function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(prlv|cb|sepa|vir|prelevement|abonnement|abo)\b/g, "")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ")
    .trim();
}

// Calculate days between two dates
function daysBetween(a: Date, b: Date): number {
  return Math.abs(Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

// Detect frequency from average days between transactions
function detectFrequency(dayGaps: number[]): "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" {
  if (dayGaps.length === 0) return "MONTHLY";
  const avg = dayGaps.reduce((a, b) => a + b, 0) / dayGaps.length;

  if (avg <= 10) return "WEEKLY";
  if (avg <= 45) return "MONTHLY";
  if (avg <= 100) return "QUARTERLY";
  return "YEARLY";
}

// Main subscription detection function
export function detectSubscriptions(
  transactions: Transaction[]
): DetectedSubscription[] {
  // Filter only expense transactions
  const expenses = transactions.filter((t) => t.amount < 0);

  // Group by normalized merchant name
  const groups = new Map<string, Transaction[]>();
  for (const tx of expenses) {
    const key = normalizeMerchant(tx.merchant);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const subscriptions: DetectedSubscription[] = [];

  for (const [key, txs] of groups.entries()) {
    // Need at least 2 occurrences to be a subscription
    if (txs.length < 2) continue;

    // Sort by date
    const sorted = [...txs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check amount consistency (allow 5% variance for price changes)
    const amounts = sorted.map((t) => Math.abs(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxVariance = avgAmount * 0.05;
    const isConsistentAmount = amounts.every(
      (a) => Math.abs(a - avgAmount) <= maxVariance + 1
    );

    if (!isConsistentAmount) continue;

    // Calculate day gaps between consecutive payments
    const dayGaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      dayGaps.push(
        daysBetween(new Date(sorted[i - 1].date), new Date(sorted[i].date))
      );
    }

    // Check regularity (gaps shouldn't vary more than 10 days from each other)
    const avgGap = dayGaps.reduce((a, b) => a + b, 0) / dayGaps.length;
    const isRegular = dayGaps.every((g) => Math.abs(g - avgGap) <= 10);

    if (!isRegular && txs.length < 3) continue;

    // Compute frequency
    const frequency = detectFrequency(dayGaps);

    // Compute next expected date
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const freqDays = { WEEKLY: 7, MONTHLY: 30, QUARTERLY: 91, YEARLY: 365 };
    const nextExpectedAt = new Date(
      lastDate.getTime() + freqDays[frequency] * 24 * 60 * 60 * 1000
    );

    // Find cancel URL
    const cancelUrl = findCancelUrl(sorted[0].merchant);

    subscriptions.push({
      normalizedName: key,
      name: sorted[0].merchant,
      amount: Math.round(avgAmount * 100) / 100,
      currency: sorted[0].currency,
      frequency,
      firstSeenAt: new Date(sorted[0].date),
      lastSeenAt: new Date(sorted[sorted.length - 1].date),
      nextExpectedAt,
      occurrences: sorted.length,
      totalSpent: Math.round(amounts.reduce((a, b) => a + b, 0) * 100) / 100,
      cancelUrl,
      transactionIds: sorted.map((t) => t.id),
    });
  }

  // Sort by monthly cost descending
  return subscriptions.sort((a, b) => {
    const monthly = (s: DetectedSubscription) =>
      s.frequency === "MONTHLY" ? s.amount :
      s.frequency === "YEARLY" ? s.amount / 12 :
      s.frequency === "QUARTERLY" ? s.amount / 3 :
      s.amount * 4.33;
    return monthly(b) - monthly(a);
  });
}

function findCancelUrl(merchant: string): string | undefined {
  const lower = merchant.toLowerCase();
  for (const [key, url] of Object.entries(CANCEL_URLS)) {
    if (lower.includes(key)) return url;
  }
  return undefined;
}

// Calculate monthly equivalent cost
export function toMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case "WEEKLY": return amount * 4.33;
    case "MONTHLY": return amount;
    case "QUARTERLY": return amount / 3;
    case "YEARLY": return amount / 12;
    default: return amount;
  }
}
