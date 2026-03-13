
"use client";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_LABELS, CATEGORY_COLORS, type Category } from "@/types";

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: Category;
  isSubscription: boolean;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  async function load(p = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: p.toString(), limit: "30" });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }

  useEffect(() => { load(1); setPage(1); }, [search, category]);

  const categories = Object.keys(CATEGORY_LABELS) as Category[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Transactions</h1>
        <p className="text-slate-400 mt-1">{total} transaction{total !== 1 ? "s" : ""} au total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" placeholder="Rechercher un commerçant..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1" />
        <select value={category} onChange={e => setCategory(e.target.value)} className="input-field sm:w-52">
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-slate-400">Aucune transaction trouvée</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-800/60 text-xs uppercase tracking-wide text-slate-500">
              <div className="col-span-2">Date</div>
              <div className="col-span-4">Commerçant</div>
              <div className="col-span-3">Catégorie</div>
              <div className="col-span-2 text-right">Montant</div>
              <div className="col-span-1" />
            </div>
            <div className="divide-y divide-slate-800/40">
              {transactions.map(tx => (
                <div key={tx.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-800/20 transition-colors items-center">
                  <div className="col-span-12 md:col-span-2 text-sm text-slate-400">{formatDate(tx.date)}</div>
                  <div className="col-span-12 md:col-span-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-200 truncate">{tx.merchant}</p>
                      {tx.isSubscription && <span className="badge bg-indigo-500/15 text-indigo-400">Abo</span>}
                    </div>
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <span className="badge text-xs" style={{ backgroundColor: `${CATEGORY_COLORS[tx.category]}20`, color: CATEGORY_COLORS[tx.category] }}>
                      {CATEGORY_LABELS[tx.category]}
                    </span>
                  </div>
                  <div className={`col-span-6 md:col-span-2 text-right font-semibold ${tx.amount < 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {tx.amount < 0 ? "-" : "+"}{formatCurrency(Math.abs(tx.amount))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => { const p = page - 1; setPage(p); load(p); }} disabled={page === 1}
            className="btn-ghost disabled:opacity-30">← Précédent</button>
          <span className="text-slate-400 text-sm">Page {page} / {totalPages}</span>
          <button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={page === totalPages}
            className="btn-ghost disabled:opacity-30">Suivant →</button>
        </div>
      )}
    </div>
  );
}
