import Link from "next/link";
import { Plus, Search, ArrowRight, FileText } from "lucide-react";
import { getAllRepairs, countDevisRequests } from "@/lib/queries";

export const metadata = { title: "Réparations" };
export const dynamic = "force-dynamic";

const STATUSES = [
  { code: "RECU", label: "Reçu" },
  { code: "DIAGNOSTIC", label: "Diagnostic" },
  { code: "DEVIS_VALIDE", label: "Devis validé" },
  { code: "EN_REPARATION", label: "En réparation" },
  { code: "ATTENTE_PIECE", label: "Attente pièce" },
  { code: "TERMINE", label: "Terminé" },
  { code: "PRET_RECUPERATION", label: "À récupérer" },
  { code: "RESTITUE", label: "Restitué" },
  { code: "IRREPARABLE", label: "Irréparable" },
];

const STATUS_STYLES: Record<string, string> = {
  RECU: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  DIAGNOSTIC: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  DEVIS_VALIDE: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  EN_REPARATION: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  ATTENTE_PIECE: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  TERMINE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  PRET_RECUPERATION: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  RESTITUE: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  IRREPARABLE: "bg-primary/10 text-primary border-primary/30",
};

type Props = { searchParams: Promise<{ q?: string; status?: string; archived?: string }> };

export default async function AdminReparationsPage({ searchParams }: Props) {
  const { q = "", status = "", archived } = await searchParams;
  const [all, devisCount] = await Promise.all([getAllRepairs(), countDevisRequests()]);
  const showArchived = archived === "1";

  const filtered = all
    .filter((r) =>
      showArchived
        ? r.status === "RESTITUE" || r.status === "IRREPARABLE"
        : r.status !== "RESTITUE" && r.status !== "IRREPARABLE",
    )
    .filter((r) => (status ? r.status === status : true))
    .filter((r) => {
      if (!q) return true;
      const needle = q.toLowerCase();
      return (
        r.number.toLowerCase().includes(needle) ||
        r.customerName.toLowerCase().includes(needle) ||
        (r.customerEmail ?? "").toLowerCase().includes(needle) ||
        r.brand.toLowerCase().includes(needle) ||
        r.model.toLowerCase().includes(needle) ||
        r.issueType.toLowerCase().includes(needle)
      );
    });

  const activeCount = all.filter(
    (r) => r.status !== "RESTITUE" && r.status !== "IRREPARABLE",
  ).length;
  const archivedCount = all.length - activeCount;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Réparations</h1>
          <p className="text-sm text-foreground-muted">
            {activeCount} actif{activeCount > 1 ? "s" : ""} · {archivedCount} archivé
            {archivedCount > 1 ? "s" : ""} · appareils physiquement reçus en boutique.
          </p>
        </div>
        <Link
          href="/admin/reparations/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
        >
          <Plus className="h-4 w-4" />
          Nouveau dossier
        </Link>
      </div>

      {devisCount > 0 && (
        <Link
          href="/admin/devis"
          className="block bg-surface border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 rounded-2xl p-4 transition group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  {devisCount} demande{devisCount > 1 ? "s" : ""} de devis en attente
                </div>
                <div className="text-xs text-foreground-muted">
                  Appareils pas encore déposés en boutique — gérer dans « Demandes de devis ».
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-amber-400 transition" />
          </div>
        </Link>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <form className="flex-1 min-w-[240px] relative">
              {status && <input type="hidden" name="status" value={status} />}
              {showArchived && <input type="hidden" name="archived" value="1" />}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Rechercher par numéro, client, email, appareil…"
                className="w-full pl-9 pr-3.5 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
              />
            </form>
            <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
              <Link
                href={buildUrl({ q })}
                className={`px-3 py-2 ${
                  !showArchived ? "bg-primary text-white" : "bg-surface-2 hover:bg-surface text-foreground-muted"
                }`}
              >
                Actifs
              </Link>
              <Link
                href={buildUrl({ q, archived: "1" })}
                className={`px-3 py-2 ${
                  showArchived ? "bg-primary text-white" : "bg-surface-2 hover:bg-surface text-foreground-muted"
                }`}
              >
                Archivés
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={buildUrl({ q, archived: showArchived ? "1" : undefined })}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                !status
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-2 border-border text-foreground-muted hover:border-primary"
              }`}
            >
              Tous
            </Link>
            {STATUSES.filter((s) =>
              showArchived
                ? s.code === "RESTITUE" || s.code === "IRREPARABLE"
                : s.code !== "RESTITUE" && s.code !== "IRREPARABLE",
            ).map((s) => (
              <Link
                key={s.code}
                href={buildUrl({ q, status: s.code, archived: showArchived ? "1" : undefined })}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  status === s.code
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-2 border-border text-foreground-muted hover:border-primary"
                }`}
              >
                {s.label}
              </Link>
            ))}
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
                    Aucun dossier trouvé.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-surface-2 transition group">
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
                    {r.depositedAt ? r.depositedAt.toLocaleDateString("fr-FR") : "—"}
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
      </div>
    </div>
  );
}

function buildUrl(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return `/admin/reparations${qs ? `?${qs}` : ""}`;
}
