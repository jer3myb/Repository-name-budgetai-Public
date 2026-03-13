
"use client";
import { useEffect, useState } from "react";
import { formatCurrency, calculateFutureValue } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types";

export default function StatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [annualRate, setAnnualRate] = useState(5);
  const [years, setYears] = useState(10);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r => r.json()),
      fetch("/api/subscriptions").then(r => r.json()),
    ]).then(([s, sub]) => {
      setStats(s);
      setSubscriptions(sub.subscriptions || []);
      setLoading(false);
    });
  }, []);

  const monthlySavedFromSubs = selectedSubs.reduce((sum, id) => {
    const sub = subscriptions.find((s: any) => s.id === id);
    if (!sub) return sum;
    const m = sub.frequency === "MONTHLY" ? sub.amount :
      sub.frequency === "YEARLY" ? sub.amount / 12 :
      sub.frequency === "QUARTERLY" ? sub.amount / 3 : sub.amount * 4.33;
    return sum + m;
  }, 0);

  const futureValue = calculateFutureValue(monthlySavedFromSubs, annualRate, years);

  if (loading) return <div className="animate-pulse space-y-6">{[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-slate-800 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Statistiques</h1>
        <p className="text-slate-400 mt-1">Analyse détaillée de vos finances</p>
      </div>

      {/* Monthly bar chart */}
      {stats?.monthlyTrend && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-6">Évolution mensuelle des dépenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12 }} formatter={(v: number) => [`${v.toFixed(2)} €`]} />
              <Bar dataKey="expenses" name="Dépenses" fill="#0ea5e9" radius={[6,6,0,0]} />
              <Bar dataKey="income" name="Revenus" fill="#10b981" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category breakdown */}
      {stats?.topCategories && stats.topCategories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-white mb-6">Répartition des dépenses</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.topCategories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} paddingAngle={3}>
                  {stats.topCategories.map((entry: any, i: number) => (
                    <Cell key={i} fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)} €`]} contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-white mb-4">Détail par catégorie</h3>
            <div className="space-y-3">
              {stats.topCategories.map((cat: any) => {
                const pct = Math.round((cat.total / stats.totalMonthlySpend) * 100);
                const color = CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS] || "#94a3b8";
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-300">{CATEGORY_LABELS[cat.category as keyof typeof CATEGORY_LABELS] || cat.category}</span>
                      <span className="text-slate-400">{formatCurrency(cat.total)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SAVINGS SIMULATOR */}
      <div className="glass-card p-6 border border-emerald-500/20 bg-emerald-500/5">
        <h3 className="font-display text-xl font-bold text-white mb-2">💰 Simulateur d'épargne</h3>
        <p className="text-slate-400 text-sm mb-6">Simulez ce que vous pourriez économiser en résiliant des abonnements</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Abonnements à résilier :</label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {subscriptions.filter((s: any) => s.isActive).map((sub: any) => {
                  const monthly = sub.frequency === "MONTHLY" ? sub.amount :
                    sub.frequency === "YEARLY" ? sub.amount / 12 :
                    sub.frequency === "QUARTERLY" ? sub.amount / 3 : sub.amount * 4.33;
                  return (
                    <label key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 cursor-pointer hover:bg-slate-800/60 transition-colors">
                      <input type="checkbox" checked={selectedSubs.includes(sub.id)}
                        onChange={e => setSelectedSubs(prev => e.target.checked ? [...prev, sub.id] : prev.filter(i => i !== sub.id))}
                        className="w-4 h-4 rounded accent-emerald-500" />
                      <span className="flex-1 text-slate-300 text-sm">{sub.name}</span>
                      <span className="text-emerald-400 text-sm font-medium">{formatCurrency(monthly)}/mois</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Taux annuel (%)</label>
                <input type="number" min="0" max="20" step="0.5" value={annualRate}
                  onChange={e => setAnnualRate(parseFloat(e.target.value) || 0)}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Durée (années)</label>
                <input type="number" min="1" max="30" value={years}
                  onChange={e => setYears(parseInt(e.target.value) || 1)}
                  className="input-field" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
              <p className="text-sm text-slate-400 mb-1">Épargne mensuelle</p>
              <p className="font-display text-3xl font-bold text-emerald-400">{formatCurrency(monthlySavedFromSubs)}</p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20">
              <p className="text-sm text-slate-400 mb-1">Valeur dans {years} ans à {annualRate}%/an</p>
              <p className="font-display text-3xl font-bold text-sky-400">{formatCurrency(futureValue)}</p>
            </div>
            <div className="p-4 rounded-xl glass text-sm text-slate-400">
              <p>💡 Avec {formatCurrency(monthlySavedFromSubs)}/mois investis à {annualRate}% par an,</p>
              <p className="mt-1">vous accumulerez <strong className="text-emerald-400">{formatCurrency(futureValue)}</strong> en {years} ans</p>
              <p className="mt-1 text-xs text-slate-500">dont {formatCurrency(futureValue - monthlySavedFromSubs * 12 * years)} d'intérêts composés.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
