import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from "lucide-react";
import { auth } from "@/auth";
import { getOrderByNumber } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_STYLES, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";

type Props = { params: Promise<{ ref: string }> };

type ShippingAddress = {
  fullName: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
  phone?: string;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { ref } = await params;
  return { title: `Commande ${ref}` };
}

export default async function OrderDetailPage({ params }: Props) {
  const { ref } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const order = await getOrderByNumber(ref);
  if (!order || order.userId !== session.user.id) notFound();

  let shipping: ShippingAddress | null = null;
  try {
    shipping = JSON.parse(order.shippingAddress) as ShippingAddress;
  } catch {
    shipping = null;
  }

  const itemsCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const statusClass = ORDER_STATUS_STYLES[order.status] ?? ORDER_STATUS_STYLES.PENDING;
  const statusLabel = ORDER_STATUS_LABEL[order.status] ?? order.status;

  return (
    <div className="space-y-4">
      <Link
        href="/compte/commandes"
        className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-primary transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Mes commandes
      </Link>

      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 grid place-items-center bg-primary/10 border border-primary/20 text-primary rounded-xl shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-xs text-primary mb-0.5">{order.number}</div>
            <h1 className="text-2xl font-extrabold tracking-tight truncate">
              {itemsCount} article{itemsCount > 1 ? "s" : ""} · {formatPrice(order.total)}
            </h1>
            <div className="text-xs text-foreground-muted">
              Passée le{" "}
              {order.createdAt.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Europe/Brussels",
              })}
            </div>
          </div>
        </div>
        <span
          className={`inline-flex px-3 py-1.5 text-xs font-bold rounded border ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Items */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-extrabold tracking-tight mb-4">Articles commandés</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="bg-surface-2 border border-border rounded-xl p-4 flex items-center gap-4"
            >
              <Link
                href={`/produit/${item.product.slug}`}
                className="h-16 w-16 shrink-0 rounded-lg bg-surface border border-border overflow-hidden grid place-items-center"
              >
                {item.product.primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.primaryImage}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-6 w-6 text-foreground-muted" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                {item.product.brand?.name && (
                  <div className="text-[10px] text-foreground-muted uppercase tracking-widest font-semibold">
                    {item.product.brand.name}
                  </div>
                )}
                <Link
                  href={`/produit/${item.product.slug}`}
                  className="font-semibold hover:text-primary transition line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <div className="text-sm text-foreground-muted mt-1">
                  {formatPrice(item.unitPrice)} l&apos;unité · Quantité {item.quantity}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-extrabold">{formatPrice(item.total)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adresse */}
      {shipping && (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="font-extrabold tracking-tight">Adresse de livraison</h2>
          </div>
          <address className="not-italic text-sm leading-relaxed">
            <div className="font-semibold">{shipping.fullName}</div>
            <div>{shipping.line1}</div>
            {shipping.line2 && <div>{shipping.line2}</div>}
            <div>
              {shipping.postalCode} {shipping.city}
            </div>
            <div>{shipping.country}</div>
            {shipping.phone && (
              <div className="text-foreground-muted mt-1">{shipping.phone}</div>
            )}
          </address>
        </div>
      )}

      {/* Suivi */}
      {(order.carrier || order.trackingNumber) && (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="h-4 w-4 text-primary" />
            <h2 className="font-extrabold tracking-tight">Suivi du colis</h2>
          </div>
          <dl className="text-sm space-y-1.5">
            {order.carrier && (
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-muted">Transporteur</dt>
                <dd className="font-semibold">{order.carrier}</dd>
              </div>
            )}
            {order.trackingNumber && (
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-muted">Numéro de suivi</dt>
                <dd className="font-mono">{order.trackingNumber}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Récap paiement */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="font-extrabold tracking-tight">Paiement</h2>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground-muted">Sous-total</dt>
            <dd className="font-semibold">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground-muted">Livraison</dt>
            <dd className="font-semibold">
              {order.shippingCost === 0 ? (
                <span className="text-emerald-400">Offerte</span>
              ) : (
                formatPrice(order.shippingCost)
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground-muted">Méthode</dt>
            <dd className="font-semibold">{order.paymentMethod}</dd>
          </div>
        </dl>
        <div className="border-t border-border mt-4 pt-4 flex justify-between items-baseline">
          <span className="font-bold">Total</span>
          <span className="text-2xl font-extrabold text-primary">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* Zone d'action — annulation possible uniquement tant que la commande est PENDING */}
      {order.status === "PENDING" && (
        <div className="bg-surface border border-red-500/20 rounded-2xl p-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h2 className="font-extrabold tracking-tight mb-1">
              Annuler cette commande
            </h2>
            <p className="text-sm text-foreground-muted max-w-xl">
              Tant que la commande est en attente de paiement, vous pouvez
              l&apos;annuler. Les articles seront remis en stock et le statut
              passera à <span className="font-semibold">Annulée</span>.
            </p>
          </div>
          <CancelOrderButton orderNumber={order.number} />
        </div>
      )}
    </div>
  );
}
