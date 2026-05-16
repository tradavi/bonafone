import Link from "next/link";
import { Wrench, Clock, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

const STEPS = [
  { num: "01", title: "Demandez un devis", text: "Formulaire en ligne en 2 minutes" },
  { num: "02", title: "Réponse en 24h", text: "Diagnostic et tarif transparent" },
  { num: "03", title: "Réparation rapide", text: "La plupart en moins de 24h" },
  { num: "04", title: "Suivez en ligne", text: "Notifications par SMS et email" },
];

export function RepairCTA() {
  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden border-b border-border">
      {/* Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/15 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-semibold mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              Devis 100% gratuit
            </span>
            <h2 className="text-4xl md:text-6xl font-extrabold mb-5 leading-[1.05] tracking-tight">
              Cassé ?<br />
              <span className="bg-gradient-to-r from-primary to-primary-strong bg-clip-text text-transparent">
                On le répare.
              </span>
            </h2>
            <p className="text-lg text-foreground-muted mb-8 max-w-md leading-relaxed">
              Écran, batterie, carte mère, dégât des eaux... Nos techniciens certifiés réparent toutes les marques avec garantie.
            </p>

            <div className="flex flex-wrap gap-5 mb-8 text-sm">
              {[
                { icon: Clock, text: "Devis sous 24h" },
                { icon: ShieldCheck, text: "Garantie 1 an" },
                { icon: Wrench, text: "Toutes marques" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-foreground-muted">
                  <Icon className="h-4 w-4 text-primary" />
                  {text}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/reparations"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_32px_var(--primary-glow)]"
              >
                Demander un devis gratuit
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reparations/suivi"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-surface border border-border hover:border-primary hover:text-primary rounded-lg font-semibold transition"
              >
                Suivre ma réparation
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="group relative bg-surface border border-border rounded-2xl p-6 hover:border-primary transition"
                style={{ transform: i % 2 === 1 ? "translateY(24px)" : "" }}
              >
                <div className="absolute top-4 right-4 text-5xl font-black text-primary/10 group-hover:text-primary/20 transition">
                  {step.num}
                </div>
                <div className="relative">
                  <div className="h-1 w-8 bg-primary mb-4 rounded-full" />
                  <div className="font-bold text-foreground mb-1">{step.title}</div>
                  <div className="text-sm text-foreground-muted">{step.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
