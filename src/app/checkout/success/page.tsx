import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight, ShoppingBag } from "lucide-react";
import { getOrderByNumber } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { ClearCartOnMount } from "@/components/checkout/clear-cart-on-mount";

export const metadata = { title: "Commande confirmée" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  if (!ref) notFound();

  const order = await getOrderByNumber(ref);
  if (!order) notFound();

  const address = parseAddress(order.shippingAddress);

  return (
    <div className="bg-background py-20">
      <ClearCartOnMount />
      <div className="mx-auto max-w-2xl px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute -top-32 -right-32 h-64 w-64 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />
          <div className="relative">
            <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-5">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
              Merci pour votre commande !
            </h1>
            <p className="text-foreground-muted mb-6">
              Un email de confirmation va vous être envoyé. Notre équipe prépare votre colis.
            </p>

            <div className="bg-surface-2 border border-border rounded-xl p-5 mb-6 text-left">
              <div className="text-xs text-foreground-muted uppercase tracking-wider font-semibold mb-3">
                Numéro de commande
              </div>
              <div className="font-mono text-2xl font-bold text-primary mb-4">
                {order.number}
              </div>

              <ul className="space-y-2 mb-4 text-sm">
                {order.items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-3">
                    <span className="text-foreground-muted truncate">
                      {it.quantity} × {it.product.name}
                    </span>
                    <span className="font-semibold">{formatPrice(it.total)}</span>
                  </li>
                ))}
              </ul>

              <dl className="space-y-1 text-sm border-t border-border pt-3">
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
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-extrabold">{formatPrice(order.total)}</dd>
                </div>
              </dl>

              {address && (
                <div className="mt-4 pt-4 border-t border-border text-sm">
                  <div className="text-xs text-foreground-muted uppercase tracking-wider font-semibold mb-1.5">
                    Livraison
                  </div>
                  <div className="leading-relaxed">
                    <div className="font-medium">{address.fullName}</div>
                    <div className="text-foreground-muted">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </div>
                    <div className="text-foreground-muted">
                      {address.postalCode} {address.city}, {address.country}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/compte/commandes"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
              >
                <ShoppingBag className="h-4 w-4" />
                Mes commandes
              </Link>
              <Link
                href="/boutique"
                className="inline-flex items-center gap-2 px-5 py-3 bg-surface-2 border border-border hover:border-primary rounded-lg font-semibold transition"
              >
                Continuer mes achats
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ParsedAddress = {
  fullName: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
};

function parseAddress(raw: string): ParsedAddress | null {
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === "object" && "fullName" in v) return v as ParsedAddress;
    return null;
  } catch {
    return null;
  }
}
