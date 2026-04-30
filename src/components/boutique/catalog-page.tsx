import Link from "next/link";
import { CatalogFilters } from "./filters";
import { ProductCard } from "@/components/ui/product-card";
import { getProducts, type ProductFilter } from "@/lib/queries";

type Props = {
  title: string;
  description?: string;
  filter?: ProductFilter;
  basePath: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SORT_OPTIONS: { value: NonNullable<ProductFilter["sort"]>; label: string }[] = [
  { value: "relevance", label: "Pertinence" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "newest", label: "Nouveautés" },
];

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export async function CatalogPage({
  title,
  description,
  filter,
  basePath,
  searchParams,
}: Props) {
  const sp = await searchParams;

  const brands = asArray(sp.brand);
  const states = asArray(sp.state);
  const priceBucket = typeof sp.price === "string" && sp.price ? sp.price : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const rawSort = typeof sp.sort === "string" ? sp.sort : undefined;
  const sort: ProductFilter["sort"] =
    rawSort === "price-asc" ||
    rawSort === "price-desc" ||
    rawSort === "newest" ||
    rawSort === "relevance"
      ? rawSort
      : "relevance";

  const products = await getProducts({
    ...filter,
    brands: brands.length > 0 ? brands : undefined,
    states: states.length > 0 ? states : undefined,
    priceBucket,
    q,
    sort,
  });

  return (
    <>
      {/* Page header */}
      <div className="bg-surface/40 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-xs text-foreground-muted mb-3">
            <Link href="/" className="hover:text-primary transition">Accueil</Link> /{" "}
            <Link href="/boutique" className="hover:text-primary transition">Boutique</Link> /{" "}
            <span className="text-foreground">{title}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{title}</h1>
          {description && (
            <p className="text-foreground-muted mt-3 max-w-3xl">{description}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 flex flex-col md:flex-row gap-8">
        <CatalogFilters
          basePath={basePath}
          selectedBrands={brands}
          selectedStates={states}
          selectedPriceBucket={priceBucket}
          q={q}
        />

        <div className="flex-1">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <span className="text-sm text-foreground-muted">
              <span className="font-semibold text-foreground">{products.length}</span> produit
              {products.length > 1 ? "s" : ""}
            </span>
            <SortForm
              basePath={basePath}
              currentSort={sort ?? "relevance"}
              hiddenParams={{ brands, states, priceBucket, q }}
            />
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 text-foreground-muted bg-surface border border-border rounded-2xl">
              Aucun produit ne correspond à votre recherche.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Tri natif : un select submit le form au change pour mettre à jour l'URL,
 * tout en conservant les autres paramètres (brand[], state[], price, q).
 */
function SortForm({
  basePath,
  currentSort,
  hiddenParams,
}: {
  basePath: string;
  currentSort: string;
  hiddenParams: {
    brands: string[];
    states: string[];
    priceBucket?: string;
    q?: string;
  };
}) {
  return (
    <form action={basePath} method="get" className="contents">
      {hiddenParams.brands.map((b) => (
        <input key={b} type="hidden" name="brand" value={b} />
      ))}
      {hiddenParams.states.map((s) => (
        <input key={s} type="hidden" name="state" value={s} />
      ))}
      {hiddenParams.priceBucket && (
        <input type="hidden" name="price" value={hiddenParams.priceBucket} />
      )}
      {hiddenParams.q && <input type="hidden" name="q" value={hiddenParams.q} />}
      <select
        name="sort"
        defaultValue={currentSort}
        className="text-sm bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
        // Submit auto au changement, requiert un peu de JS — on le fait via un
        // bouton invisible activé par onChange en composant client. Ici en RSC
        // pur, on ajoute un bouton "Trier" visible.
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="text-sm px-3 py-2 bg-surface-2 border border-border hover:border-primary rounded-lg font-medium transition"
      >
        Trier
      </button>
    </form>
  );
}
