// BudgetAI — AI-powered transaction analysis using Claude
import Anthropic from "@anthropic-ai/sdk";
import { Category } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ParsedTransaction {
  date: string;
  merchant: string;
  description: string;
  amount: number;
  category: Category;
}

// Analyze raw text from a bank statement and extract structured transactions
export async function analyzeTransactions(
  rawText: string,
  existingTransactions?: ParsedTransaction[]
): Promise<{ transactions: ParsedTransaction[]; insights: string[] }> {
  const prompt = `You are a financial AI assistant analyzing a French bank statement.

Extract all transactions from the following bank statement text and return them as structured JSON.

For each transaction, determine:
1. date (ISO 8601 format: YYYY-MM-DD)
2. merchant (clean merchant name, remove bank codes and references)
3. description (original description if different from merchant)
4. amount (negative for debits/expenses, positive for credits/income)
5. category: one of GROCERIES, SUBSCRIPTION, RENT, TRANSPORT, RESTAURANT, ENTERTAINMENT, UTILITIES, HEALTH, SHOPPING, TRAVEL, EDUCATION, INVESTMENT, INCOME, OTHER

Common French patterns:
- "VIR SEPA" = bank transfer (could be RENT or INCOME)
- "CB " prefix = card payment
- "PRLV " = direct debit (often SUBSCRIPTION or UTILITIES)
- "RET DAB" = ATM withdrawal
- Common subscriptions: Netflix, Spotify, Disney+, Amazon Prime, Canal+, Deezer, Adobe, Microsoft, Apple

Bank statement text:
${rawText.slice(0, 8000)}

Return ONLY valid JSON in this exact format:
{
  "transactions": [
    {
      "date": "2024-01-15",
      "merchant": "Netflix",
      "description": "PRLV NETFLIX.COM",
      "amount": -13.49,
      "category": "SUBSCRIPTION"
    }
  ],
  "insights": ["Key observation about spending patterns"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error("AI analysis failed:", error);
    return { transactions: [], insights: [] };
  }
}

// Classify a single transaction category
export async function classifyTransaction(
  merchant: string,
  description: string,
  amount: number
): Promise<Category> {
  // Rule-based fast path (no API call needed)
  const lower = merchant.toLowerCase() + " " + description.toLowerCase();

  if (/netflix|spotify|disney|amazon prime|canal\+|deezer|apple tv|youtube premium|molotov|hulu|audible|duolingo|linkedin premium/i.test(lower)) return "SUBSCRIPTION";
  if (/loyer|rent|bail|immob/i.test(lower)) return "RENT";
  if (/uber|bolt|sncf|ratp|transilien|blablacar|taxi|metro|bus |train/i.test(lower)) return "TRANSPORT";
  if (/carrefour|leclerc|auchan|monoprix|lidl|aldi|intermarche|picard|franprix|biocoop/i.test(lower)) return "GROCERIES";
  if (/restaurant|cafe|brasserie|bistro|mcdonald|kfc|burger|pizza|sushi|kebab|deliveroo|ubereats|just eat/i.test(lower)) return "RESTAURANT";
  if (/edf|engie|eau|gaz|sfr|orange|free|bouygues|darty|fnac/i.test(lower)) return "UTILITIES";
  if (/pharmacie|medecin|hopital|clinique|dentiste|opticien|sante|health/i.test(lower)) return "HEALTH";
  if (/amazon|zalando|asos|zara|h&m|ikea|leroy merlin|decathlon/i.test(lower)) return "SHOPPING";
  if (/cinema|theatre|concert|musee|sport|gym|fitness|club/i.test(lower)) return "ENTERTAINMENT";
  if (/air france|sas|easyjet|airbnb|booking|expedia|hotel/i.test(lower)) return "TRAVEL";
  if (/salaire|virement recu|remboursement|revenu/i.test(lower) || amount > 0) return "INCOME";
  if (/microsoft|adobe|notion|slack|zoom|dropbox|github|heroku/i.test(lower)) return "SUBSCRIPTION";

  return "OTHER";
}

// Generate personalized financial insights
export async function generateInsights(stats: {
  monthlySubscriptionCost: number;
  totalMonthlySpend: number;
  topCategories: { category: string; total: number }[];
  subscriptions: { name: string; amount: number }[];
}): Promise<{ title: string; body: string; type: string }[]> {
  const prompt = `You are a French financial advisor AI. Based on these spending stats, generate 3 actionable financial insights in French.

Monthly subscription cost: ${stats.monthlySubscriptionCost}€
Total monthly spend: ${stats.totalMonthlySpend}€
Top spending categories: ${JSON.stringify(stats.topCategories)}
Active subscriptions: ${JSON.stringify(stats.subscriptions)}

Generate exactly 3 insights as JSON array:
[
  {
    "type": "saving_tip",
    "title": "Short actionable title (max 10 words)",
    "body": "Detailed insight with specific amounts and advice (2-3 sentences)"
  }
]

Types: monthly_summary, saving_tip, anomaly, projection
Be specific with numbers. Be encouraging but realistic.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") return [];

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}
