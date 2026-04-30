import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { getAdminAllOrders } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Commandes" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PREPARING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  SHIPPED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DELIVERED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  CANCELLED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  REFUNDED: "bg-primary/10 text-primary border-primary/30",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  PREPARING: "Préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function AdminCommandesPage({ searchParams }: Props) {
  const { q = "", status = "" } = await searchParams;
  const all = await getAdminAllOrders();
  const filtered = all
    .filter((o) => (status ? o.status === status : true))
    .filter((o) => {
      if (!q) return true;
      const needle = q.toLowerCase();
      const userName = `${o.user?.firstName ?? ""} ${o.user?.lastName ?? ""}`.trim();
      return (
        o.number.toLowerCase().includes(needle) ||
        (o.user?.email ?? o.guestEmail ?? "").toLowerCase().includes(needle) ||
        userName.toLowerCase().includes(needle)
      );
    });

  const totalAll = all.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Commandes</h1>
          <p className="text-sm text-foreground-muted">
            {all.length} commande{all.length > 1 ? "s" : ""} · {formatPrice(totalAll)} cumulés
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <form className="flex-1 min-w-[240px] relative">
            {status && <input type="hidden" name="status" value={status} />}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher par numéro, email, nom…"
              className="w-full pl-9 pr-3.5 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
            />
          </form>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              ["", "Toutes"],
              ["PENDING", "En attente"],
              ["PAID", "Payées"],
              ["PREPARING", "Préparation"],
              ["SHIPPED", "Expédiées"],
              ["DELIVERED", "Livrées"],
              ["CANCELLED", "Annulées"],
            ].map(([code, label]) => {
              const params = new URLSearchParams();
              if (code) params.set("status", code);
              if (q) params.set("q", q);
              const href = `/admin/commandes${params.toString() ? `?${params}` : ""}`;
              const active = status === code;
              return (
                <Link
                  key={code}
                  href={href}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-2 border-border text-foreground-muted hover:border-primary"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr className="text-left text-xs uppercase tracking-wider text-foreground-muted">
                <th className="px-4 py-3 font-semibold">N°</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Articles</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-foreground-muted">
                    Aucune commande.
                  </td>
                </tr>
              )}
              {filtered.map((o) => {
                const itemsCount = o.items.reduce((n, i) => n + i.quantity, 0);
                const customer =
                  `${o.user?.firstName ?? ""} ${o.user?.lastName ?? ""}`.trim() ||
                  o.user?.email ||
                  o.guestEmail ||
                  "Invité";
                return (
                  <tr key={o.id} className="border-t border-border hover:bg-surface-2 transition group">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/admin/commandes/${o.number}`} className="text-primary hover:underline">
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{customer}</div>
                      <div className="text-xs text-foreground-muted">
                        {o.user?.email ?? o.guestEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{itemsCount}</td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          STATUS_STYLES[o.status] ?? STATUS_STYLES.PENDING
                        }`}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">
                      {o.createdAt.toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/commandes/${o.number}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition"
                        aria-label="Détail"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
