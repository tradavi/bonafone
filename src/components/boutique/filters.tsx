import Link from "next/link";
import { getBrandNames } from "@/lib/queries";

const STATES: { value: string; label: string }[] = [
  { value: "REC_A", label: "Reconditionné Grade A" },
  { value: "REC_B", label: "Reconditionné Grade B" },
  { value: "REC_C", label: "Reconditionné Grade C" },
  { value: "OCC", label: "Occasion" },
];

const PRICE_BUCKETS: { value: string; label: string }[] = [
  { value: "lt200", label: "Moins de 200 €" },
  { value: "200-500", label: "200 € - 500 €" },
  { value: "500-1000", label: "500 € - 1000 €" },
  { value: "gt1000", label: "Plus de 1000 €" },
];

type Props = {
  basePath: string;
  selectedBrands: string[];
  selectedStates: string[];
  selectedPriceBucket?: string;
  q?: string;
};

export async function CatalogFilters({
  basePath,
  selectedBrands,
  selectedStates,
  selectedPriceBucket,
  q,
}: Props) {
  const brands = await getBrandNames();
  const hasFilters =
    selectedBrands.length > 0 ||
    selectedStates.length > 0 ||
    Boolean(selectedPriceBucket) ||
    Boolean(q);

  return (
    <aside className="md:w-64 shrink-0">
      <form action={basePath} method="get" className="space-y-6">
        {/* Recherche libre */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold mb-2">
            Recherche
          </label>
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Modèle, marque…"
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
          />
        </div>

        <FilterGroup title="Marque">
          {brands.length === 0 && (
            <p className="text-xs text-foreground-muted">Aucune marque enregistrée.</p>
          )}
          {brands.slice(0, 10).map((b) => (
            <label
              key={b}
              className="flex items-center gap-2 text-sm cursor-pointer text-foreground-muted hover:text-foreground transition"
            >
              <input
                type="checkbox"
                name="brand"
                value={b}
                defaultChecked={selectedBrands.includes(b)}
                className="accent-primary"
              />
              {b}
            </label>
          ))}
        </FilterGroup>

        <FilterGroup title="Prix">
          {PRICE_BUCKETS.map((p) => (
            <label
              key={p.value}
              className="flex items-center gap-2 text-sm cursor-pointer text-foreground-muted hover:text-foreground transition"
            >
              <input
                type="radio"
                name="price"
                value={p.value}
                defaultChecked={selectedPriceBucket === p.value}
                className="accent-primary"
              />
              {p.label}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground-muted hover:text-foreground transition">
            <input
              type="radio"
              name="price"
              value=""
              defaultChecked={!selectedPriceBucket}
              className="accent-primary"
            />
            Tous les prix
          </label>
        </FilterGroup>

        <FilterGroup title="État">
          {STATES.map((s) => (
            <label
              key={s.value}
              className="flex items-center gap-2 text-sm cursor-pointer text-foreground-muted hover:text-foreground transition"
            >
              <input
                type="checkbox"
                name="state"
                value={s.value}
                defaultChecked={selectedStates.includes(s.value)}
                className="accent-primary"
              />
              {s.label}
            </label>
          ))}
        </FilterGroup>

        <div className="space-y-2">
          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
          >
            Appliquer les filtres
          </button>
          {hasFilters && (
            <Link
              href={basePath}
              className="block text-center text-xs text-foreground-muted hover:text-primary transition"
            >
              Effacer les filtres
            </Link>
          )}
        </div>
      </form>
    </aside>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-bold text-xs uppercase tracking-widest mb-3 pb-2 border-b border-border">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
