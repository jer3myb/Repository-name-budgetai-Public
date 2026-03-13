import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BudgetAI — Gérez vos finances intelligemment",
  description: "Analysez vos relevés bancaires, détectez vos abonnements et optimisez vos dépenses avec l'IA.",
  keywords: ["budget", "finance", "abonnements", "dépenses", "IA"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
