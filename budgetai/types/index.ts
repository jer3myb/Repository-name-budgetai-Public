// BudgetAI — Shared TypeScript Types

export type Category =
  | "GROCERIES" | "SUBSCRIPTION" | "RENT" | "TRANSPORT"
  | "RESTAURANT" | "ENTERTAINMENT" | "UTILITIES" | "HEALTH"
  | "SHOPPING" | "TRAVEL" | "EDUCATION" | "INVESTMENT"
  | "INCOME" | "OTHER";

export type Frequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  currency: string;
  locale: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  merchant: string;
  description?: string;
  amount: number;
  currency: string;
  category: Category;
  isSubscription: boolean;
  subscriptionId?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  frequency: Frequency;
  firstSeenAt: string;
  lastSeenAt: string;
  nextExpectedAt?: string;
  isActive: boolean;
  category: Category;
  cancelUrl?: string;
  logoUrl?: string;
  color?: string;
  totalSpent: number;
  occurrences: number;
}

export interface Insight {
  id: string;
  type: "monthly_summary" | "saving_tip" | "anomaly" | "projection";
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalMonthlySpend: number;
  totalMonthlyIncome: number;
  totalSubscriptions: number;
  monthlySubscriptionCost: number;
  annualSubscriptionCost: number;
  savingsProjection5y: number;
  topCategories: { category: Category; total: number; count: number }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
}

export interface UploadResult {
  uploadId: string;
  transactionsImported: number;
  subscriptionsDetected: number;
  errors?: string[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  GROCERIES: "Courses",
  SUBSCRIPTION: "Abonnements",
  RENT: "Loyer",
  TRANSPORT: "Transport",
  RESTAURANT: "Restaurants",
  ENTERTAINMENT: "Divertissement",
  UTILITIES: "Factures",
  HEALTH: "Santé",
  SHOPPING: "Shopping",
  TRAVEL: "Voyages",
  EDUCATION: "Éducation",
  INVESTMENT: "Investissements",
  INCOME: "Revenus",
  OTHER: "Autres",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  GROCERIES: "#10b981",
  SUBSCRIPTION: "#6366f1",
  RENT: "#f59e0b",
  TRANSPORT: "#3b82f6",
  RESTAURANT: "#f97316",
  ENTERTAINMENT: "#ec4899",
  UTILITIES: "#8b5cf6",
  HEALTH: "#14b8a6",
  SHOPPING: "#e11d48",
  TRAVEL: "#06b6d4",
  EDUCATION: "#84cc16",
  INVESTMENT: "#22c55e",
  INCOME: "#0ea5e9",
  OTHER: "#94a3b8",
};

export const CANCEL_URLS: Record<string, string> = {
  netflix: "https://www.netflix.com/cancelplan",
  spotify: "https://www.spotify.com/account/subscription",
  "amazon prime": "https://www.amazon.fr/gp/video/settings",
  amazon: "https://www.amazon.fr/gp/ss/help/public/payment-settings",
  disney: "https://www.disneyplus.com/account",
  "disney+": "https://www.disneyplus.com/account",
  apple: "https://appleid.apple.com/account/manage",
  "apple tv": "https://appleid.apple.com/account/manage",
  "apple music": "https://appleid.apple.com/account/manage",
  youtube: "https://www.youtube.com/paid_memberships",
  "youtube premium": "https://www.youtube.com/paid_memberships",
  hulu: "https://secure.hulu.com/account",
  deezer: "https://www.deezer.com/fr/account/subscription",
  canal: "https://www.canalplus.com/mon-compte/",
  "canal+": "https://www.canalplus.com/mon-compte/",
  molotov: "https://www.molotov.tv/account/subscription",
  microsoft: "https://account.microsoft.com/services",
  "microsoft 365": "https://account.microsoft.com/services",
  office: "https://account.microsoft.com/services",
  adobe: "https://account.adobe.com/plans",
  dropbox: "https://www.dropbox.com/account/plan",
  notion: "https://www.notion.so/my-account",
  slack: "https://slack.com/intl/fr-fr/help/articles/203941296",
  zoom: "https://zoom.us/billing",
  linkedin: "https://www.linkedin.com/myplan",
  "linkedin premium": "https://www.linkedin.com/myplan",
  audible: "https://www.audible.fr/account/memberships",
  duolingo: "https://www.duolingo.com/settings/notifications",
  nintendo: "https://accounts.nintendo.com/profile/edit",
  playstation: "https://www.playstation.com/fr-fr/support/subscriptions/",
  "playstation now": "https://www.playstation.com/fr-fr/support/subscriptions/",
  xbox: "https://account.microsoft.com/services",
  twitch: "https://www.twitch.tv/settings/prime",
};
