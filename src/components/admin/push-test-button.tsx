"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";

/**
 * Bouton pour déclencher un push de test à soi-même.
 * Affiche un message inline succès/erreur, sans recharger la page.
 */
export function PushTestButton() {
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/push/test", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        sent?: number;
        total?: number;
      };
      if (!res.ok || !json.ok) {
        setMsg({
          kind: "err",
          text: json.error ?? `Erreur ${res.status}`,
        });
      } else {
        setMsg({
          kind: "ok",
          text: `Envoyé à ${json.sent}/${json.total} appareil${(json.total ?? 0) > 1 ? "s" : ""}.`,
        });
      }
    } catch (err) {
      setMsg({
        kind: "err",
        text: err instanceof Error ? err.message : "Erreur réseau",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface-2 border border-border hover:border-primary text-foreground rounded-lg text-sm font-semibold transition disabled:opacity-50"
      >
        <BellRing className="h-4 w-4" />
        {busy ? "Envoi…" : "Envoyer un push test"}
      </button>
      {msg && (
        <span
          className={`text-xs font-medium ${msg.kind === "ok" ? "text-emerald-400" : "text-primary"}`}
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}
