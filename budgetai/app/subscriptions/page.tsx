
"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { type Subscription } from "@/types";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then(r => r.json())
      .then(d => { setSubscriptions(d.subscriptions || []); setLoading(false); });
  }, []);

  async function toggleActive(id: string, isActive: boolean) {
    await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, isActive } : s));
  }

  const active = subscriptions.filter(s => s.isActive);
  const inactive = subscriptions.filter(s => !s.isActive);
  const totalMonthly = active.reduce((sum, s) => {
    const m = s.frequency === "MONTHLY" ? s.amount : s.frequency === "YEARLY" ? s.amount / 12 : s.amount / 3;
    return sum + m;
  }, 0);

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Abonnements</h1>
        <p className="text-slate-400 mt-1">Gérez et résiliez vos abonnements</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-sky-500/20 to-sky-600/10 border-sky-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Abonnements actifs</p>
          <p className="font-display text-3xl font-bold text-white">{active.length}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border-indigo-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Coût mensuel</p>
          <p className="font-display text-2xl font-bold text-white">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-violet-500/20 to-violet-600/10 border-violet-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Coût annuel</p>
          <p className="font-display text-2xl font-bold text-white">{formatCurrency(totalMonthly * 12)}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Projection 5 ans</p>
          <p className="font-display text-2xl font-bold text-white">{formatCurrency(totalMonthly * 60)}</p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="font-display text-xl font-semibold text-white mb-2">Aucun abonnement détecté</h2>
          <p className="text-slate-400">Importez un relevé bancaire pour détecter automatiquement vos abonnements.</p>
        </div>
      ) : (
        <>
          {/* Active subscriptions */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <h2 className="font-display font-semibold text-white">Abonnements actifs ({active.length})</h2>
            </div>
            <div className="divide-y divide-slate-800/40">
              {active.map(sub => <SubscriptionRow key={sub.id} sub={sub} onToggle={toggleActive} />)}
            </div>
          </div>

          {/* Inactive */}
          {inactive.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/60">
                <h2 className="font-display font-semibold text-slate-400">Résiliés ({inactive.length})</h2>
              </div>
              <div className="divide-y divide-slate-800/40">
                {inactive.map(sub => <SubscriptionRow key={sub.id} sub={sub} onToggle={toggleActive} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SubscriptionRow({ sub, onToggle }: { sub: Subscription; onToggle: (id: string, active: boolean) => void }) {
  const monthlyAmount = sub.frequency === "MONTHLY" ? sub.amount :
    sub.frequency === "YEARLY" ? sub.amount / 12 :
    sub.frequency === "QUARTERLY" ? sub.amount / 3 : sub.amount * 4.33;

  return (
    <div className={`px-6 py-4 flex items-center gap-4 hover:bg-slate-800/20 transition-colors ${!sub.isActive ? "opacity-50" : ""}`}>
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-lg flex-shrink-0">
        {getServiceEmoji(sub.name)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{sub.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {sub.occurrences} paiement{sub.occurrences > 1 ? "s" : ""} · Total payé : {(sub.totalSpent || 0).toFixed(2)} €
        </p>
      </div>

      {/* Amounts */}
      <div className="hidden sm:block text-right">
        <p className="font-semibold text-white">{formatCurrency(monthlyAmount)}/mois</p>
        <p className="text-xs text-slate-500">{formatCurrency(monthlyAmount * 12)}/an</p>
      </div>

      {/* Frequency badge */}
      <span className="hidden md:flex badge bg-slate-800 text-slate-400">
        {sub.frequency === "MONTHLY" ? "Mensuel" : sub.frequency === "YEARLY" ? "Annuel" : sub.frequency === "QUARTERLY" ? "Trimestriel" : "Hebdo"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {sub.cancelUrl && sub.isActive && (
          <a href={sub.cancelUrl} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors">
            Résilier →
          </a>
        )}
        <button
          onClick={() => onToggle(sub.id, !sub.isActive)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sub.isActive ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"}`}>
          {sub.isActive ? "Marquer résilié" : "Réactiver"}
        </button>
      </div>
    </div>
  );
}

function getServiceEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("netflix")) return "🎬";
  if (n.includes("spotify")) return "🎵";
  if (n.includes("amazon")) return "📦";
  if (n.includes("disney")) return "🏰";
  if (n.includes("apple")) return "🍎";
  if (n.includes("youtube")) return "▶️";
  if (n.includes("canal")) return "📺";
  if (n.includes("microsoft") || n.includes("office")) return "💼";
  if (n.includes("adobe")) return "🎨";
  if (n.includes("gym") || n.includes("sport") || n.includes("fitness")) return "💪";
  return "📋";
}
