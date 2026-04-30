import { Euro, ShoppingBag, Wrench, Star, AlertCircle, MessageSquare, Package, TrendingUp } from "lucide-react";
import { getAdvancedKpis } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Statistiques" };
export const dynamic = "force-dynamic";

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
const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  PREPARING: "Préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export default async function AdminStatsPage() {
  const k = await getAdvancedKpis();
  const maxRevenue = Math.max(1, ...k.salesByDay.map((d) => d.revenue));

  const KPIS = [
    { label: "CA total", value: formatPrice(k.revenue.total), icon: Euro },
    { label: "CA ce mois", value: formatPrice(k.revenue.month), icon: TrendingUp },
    { label: "Panier moyen", value: formatPrice(k.revenue.avgBasket), icon: ShoppingBag },
    { label: "Commandes (total)", value: k.revenue.ordersCount.toString(), icon: ShoppingBag },
    { label: "Réparations actives", value: k.repairs.active.toString(), icon: Wrench },
    { label: "Coût moyen réparation", value: formatPrice(k.repairs.avgFinalCost), icon: Wrench },
    {
      label: "Note moyenne",
      value: k.reviews.count > 0 ? `${k.reviews.avg.toFixed(1)} / 5` : "—",
      icon: Star,
    },
    { label: "Réclamations à traiter", value: k.counts.pendingReclamations.toString(), icon: AlertCircle },
    { label: "Messages reçus", value: k.counts.unreadMessages.toString(), icon: MessageSquare },
    { label: "Produits actifs", value: k.counts.products.toString(), icon: Package },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-48 w-48 bg-primary/15 blur-3xl rounded-full" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Statistiques</h1>
          <p className="text-foreground-muted">
            Indicateurs temps réel — recalculés à chaque chargement.
          </p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 grid place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold">{value}</div>
            <div className="text-[11px] text-foreground-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Sales by day chart */}
        <div className="bg-surface border border-border rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold tracking-tight">CA — 30 derniers jours</h2>
            <div className="text-sm text-foreground-muted">
              {formatPrice(k.revenue.last30d)} · {k.revenue.last30dCount} commandes
            </div>
          </div>
          <div className="h-48 flex items-end gap-1.5">
            {k.salesByDay.map((d) => {
              const heightPct = (d.revenue / maxRevenue) * 100;
              return (
                <div
                  key={d.day}
                  className="flex-1 group relative flex items-end"
                  style={{ height: "100%" }}
                  title={`${d.day} — ${formatPrice(d.revenue)} (${d.count} cmd.)`}
                >
                  <div
                    className="w-full rounded-t bg-primary/30 hover:bg-primary transition relative"
                    style={{ height: `${Math.max(heightPct, d.revenue > 0 ? 4 : 0)}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 bg-surface border border-border rounded-md px-2 py-1 text-[10px] whitespace-nowrap shadow-lg z-10">
                      <div className="font-bold">{formatPrice(d.revenue)}</div>
                      <div className="text-foreground-muted">{d.day}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-foreground-muted">
            <span>{k.salesByDay[0]?.day}</span>
            <span>{k.salesByDay[k.salesByDay.length - 1]?.day}</span>
          </div>
        </div>

        {/* Repairs by status */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-extrabold tracking-tight mb-4">Réparations par statut</h2>
          <Distribution
            data={k.repairs.byStatus.map((s) => ({
              label: REPAIR_STATUS_LABEL[s.status] ?? s.status,
              value: s.count,
            }))}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-extrabold tracking-tight mb-4">Top 5 produits (quantité vendue)</h2>
          {k.topProducts.length === 0 ? (
            <p className="text-sm text-foreground-muted text-center py-8">
              Aucune vente enregistrée pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {k.topProducts.map((p, i) => (
                <div key={p.slug ?? i} className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 grid place-items-center rounded-lg bg-primary/10 text-primary font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name ?? "(produit supprimé)"}</div>
                    <div className="text-xs text-foreground-muted">
                      {p.brand?.name ?? "—"} · {formatPrice(Number(p.revenue))}
                    </div>
                  </div>
                  <div className="font-bold">{p.quantity}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-extrabold tracking-tight mb-4">Commandes par statut</h2>
          <Distribution
            data={k.orders.byStatus.map((s) => ({
              label: ORDER_STATUS_LABEL[s.status] ?? s.status,
              value: s.count,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function Distribution({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-foreground-muted text-center py-8">Aucune donnée.</p>;
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
