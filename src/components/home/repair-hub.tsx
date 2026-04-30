import Link from "next/link";
import {
  Smartphone,
  Tablet,
  Laptop,
  Battery,
  ScreenShare,
  Droplets,
  Cpu,
  Wrench,
  ArrowRight,
  Search,
  ShieldCheck,
  Clock,
} from "lucide-react";

const REPAIR_TYPES = [
  { icon: ScreenShare, label: "Écran cassé", from: "À partir de 49 €" },
  { icon: Battery, label: "Batterie", from: "À partir de 39 €" },
  { icon: Droplets, label: "Dégât des eaux", from: "Diagnostic gratuit" },
  { icon: Cpu, label: "Carte mère", from: "À partir de 99 €" },
  { icon: Wrench, label: "Boutons / Connecteurs", from: "À partir de 35 €" },
  { icon: ShieldCheck, label: "Autre panne", from: "Diagnostic gratuit" },
];

const DEVICES = [
  { icon: Smartphone, label: "Smartphones", count: "iPhone, Samsung, Xiaomi..." },
  { icon: Tablet, label: "Tablettes", count: "iPad, Galaxy Tab..." },
  { icon: Laptop, label: "Ordinateurs", count: "MacBook, PC portables..." },
];

export function RepairHub() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background relative overflow-hidden border-b border-border py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full bg-primary/25 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-semibold mb-5">
              Devis gratuit
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-5 leading-[1.05] tracking-tight">
              Réparation{" "}
              <span className="bg-gradient-to-r from-primary to-primary-strong bg-clip-text text-transparent">
                tous appareils
              </span>
            </h1>
            <p className="text-lg text-foreground-muted mb-8 max-w-md leading-relaxed">
              Devis gratuit en 24h. Réparation rapide avec garantie jusqu&apos;à 12 mois. Suivi en ligne en temps réel.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/reparations/devis"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-strong rounded-lg font-bold text-white transition shadow-[0_0_32px_var(--primary-glow)]"
              >
                Demander un devis gratuit
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reparations/suivi"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-surface border border-border hover:border-primary hover:text-primary rounded-lg font-semibold transition"
              >
                <Search className="h-4 w-4" />
                Suivre ma réparation
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Clock, label: "Devis sous 24h" },
              { icon: ShieldCheck, label: "Garantie 12 mois" },
              { icon: Wrench, label: "Toutes marques" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-surface border border-border rounded-2xl p-5 text-center">
                <Icon className="h-8 w-8 mx-auto text-primary mb-2" />
                <div className="font-semibold text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appareils */}
      <section className="py-16 md:py-20 bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 tracking-tight">
            Quel appareil à réparer ?
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {DEVICES.map(({ icon: Icon, label, count }) => (
              <Link
                key={label}
                href="/reparations/devis"
                className="group bg-surface border border-border rounded-2xl p-8 text-center hover:border-primary hover:bg-surface-2 transition"
              >
                <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_24px_var(--primary-glow)] transition">
                  <Icon className="h-8 w-8" />
                </div>
                <div className="font-bold text-xl mb-1">{label}</div>
                <div className="text-sm text-foreground-muted">{count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Types de pannes */}
      <section className="py-16 md:py-20 bg-surface/40 border-b border-border">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
              Tarifs
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Pannes courantes
            </h2>
            <p className="text-foreground-muted">
              Une panne ? Voici nos interventions les plus fréquentes.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {REPAIR_TYPES.map(({ icon: Icon, label, from }) => (
              <div
                key={label}
                className="bg-surface border border-border rounded-xl p-6 hover:border-primary transition group"
              >
                <Icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition" />
                <div className="font-bold mb-1.5">{label}</div>
                <div className="text-sm text-primary font-semibold">{from}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/reparations/devis"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_32px_var(--primary-glow)]"
            >
              Obtenir un devis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
