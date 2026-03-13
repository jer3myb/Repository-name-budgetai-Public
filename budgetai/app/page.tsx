// BudgetAI — Landing Page
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L6 8L9 11L14 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display font-bold text-lg text-white">BudgetAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm">Connexion</Link>
          <Link href="/register" className="btn-primary text-sm px-5 py-2.5">Commencer gratuitement</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-sky-500/5 blur-3xl" />
          <div className="absolute top-2/3 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Analyse IA de vos finances
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
            Reprenez le contrôle de
            <span className="gradient-text block">vos finances</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Importez votre relevé bancaire. BudgetAI détecte automatiquement vos abonnements, 
            analyse vos dépenses et vous aide à économiser grâce à l'intelligence artificielle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base px-8 py-4">
              Analyser mes finances — Gratuit
            </Link>
            <Link href="/login" className="glass-card px-8 py-4 text-slate-300 hover:text-white transition-colors text-base font-medium rounded-xl">
              J'ai déjà un compte
            </Link>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="relative mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {[
            {
              icon: "📊", title: "Analyse automatique",
              desc: "Importez CSV, Excel ou PDF. L'IA extrait et classe chaque transaction.",
            },
            {
              icon: "🔍", title: "Détection d'abonnements",
              desc: "Netflix, Spotify, Amazon Prime... Identifiez tous vos paiements récurrents.",
            },
            {
              icon: "💰", title: "Simulateur d'épargne",
              desc: "Calculez combien vous pourriez économiser en annulant certains abonnements.",
            },
          ].map((f) => (
            <div key={f.title} className="stat-card text-left group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display font-semibold text-white mb-2 text-lg">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* SUBSCRIPTION TABLE PREVIEW */}
        <div className="relative mt-16 max-w-3xl mx-auto w-full">
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-white mb-4 text-lg">Exemple de détection</h3>
            <div className="space-y-3">
              {[
                { name: "Netflix", amount: 13.49, annual: 161.88, color: "bg-red-500" },
                { name: "Spotify", amount: 10.99, annual: 131.88, color: "bg-green-500" },
                { name: "Amazon Prime", amount: 6.99, annual: 83.88, color: "bg-yellow-500" },
                { name: "Disney+", amount: 8.99, annual: 107.88, color: "bg-blue-500" },
              ].map((sub) => (
                <div key={sub.name} className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${sub.color}`} />
                    <span className="text-slate-200 font-medium">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <span className="text-slate-400">{sub.amount.toFixed(2)} €/mois</span>
                    <span className="text-slate-400">{sub.annual.toFixed(2)} €/an</span>
                    <span className="text-xs text-sky-400 bg-sky-500/10 px-3 py-1 rounded-lg">Résilier →</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between">
              <span className="text-slate-400 text-sm">Total mensuel :</span>
              <span className="text-white font-semibold">40,46 € · <span className="text-slate-400 font-normal">485,52 €/an</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/60 px-8 py-6 text-center text-slate-500 text-sm">
        © 2024 BudgetAI — Vos données restent privées et sécurisées.
      </footer>
    </main>
  );
}
