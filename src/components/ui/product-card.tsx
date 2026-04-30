import Link from "next/link";
import { Heart } from "lucide-react";
import type { ProductCardData } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

const BADGE_STYLES: Record<string, string> = {
  Nouveau: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Promo: "bg-primary/15 text-primary border-primary/30",
  "Top vente": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Derniers articles": "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const GRADE_LABELS: Record<string, string> = {
  A: "Très bon état",
  B: "Bon état",
  C: "État correct",
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100,
        )
      : null;

  const badgeCls = product.badge ? BADGE_STYLES[product.badge] : "";

  return (
    <div className="group relative bg-surface border border-border rounded-xl overflow-hidden hover:border-primary hover:-translate-y-0.5 transition-all duration-300">
      <Link href={`/produit/${product.slug}`} className="block">
        <div className="relative aspect-square bg-surface-2 overflow-hidden">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/0 via-transparent to-transparent group-hover:from-primary/10 transition" />

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.badge && (
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded border backdrop-blur-sm ${badgeCls}`}
              >
                {product.badge}
              </span>
            )}
            {discount && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary text-white shadow-[0_0_12px_var(--primary-glow)]">
                -{discount}%
              </span>
            )}
            {product.grade && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">
                Grade {product.grade}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Ajouter aux favoris"
            className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-background/80 border border-border backdrop-blur hover:bg-primary hover:border-primary hover:text-white opacity-0 group-hover:opacity-100 transition"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <div className="text-[10px] text-foreground-muted uppercase tracking-widest font-semibold">
          {product.brand}
        </div>
        <Link href={`/produit/${product.slug}`}>
          <h3 className="font-medium text-sm mt-1 line-clamp-2 min-h-[2.5em] group-hover:text-primary transition">
            {product.name}
          </h3>
        </Link>

        {product.grade && (
          <div className="text-[11px] text-foreground-muted mt-1.5">
            {GRADE_LABELS[product.grade]} · Garantie {product.warrantyMonths} mois
          </div>
        )}

        <div className="flex items-end justify-between mt-3">
          <div>
            <div className="font-extrabold text-lg text-foreground">
              {formatPrice(product.price)}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-foreground-subtle line-through">
                {formatPrice(product.originalPrice)}
              </div>
            )}
          </div>
          <AddToCartButton
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              price: product.price,
              image: product.image,
              stock: product.stock,
            }}
          />
        </div>

        {product.stock <= 3 && product.stock > 0 && (
          <div className="text-[11px] text-primary font-semibold mt-3 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Plus que {product.stock} en stock
          </div>
        )}
      </div>
    </div>
  );
}
