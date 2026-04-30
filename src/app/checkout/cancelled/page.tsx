import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";
import { cancelPendingOrder } from "@/lib/actions/checkout";

export const metadata = { title: "Paiement annulé" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function CheckoutCancelledPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  if (ref) {
    // Restaure le stock + passe l'order à CANCELLED (idempotent, ne touche que PENDING)
    await cancelPendingOrder(ref);
  }

  return (
    <div className="bg-background py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute -top-32 -right-32 h-64 w-64 bg-primary/15 blur-3xl rounded-full pointer-events-none" />
          <div className="relative">
            <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 border border-primary/30 mb-5">
              <XCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
              Paiement annulé
            </h1>
            <p className="text-foreground-muted mb-8">
              Pas de souci, votre panier est conservé. Vous pouvez réessayer quand vous voulez.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/panier"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au panier
              </Link>
              <Link
                href="/boutique"
                className="inline-flex items-center gap-2 px-5 py-3 bg-surface-2 border border-border hover:border-primary rounded-lg font-semibold transition"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
