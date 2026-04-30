import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { getFeaturedProducts } from "@/lib/queries";

export async function FeaturedProducts() {
  const featured = await getFeaturedProducts(8);

  return (
    <section className="py-16 md:py-20 bg-surface/40 border-b border-border">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
              Best-sellers
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Produits en vedette
            </h2>
            <p className="text-foreground-muted mt-2">
              Sélection des meilleures offres du moment.
            </p>
          </div>
          <Link
            href="/boutique"
            className="hidden md:inline-flex items-center gap-2 text-primary hover:text-primary-strong font-semibold group"
          >
            Voir tout
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="text-center py-12 text-foreground-muted">
            Aucun produit pour l&apos;instant.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="md:hidden mt-6 text-center">
          <Link
            href="/boutique"
            className="inline-flex items-center gap-2 text-primary font-semibold"
          >
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
