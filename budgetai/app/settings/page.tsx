
"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user));
  }, []);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 mt-1">Gérez votre compte</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-white">Profil</h2>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
          <input type="text" defaultValue={user?.name || ""} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input type="email" defaultValue={user?.email || ""} className="input-field" disabled />
        </div>
        <button className="btn-primary">Sauvegarder</button>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-white">Sécurité</h2>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nouveau mot de passe</label>
          <input type="password" className="input-field" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Confirmer le mot de passe</label>
          <input type="password" className="input-field" placeholder="••••••••" />
        </div>
        <button className="btn-primary">Changer le mot de passe</button>
      </div>

      <div className="glass-card p-6 border border-red-500/20">
        <h2 className="font-display font-semibold text-red-400 mb-3">Zone dangereuse</h2>
        <p className="text-slate-400 text-sm mb-4">Supprimer toutes vos données de transactions et abonnements.</p>
        <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm">
          Supprimer mes données
        </button>
      </div>
    </div>
  );
}
