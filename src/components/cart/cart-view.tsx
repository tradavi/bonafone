"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShoppingBag,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

const SHIPPING_FREE_FROM = 50;
const SHIPPING_COST = 5.9;

export function CartView() {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const clearCart = useCart((s) => s.clear);

  // Évite l'hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-center text-foreground-muted">Chargement…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="inline-grid h-20 w-20 place-items-center rounded-2xl bg-surface border border-border mb-6">
          <ShoppingBag className="h-10 w-10 text-foreground-muted" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
          Votre panier est vide
        </h1>
        <p className="text-foreground-muted mb-8">
          Découvrez nos smartphones, tablettes et accessoires.
        </p>
        <Link
          href="/boutique"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_32px_var(--primary-glow)]"
        >
          Voir la boutique
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = subtotal >= SHIPPING_FREE_FROM ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;
  const totalQty = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Mon panier
        </h1>
        <p className="text-foreground-muted text-sm mt-1">
          {totalQty} article{totalQty > 1 ? "s" : ""} · {formatPrice(subtotal)}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4"
            >
              <Link
                href={`/produit/${item.slug}`}
                className="h-20 w-20 shrink-0 rounded-lg bg-surface-2 border border-border overflow-hidden"
              >
                {item.image && (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-foreground-muted uppercase tracking-widest font-semibold">
                  {item.brand}
                </div>
                <Link
                  href={`/produit/${item.slug}`}
                  className="font-semibold hover:text-primary transition line-clamp-2"
                >
                  {item.name}
                </Link>
                <div className="text-sm text-foreground-muted mt-1">
                  {formatPrice(item.price)} l&apos;unité
                </div>
              </div>

              <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg">
                <button
                  type="button"
                  aria-label="Diminuer la quantité"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="h-9 w-9 grid place-items-center hover:text-primary transition"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Augmenter la quantité"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.stock !== undefined && item.quantity >= item.stock}
                  className="h-9 w-9 grid place-items-center hover:text-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="text-right hidden sm:block min-w-24">
                <div className="font-extrabold">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>

              <button
                type="button"
                aria-label="Retirer du panier"
                onClick={() => removeItem(item.productId)}
                className="h-9 w-9 grid place-items-center rounded-lg hover:bg-primary/10 hover:text-primary transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={clearCart}
            className="text-sm text-foreground-muted hover:text-primary transition mt-2"
          >
            Vider le panier
          </button>
        </div>

        {/* Récap */}
        <div className="space-y-4 lg:sticky lg:top-32 self-start">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-extrabold tracking-tight mb-4">Récapitulatif</h2>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground-muted">Sous-total</dt>
                <dd className="font-semibold">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-muted">Livraison</dt>
                <dd className="font-semibold">
                  {shippingCost === 0 ? (
                    <span className="text-emerald-400">Offerte</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </dd>
              </div>
              {shippingCost > 0 && (
                <div className="text-xs text-foreground-muted">
                  Plus que {formatPrice(SHIPPING_FREE_FROM - subtotal)} pour la livraison gratuite
                </div>
              )}
            </dl>

            <div className="border-t border-border mt-4 pt-4 flex justify-between items-baseline">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-extrabold">{formatPrice(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center gap-2 mt-5 px-6 py-3.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_24px_var(--primary-glow)]"
            >
              Procéder au paiement
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/boutique"
              className="block text-center text-sm text-foreground-muted hover:text-primary mt-3 transition"
            >
              Continuer mes achats
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Truck, text: "Livraison rapide" },
              { icon: ShieldCheck, text: "Garantie incluse" },
              { icon: RotateCcw, text: "Retour 14j" },
            ].map(({ icon: Icon, text }) => (
              <div key={text}>
                <Icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <div className="text-[11px] text-foreground-muted">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
