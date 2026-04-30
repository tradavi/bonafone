import Link from "next/link";
import {
  Wrench,
  Package,
  AlertCircle,
  Clock,
  FileText,
  ArrowRight,
  Star,
  MessageSquare,
  Smile,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  getRepairsDashboardKpis,
  getActiveRepairs,
  getLowStockProducts,
  countDevisRequests,
} from "@/lib/queries";

export const metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  RECU: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DIAGNOSTIC: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  DEVIS_VALIDE: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  EN_REPARATION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ATTENTE_PIECE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  TERMINE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PRET_RECUPERATION: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  RESTITUE: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  IRREPARABLE: "bg-primary/10 text-primary border-primary/30",
};

const REPAIR_STATUS_LABEL: Record<string, string> = {
  RECU: "Reçu",
  DIAGNOSTIC: "Diagnostic",
  DEVIS_VALIDE: "Devis validé",
  EN_REPARATION: "En réparation",
  ATTENTE_PIECE: "Attente pièce",
  TERMINE: "Terminé",
  PRET_RECUPERATION: "À récupérer",
  RESTITUE: "Restitué",
  IRREPARABLE: "Irréparable",
};

function daysSince(d: Date) {
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminDashboard() {
  const [kpis, activeRepairs, lowStock, devisCount] = await Promise.all([
    getRepairsDashboardKpis(),
    getActiveRepairs(5),
    getLowStockProducts(),
    countDevisRequests(),
  ]);

  const KPI = [
    {
      label: "Clients heureux",
      value: kpis.happyClientsCount.toString(),
      icon: Smile,
      hint: "Réparations terminées & restituées",
    },
    {
      label: "Réparations actives",
      value: kpis.activeRepairsCount.toString(),
      icon: Wrench,
    },
    {
      label: "Demandes de devis",
      value: devisCount.toString(),
      icon: FileText,
    },
    {
      label: "Coût moyen réparation",
      value:
        kpis.totalRepairs > 0 && kpis.avgFinalCost > 0
          ? formatPrice(kpis.avgFinalCost)
          : "—",
      icon: Wrench,
    },
    {
      label: "Note moyenne",
      value:
        kpis.reviewsCount > 0 ? `${kpis.reviewsAvg.toFixed(1)} / 5` : "—",
      icon: Star,
    },
    {
      label: "Réclamations à traiter",
      value: kpis.pendingReclamations.toString(),
      icon: AlertCircle,
    },
    {
      label: "Messages reçus",
      value: kpis.unreadMessages.toString(),
      icon: MessageSquare,
    },
    {
      label: "Produits actifs",
      value: kpis.productsCount.toString(),
      icon: Package,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-48 w-48 bg-primary/15 blur-3xl rounded-full" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-foreground-muted">
            Vue d&apos;ensemble du service de réparation Bonafone.
          </p>
        </div>
      </div>

      {/* Bandeau demandes de devis en attente */}
      {devisCount > 0 && (
        <Link
          href="/admin/devis"
          className="block bg-surface border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 rounded-2xl p-4 transition group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 grid place-items-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">
                  {devisCount} demande{devisCount > 1 ? "s" : ""} de devis à traiter
                </div>
                <div className="text-xs text-foreground-muted">
                  Demandes en ligne en attente d&apos;un dépôt physique en boutique.
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-amber-400 transition" />
          </div>
        </Link>
      )}

      {/* KPI réparations + avis */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {KPI.map(({ label, value, icon: Icon, hint }) => (
          <div
            key={label}
            className="bg-surface border border-border rounded-2xl p-5 hover:border-primary transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold">{value}</div>
            <div className="text-xs text-foreground-muted mt-1">{label}</div>
            {hint && (
              <div className="text-[10px] text-foreground-subtle mt-0.5">{hint}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Réparations actives */}
        <div className="bg-surface border border-border rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold tracking-tight">Réparations actives</h2>
            <Link
              href="/admin/reparations"
              className="text-sm text-primary hover:underline font-semibold"
            >
              Voir tout →
            </Link>
          </div>
          <div className="space-y-1.5">
            {activeRepairs.length === 0 && (
              <div className="text-sm text-foreground-muted text-center py-8">
                Aucune réparation active.
              </div>
            )}
            {activeRepairs.map((r) => (
              <Link
                key={r.id}
                href={`/admin/reparations/${r.number}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-2 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-mono text-xs text-primary">{r.number}</div>
                    <div className="text-sm font-medium">
                      {r.brand} {r.model}
                    </div>
                    <div className="text-xs text-foreground-muted">{r.issueType}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      STATUS_STYLES[r.status] ?? STATUS_STYLES.RECU
                    }`}
                  >
                    {r.status.replace(/_/g, " ")}
                  </span>
                  <div className="text-[11px] text-foreground-muted mt-1 flex items-center justify-end gap-1">
                    <Clock className="h-3 w-3" /> J+{daysSince(r.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Distribution réparations par statut */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-extrabold tracking-tight mb-4">Réparations par statut</h2>
          <Distribution
            data={kpis.repairsByStatus.map((s) => ({
              label: REPAIR_STATUS_LABEL[s.status] ?? s.status,
              value: s.count,
            }))}
          />
        </div>
      </div>

      {/* Alertes stock */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <AlertCircle className="h-5 w-5 text-primary" />
          <h2 className="font-extrabold tracking-tight">Alertes stock</h2>
        </div>
        <div className="space-y-2">
          {lowStock.length === 0 ? (
            <div className="text-sm text-foreground-muted text-center py-4">
              Tous les stocks sont OK 🎉
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStock.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg text-sm border-l-2 border-primary bg-primary/10"
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-foreground-muted">
                    {p.stock} restant{p.stock > 1 ? "s" : ""} (seuil : {p.lowStockAt})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Distribution({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-foreground-muted text-center py-8">
        Aucune donnée pour l&apos;instant.
      </p>
    );
  }
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const pct = (d.value / total) * 100;
        return (
          <div key={d.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground-muted">{d.label}</span>
              <span className="font-semibold">
                {d.value} <span className="text-foreground-muted">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2 bg-surface-2 rounded overflow-hidden">
              <div
                className="h-full bg-primary rounded transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
