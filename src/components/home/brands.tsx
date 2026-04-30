import { getBrandNames } from "@/lib/queries";

export async function Brands() {
  const brands = await getBrandNames();

  return (
    <section className="py-12 bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center text-xs uppercase tracking-[0.25em] text-foreground-muted mb-8">
          Marques traitées
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
          {brands.map((brand) => (
            <div
              key={brand}
              className="text-2xl md:text-3xl font-black text-foreground/30 hover:text-primary hover:scale-110 transition cursor-default tracking-tight"
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
