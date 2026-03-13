
"use client";
import { useState, useRef } from "react";

export default function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ transactionsImported: number; subscriptionsDetected: number } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur lors du traitement"); setUploading(false); return; }
      setResult(data);
      setUploading(false);
    } catch {
      setError("Erreur réseau. Réessayez.");
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-8 relative animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800">×</button>
        
        <h2 className="font-display text-2xl font-bold text-white mb-2">Importer un relevé</h2>
        <p className="text-slate-400 text-sm mb-6">Formats supportés : CSV, Excel (.xlsx), PDF</p>

        {!result ? (
          <>
            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragging ? "border-sky-400 bg-sky-500/10" : "border-slate-700 hover:border-slate-500"}`}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden"
                onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
              
              {file ? (
                <div>
                  <div className="text-3xl mb-3">📄</div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-slate-400 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-3">📁</div>
                  <p className="text-slate-300 font-medium mb-1">Glissez votre fichier ici</p>
                  <p className="text-slate-500 text-sm">ou cliquez pour sélectionner</p>
                </div>
              )}
            </div>

            {error && <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 glass px-4 py-3 rounded-xl text-slate-400 hover:text-white transition-colors">
                Annuler
              </button>
              <button onClick={handleUpload} disabled={!file || uploading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Analyse en cours...
                  </span>
                ) : "Analyser"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-display text-xl font-bold text-white mb-3">Analyse terminée !</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass p-4 rounded-xl">
                <p className="text-2xl font-bold text-sky-400">{result.transactionsImported}</p>
                <p className="text-slate-400 text-sm mt-1">Transactions importées</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <p className="text-2xl font-bold text-indigo-400">{result.subscriptionsDetected}</p>
                <p className="text-slate-400 text-sm mt-1">Abonnements détectés</p>
              </div>
            </div>
            <button onClick={onSuccess} className="btn-primary w-full">Voir le tableau de bord</button>
          </div>
        )}
      </div>
    </div>
  );
}
