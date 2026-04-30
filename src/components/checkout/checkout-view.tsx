"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowRight, ShoppingBag, Lock, Truck, ShieldCheck } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { createOrder } from "@/lib/actions/checkout";

const SHIPPING_FREE_FROM = 50;
const SHIPPING_COST = 5.9;

type Props = {
  defaultEmail: string;
  defaultName: string;
  isAuthenticated: boolean;
};

export function CheckoutView({ defaultEmail, defaultName, isAuthenticated }: Props) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-foreground-muted">
        Chargement…
      </div>
    );
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
          Ajoutez des produits avant de passer commande.
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const payload = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      shippingAddress: {
        fullName: String(fd.get("fullName") ?? "").trim(),
        line1: String(fd.get("line1") ?? "").trim(),
        line2: String(fd.get("line2") ?? "").trim() || undefined,
        postalCode: String(fd.get("postalCode") ?? "").trim(),
        city: String(fd.get("city") ?? "").trim(),
        country: String(fd.get("country") ?? "Belgique").trim(),
        phone: String(fd.get("phone") ?? "").trim() || undefined,
      },
      email: String(fd.get("email") ?? "").trim(),
    };

    startTransition(async () => {
      const result = await createOrder(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.isExternal) {
        // Stripe Checkout — on quitte le site
        window.location.href = result.redirectUrl;
        return;
      }
      // Mode démo : on vide le panier puis route interne
      clearCart();
      router.push(result.redirectUrl);
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Commande</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Renseignez vos coordonnées de livraison pour finaliser votre achat.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid lg:grid-cols-[1fr_400px] gap-6 items-start"
      >
        {/* Coordonnées */}
        <div className="space-y-6">
          <section className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-extrabold tracking-tight mb-4">Contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email" name="email" type="email" required defaultValue={defaultEmail} />
              <Field label="Téléphone (optionnel)" name="phone" type="tel" />
            </div>
            {!isAuthenticated && (
              <p className="text-xs text-foreground-muted mt-3">
                <Link href="/connexion?callbackUrl=/checkout" className="text-primary hover:underline">
                  Se connecter
                </Link>
                {" "}pour retrouver votre commande dans votre espace client.
              </p>
            )}
          </section>

          <section className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-extrabold tracking-tight mb-4">Adresse de livraison</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom complet" name="fullName" required defaultValue={defaultName} className="sm:col-span-2" />
              <Field label="Adresse" name="line1" required className="sm:col-span-2" />
              <Field label="Complément (optionnel)" name="line2" className="sm:col-span-2" />
              <Field label="Code postal" name="postalCode" required />
              <Field label="Ville" name="city" required />
              <Field label="Pays" name="country" required defaultValue="Belgique" className="sm:col-span-2" />
            </div>
          </section>

          {error && (
            <div className="bg-primary/10 border border-primary/40 text-primary text-sm rounded-xl p-4">
              {error}
            </div>
          )}
        </div>

        {/* Récap */}
        <div className="space-y-4 lg:sticky lg:top-32 self-start">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-extrabold tracking-tight mb-4">Votre commande</h2>

            <ul className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.productId} className="flex items-center gap-3 text-sm">
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-surface-2 border border-border overflow-hidden">
                    {i.image && (
                      <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{i.name}</div>
                    <div className="text-xs text-foreground-muted">
                      {i.quantity} × {formatPrice(i.price)}
                    </div>
                  </div>
                  <div className="font-bold">{formatPrice(i.price * i.quantity)}</div>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 text-sm border-t border-border pt-4">
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
            </dl>

            <div className="border-t border-border mt-4 pt-4 flex justify-between items-baseline">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-extrabold">{formatPrice(total)}</span>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 mt-5 px-6 py-3.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_24px_var(--primary-glow)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                "Traitement…"
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Payer {formatPrice(total)}
                </>
              )}
            </button>

            <Link
              href="/panier"
              className="block text-center text-sm text-foreground-muted hover:text-primary mt-3 transition"
            >
              Modifier mon panier
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 grid grid-cols-2 gap-3 text-center">
            <div>
              <Truck className="h-5 w-5 mx-auto text-primary mb-1" />
              <div className="text-[11px] text-foreground-muted">Livraison rapide</div>
            </div>
            <div>
              <ShieldCheck className="h-5 w-5 mx-auto text-primary mb-1" />
              <div className="text-[11px] text-foreground-muted">Paiement sécurisé</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue = "",
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full bg-surface-2 border border-border focus:border-primary outline-none rounded-lg px-3 py-2.5 text-sm transition"
      />
    </label>
  );
}
