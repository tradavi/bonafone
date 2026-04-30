import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, ShieldCheck, Truck, RotateCcw, Star } from "lucide-react";
import { getProductBySlug, getAllProductSlugs } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { JsonLd, productSchema, breadcrumbSchema } from "@/components/seo/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produit" };
  const description =
    product.description?.slice(0, 160) ??
    `${product.brand.name} ${product.name} disponible chez Bonafone.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/produit/${slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      images: product.primaryImage ? [{ url: product.primaryImage }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const isOccasion = product.condition === "OCCASION";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <JsonLd data={productSchema(product)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Boutique", url: "/boutique" },
          { name: product.name, url: `/produit/${product.slug}` },
        ])}
      />
      <div className="text-xs text-foreground-muted mb-6">
        <Link href="/" className="hover:text-primary transition">Accueil</Link> /{" "}
        <Link href="/boutique" className="hover:text-primary transition">Boutique</Link> /{" "}
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Galerie */}
        <div>
          <div className="aspect-square bg-surface border border-border rounded-2xl overflow-hidden">
            {product.primaryImage && (
              <img src={product.primaryImage} alt={product.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-surface border border-border rounded-lg hover:border-primary cursor-pointer transition" />
            ))}
          </div>
        </div>

        {/* Infos */}
        <div>
          <div className="text-xs text-foreground-muted uppercase tracking-widest font-semibold mb-2">
            {product.brand.name}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">{product.name}</h1>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i <= 4 ? "fill-primary text-primary" : "text-border-strong"}`}
                />
              ))}
            </div>
            <span className="text-sm text-foreground-muted">4.5/5 · 32 avis</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-5xl font-extrabold tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-foreground-subtle line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {discount && (
              <span className="px-2.5 py-1 bg-primary text-white rounded text-sm font-bold shadow-[0_0_16px_var(--primary-glow)]">
                -{discount}%
              </span>
            )}
          </div>

          <p className="text-foreground-muted mb-7 leading-relaxed">
            {product.description ||
              (isOccasion
                ? `Occasion${product.grade ? ` Grade ${product.grade}` : ""} : vérifié, nettoyé, testé. Garantie ${product.warrantyMonths} mois.`
                : `Reconditionné${product.grade ? ` Grade ${product.grade}` : " Grade A"} : vérifié, nettoyé, testé. Garantie ${product.warrantyMonths} mois.`)}
          </p>

          {/* Selecteurs */}
          <div className="space-y-5 mb-7">
            <div>
              <div className="text-sm font-semibold mb-2.5">Stockage</div>
              <div className="flex gap-2">
                {["128 Go", "256 Go", "512 Go"].map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                      i === 1
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface hover:border-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2.5">Couleur</div>
              <div className="flex gap-2">
                {["bg-zinc-900", "bg-blue-500", "bg-emerald-500", "bg-rose-400"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-9 w-9 rounded-full ${c} border-2 border-border hover:border-primary transition`}
                    aria-label="couleur"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3 mb-7">
            <AddToCartButton
              variant="full"
              className="flex-1"
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                brand: product.brand.name,
                price: product.price,
                image: product.primaryImage ?? "",
                stock: product.stock,
              }}
            />
            <button
              type="button"
              aria-label="Ajouter aux favoris"
              className="h-13 w-13 grid place-items-center bg-surface border border-border rounded-lg hover:border-primary hover:text-primary transition px-4"
            >
              <Heart className="h-5 w-5" />
            </button>
          </div>

          {/* Garanties */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border">
            {[
              { icon: Truck, title: "Livraison 24-48h", text: "Offerte dès 50 €" },
              { icon: ShieldCheck, title: `Garantie ${product.warrantyMonths} mois`, text: "Pièces et MO" },
              { icon: RotateCcw, title: "Retour 14j", text: "Sans condition" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <Icon className="h-6 w-6 mx-auto text-primary mb-1.5" />
                <div className="text-xs font-bold">{title}</div>
                <div className="text-[10px] text-foreground-muted">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description longue */}
      <div className="mt-16 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-extrabold mb-4 tracking-tight">Description</h2>
          <p className="text-foreground-muted leading-relaxed">
            {product.description}
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold mb-4 tracking-tight">Caractéristiques</h2>
          <dl className="bg-surface border border-border rounded-xl p-5 text-sm space-y-3">
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Marque</dt>
              <dd className="font-semibold">{product.brand.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-muted">État</dt>
              <dd className="font-semibold capitalize">{product.condition.toLowerCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Garantie</dt>
              <dd className="font-semibold">{product.warrantyMonths} mois</dd>
            </div>
            {product.specs.map((s) => (
              <div key={s.id} className="flex justify-between">
                <dt className="text-foreground-muted">{s.key}</dt>
                <dd className="font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
