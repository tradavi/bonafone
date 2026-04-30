import Link from "next/link";
import { ArrowRight, Sparkles, Wrench } from "lucide-react";

export function Hero() {
  return (
    <section className="relative bg-background text-foreground overflow-hidden border-b border-border">
      {/* Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute -bottom-40 -left-32 h-[400px] w-[400px] rounded-full bg-primary/20 blur-[100px]" />
      </div>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-semibold mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Soldes de printemps — jusqu&apos;à -40%
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] mb-5 tracking-tight">
            High-Tech<br />
            &amp;{" "}
            <span className="bg-gradient-to-r from-primary via-primary-strong to-primary bg-clip-text text-transparent">
              Réparations
            </span>
            <br />
            réunies.
          </h1>
          <p className="text-lg text-foreground-muted mb-8 max-w-md leading-relaxed">
            Smartphones, tablettes, accessoires et services de réparation rapides avec garantie. Devis gratuit en 24h.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/boutique"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_32px_var(--primary-glow)]"
            >
              Découvrir la boutique
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/reparations"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-surface border border-border hover:border-primary hover:text-primary rounded-lg font-semibold transition"
            >
              <Wrench className="h-4 w-4" />
              Demander un devis
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-12 max-w-md">
            {[
              { value: "5000+", label: "Réparations" },
              { value: "4.9/5", label: "Avis clients" },
              { value: "24h", label: "Réponse devis" },
            ].map((s) => (
              <div key={s.label} className="border-l-2 border-primary pl-3">
                <div className="text-2xl font-extrabold tracking-tight">{s.value}</div>
                <div className="text-xs text-foreground-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:block relative">
          <div className="relative aspect-square max-w-md ml-auto">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-3xl" />
            <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-surface to-surface-2 border border-border-strong p-10 flex items-center justify-center overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/40 blur-3xl" />
              <div className="relative text-center">
                <div className="inline-block text-8xl mb-4 grayscale brightness-150">📱</div>
                <div className="text-xs uppercase tracking-widest text-foreground-muted mb-2">
                  Nouveau
                </div>
                <div className="text-3xl font-extrabold mb-3">iPhone 15 Pro</div>
                <div className="text-foreground-muted text-sm mb-2">à partir de</div>
                <div className="text-5xl font-black bg-gradient-to-r from-primary to-primary-strong bg-clip-text text-transparent">
                  1 229 €
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
