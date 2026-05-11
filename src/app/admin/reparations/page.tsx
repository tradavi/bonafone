import Link from "next/link";
import { Plus, ArrowRight, FileText } from "lucide-react";
import { getAllRepairs, countDevisRequests } from "@/lib/queries";
import {
  RepairsSearchTable,
  type RepairRow,
} from "@/components/admin/repairs-search-table";

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
  { code: "ATTENTE_RESTITUTION", label: "Devis refusé" },
  { code: "RESTITUE", label: "Restitué" },
  { code: "IRREPARABLE", label: "Irréparable" },
];

type Props = { searchParams: Promise<{ status?: string; archived?: string }> };

export default async function AdminReparationsPage({ searchParams }: Props) {
  const { status = "", archived } = await searchParams;
  const [all, devisCount] = await Promise.all([getAllRepairs(), countDevisRequests()]);
  const showArchived = archived === "1";

  const filtered: RepairRow[] = all
    .filter((r) =>
      showArchived
        ? r.status === "RESTITUE" || r.status === "IRREPARABLE"
        : r.status !== "RESTITUE" && r.status !== "IRREPARABLE",
    )
    .filter((r) => (status ? r.status === status : true))
    .map((r) => ({
      id: r.id,
      number: r.number,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      brand: r.brand,
      model: r.model,
      issueType: r.issueType,
      status: r.status,
      depositedAtIso: r.depositedAt ? r.depositedAt.toISOString() : null,
    }));

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
          {/* Onglets Actifs / Archivés */}
          <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
            <Link
              href="/admin/reparations"
              className={`px-3 py-2 ${
                !showArchived
                  ? "bg-primary text-white"
                  : "bg-surface-2 hover:bg-surface text-foreground-muted"
              }`}
            >
              Actifs
            </Link>
            <Link
              href="/admin/reparations?archived=1"
              className={`px-3 py-2 ${
                showArchived
                  ? "bg-primary text-white"
                  : "bg-surface-2 hover:bg-surface text-foreground-muted"
              }`}
            >
              Archivés
            </Link>
          </div>

          {/* Filtres par statut */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={buildUrl({ archived: showArchived ? "1" : undefined })}
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
                href={buildUrl({ status: s.code, archived: showArchived ? "1" : undefined })}
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

        {/* Recherche temps réel + tableau (client component) */}
        <RepairsSearchTable items={filtered} />
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
