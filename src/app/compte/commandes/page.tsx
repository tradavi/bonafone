import Link from "next/link";
import { ShoppingBag, Plus, Package, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { getOrdersByUser } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_STYLES, ORDER_STATUS_LABEL } from "@/lib/order-status";

export const metadata = { title: "Mes commandes" };
export const dynamic = "force-dynamic";

export default async function CommandesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await getOrdersByUser(session.user.id);

  if (orders.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-10 text-center">
        <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Mes commandes</h1>
        <p className="text-foreground-muted mb-6">
          Vous n&apos;avez pas encore passé de commande.
        </p>
        <Link
          href="/boutique"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
        >
          <Plus className="h-4 w-4" />
          Voir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Mes commandes</h1>
          <p className="text-sm text-foreground-muted">
            {orders.length} commande{orders.length > 1 ? "s" : ""} enregistrée
            {orders.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Link
          href="/boutique"
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border hover:border-primary rounded-lg text-sm font-semibold transition"
        >
          <Plus className="h-4 w-4" />
          Nouvelle commande
        </Link>
      </div>

      <div className="grid gap-3">
        {orders.map((order) => {
          const itemsCount = order.items.reduce((n, i) => n + i.quantity, 0);
          return (
            <Link
              key={order.id}
              href={`/compte/commandes/${order.number}`}
              className="bg-surface border border-border hover:border-primary rounded-2xl p-5 flex items-center justify-between gap-4 transition"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 grid place-items-center bg-primary/10 border border-primary/20 text-primary rounded-xl shrink-0">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-xs text-primary mb-0.5">{order.number}</div>
                  <div className="font-bold truncate">
                    {itemsCount} article{itemsCount > 1 ? "s" : ""} · {formatPrice(order.total)}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {order.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Europe/Brussels",
                    })}
                    {" · "}
                    {order.items
                      .slice(0, 2)
                      .map((it) => it.product.name)
                      .join(", ")}
                    {order.items.length > 2 && ` +${order.items.length - 2}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded border ${
                    ORDER_STATUS_STYLES[order.status] ?? ORDER_STATUS_STYLES.PENDING
                  }`}
                >
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </span>
                <ArrowRight className="h-4 w-4 text-foreground-muted" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
