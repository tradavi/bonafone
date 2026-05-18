"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Search, ArrowRight, X } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  RECU: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  DIAGNOSTIC: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  DEVIS_VALIDE: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  EN_REPARATION: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  ATTENTE_PIECE: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  PRET_RECUPERATION: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  TERMINE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  RESTITUE: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  IRREPARABLE: "bg-primary/10 text-primary border-primary/30",
};

export type RepairRow = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string | null;
  brand: string;
  model: string;
  issueType: string;
  status: string;
  depositedAtIso: string | null;
};

/**
 * Liste des réparations avec filtre temps réel : la recherche filtre en
 * mémoire au fur et à mesure de la frappe (pas de bouton à cliquer, pas de
 * navigation URL).
 */
export function RepairsSearchTable({ items }: { items: RepairRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter(
      (r) =>
        r.number.toLowerCase().includes(needle) ||
        r.customerName.toLowerCase().includes(needle) ||
        (r.customerEmail ?? "").toLowerCase().includes(needle) ||
        r.brand.toLowerCase().includes(needle) ||
        r.model.toLowerCase().includes(needle) ||
        r.issueType.toLowerCase().includes(needle),
    );
  }, [items, q]);

  return (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Numéro, code-barres (REP-…), client, email, appareil…"
              autoComplete="off"
              autoFocus
              className="w-full pl-9 pr-9 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded hover:bg-surface text-foreground-muted hover:text-primary transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-foreground-muted whitespace-nowrap">
            {filtered.length} dossier{filtered.length > 1 ? "s" : ""}
            {q && ` · "${q}"`}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr className="text-left text-xs uppercase tracking-wider text-foreground-muted">
              <th className="px-4 py-3 font-semibold">N°</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Appareil</th>
              <th className="px-4 py-3 font-semibold">Panne</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Déposé</th>
              <th className="px-4 py-3 font-semibold w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-foreground-muted">
                  {q ? `Aucun dossier ne correspond à « ${q} ».` : "Aucun dossier trouvé."}
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-t border-border hover:bg-surface-2 transition"
              >
                <td className="px-4 py-3 font-mono text-xs">
                  <Link
                    href={`/admin/reparations/${r.number}`}
                    className="text-primary hover:underline"
                  >
                    {r.number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.customerName}</div>
                  <div className="text-xs text-foreground-muted">{r.customerEmail}</div>
                </td>
                <td className="px-4 py-3">
                  {r.brand} {r.model}
                </td>
                <td className="px-4 py-3 text-foreground-muted">{r.issueType}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      STATUS_STYLES[r.status] ?? STATUS_STYLES.RECU
                    }`}
                  >
                    {r.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground-muted text-xs">
                  {r.depositedAtIso
                    ? new Date(r.depositedAtIso).toLocaleDateString("fr-FR", { timeZone: "Europe/Brussels" })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/reparations/${r.number}`}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition"
                    aria-label="Détail"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
