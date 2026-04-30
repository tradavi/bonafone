import Link from "next/link";
import { Smartphone, Tablet, Laptop, Headphones, Wrench } from "lucide-react";

const CATEGORIES = [
  { label: "Smartphones", href: "/boutique/smartphones", icon: Smartphone },
  { label: "Tablettes", href: "/boutique/tablettes", icon: Tablet },
  { label: "Ordinateurs", href: "/boutique/ordinateurs", icon: Laptop },
  { label: "Accessoires", href: "/boutique/accessoires", icon: Headphones },
  { label: "Réparations", href: "/reparations", icon: Wrench },
];

export function Categories() {
  return (
    <section className="py-16 md:py-20 bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
            Nos univers
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Tout ce qu&apos;il vous faut.
          </h2>
          <p className="text-foreground-muted mt-3 max-w-xl mx-auto">
            Reconditionné, occasion et réparation — tous nos appareils sont contrôlés et garantis.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATEGORIES.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group relative bg-surface rounded-2xl p-7 border border-border hover:border-primary hover:bg-surface-2 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition" />
              <div className="relative">
                <div className="mb-4 h-12 w-12 grid place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_24px_var(--primary-glow)] transition">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="font-semibold text-foreground">{label}</div>
                <div className="text-xs text-foreground-muted mt-1 group-hover:text-primary transition flex items-center gap-1">
                  Voir <span className="group-hover:translate-x-1 transition">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
