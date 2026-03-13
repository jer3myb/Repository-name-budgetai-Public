
"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_LABELS, CATEGORY_COLORS, type DashboardStats } from "@/types";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts";
import UploadModal from "@/components/dashboard/UploadModal";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  async function loadStats() {
    setLoading(true);
    const res = await fetch("/api/dashboard");
    const data = await res.json();
    setStats(data);
    setLoading(false);
  }

  useEffect(() => { loadStats(); }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-xl w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-800 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-800 rounded-2xl" />
          <div className="h-64 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasData = stats && (stats.totalMonthlySpend > 0 || stats.totalSubscriptions > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Tableau de bord</h1>
          <p className="text-slate-400 mt-1">Vue d'ensemble de vos finances</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary">
          + Importer un relevé
        </button>
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="glass-card p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="font-display text-xl font-semibold text-white mb-2">Aucune donnée</h2>
          <p className="text-slate-400 mb-6">Importez votre premier relevé bancaire pour commencer l'analyse.</p>
          <button onClick={() => setShowUpload(true)} className="btn-primary">Importer un relevé bancaire</button>
        </div>
      )}

      {/* Stats grid */}
      {hasData && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Dépenses ce mois"
              value={formatCurrency(stats.totalMonthlySpend)}
              sub="Transactions débitées"
              color="sky"
            />
            <StatCard
              label="Abonnements actifs"
              value={stats.totalSubscriptions.toString()}
              sub={`${formatCurrency(stats.monthlySubscriptionCost)} / mois`}
              color="indigo"
            />
            <StatCard
              label="Coût annuel abos"
              value={formatCurrency(stats.annualSubscriptionCost)}
              sub="Projections 12 mois"
              color="violet"
            />
            <StatCard
              label="Économies possibles"
              value={formatCurrency(stats.savingsProjection5y)}
              sub="Projection sur 5 ans"
              color="emerald"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly trend */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-white mb-6">Tendance mensuelle</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.monthlyTrend}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)} €`]} contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#0ea5e9" fill="url(#expGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="income" name="Revenus" stroke="#10b981" fill="url(#incGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category pie */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-white mb-6">Répartition par catégorie</h3>
              {stats.topCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={stats.topCategories} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                      {stats.topCategories.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} €`]} contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12 }} />
                    <Legend formatter={(v) => CATEGORY_LABELS[v as keyof typeof CATEGORY_LABELS] || v} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-500">Aucune donnée</div>
              )}
            </div>
          </div>

          {/* Savings alert */}
          {stats.monthlySubscriptionCost > 0 && (
            <div className="glass-card p-6 border border-sky-500/20 bg-sky-500/5">
              <div className="flex items-start gap-4">
                <div className="text-2xl mt-0.5">💡</div>
                <div>
                  <h3 className="font-display font-semibold text-white mb-1">Votre potentiel d'économies</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Vous dépensez <strong className="text-sky-400">{formatCurrency(stats.monthlySubscriptionCost)}/mois</strong> en abonnements 
                    ({formatCurrency(stats.annualSubscriptionCost)}/an). Sur 5 ans, cela représente{" "}
                    <strong className="text-emerald-400">{formatCurrency(stats.savingsProjection5y)}</strong> — 
                    l'équivalent d'un voyage, d'un investissement ou d'une épargne solide.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); loadStats(); }} />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    sky: "from-sky-500/20 to-sky-600/10 border-sky-500/20 text-sky-400",
    indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400",
    violet: "from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
  };
  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${colorMap[color]} transition-all hover:scale-[1.02]`}>
      <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-wide">{label}</p>
      <p className="font-display text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}
