import Link from "next/link";
import { Search, Smartphone, Tablet, Laptop, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { getRepairByNumber } from "@/lib/queries";
import { STORE } from "@/lib/utils";

export const metadata = {
  title: "Suivi de réparation",
  description: "Suivez l'état de votre réparation en temps réel",
};

const STATUS_FLOW = [
  { code: "DEMANDE_DEVIS", label: "Demande envoyée", description: "Notre équipe revient vers vous sous 24h ouvrées" },
  { code: "RECU", label: "Reçu en magasin", description: "L'appareil a été déposé en boutique" },
  { code: "DIAGNOSTIC", label: "Diagnostic en cours", description: "Le technicien examine l'appareil" },
  { code: "DEVIS_VALIDE", label: "Devis validé", description: "Vous avez approuvé le devis" },
  { code: "EN_REPARATION", label: "En cours de réparation", description: "L'appareil est en cours de réparation" },
  { code: "ATTENTE_PIECE", label: "En attente de pièce", description: "Une pièce est commandée" },
  { code: "TERMINE", label: "Réparation terminée", description: "Prête pour restitution" },
  { code: "PRET_RECUPERATION", label: "Prêt à récupérer", description: "Vous pouvez venir le chercher" },
  { code: "ATTENTE_RESTITUTION", label: "Devis refusé", description: "Vous avez refusé le devis — venez récupérer votre appareil non réparé" },
  { code: "RESTITUE", label: "Restitué", description: "Appareil rendu" },
];

const DEVICE_ICON: Record<string, typeof Smartphone> = {
  SMARTPHONE: Smartphone,
  TABLETTE: Tablet,
  ORDINATEUR_PORTABLE: Laptop,
  AUTRE: Smartphone,
};

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function SuiviPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const repair = ref ? await getRepairByNumber(ref) : null;

  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
            Suivi
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Où en est ma réparation ?
          </h1>
          <p className="text-foreground-muted">
            Saisissez votre numéro de dossier pour suivre l&apos;avancement.
          </p>
        </div>

        {/* Form */}
        <form className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Numéro de dossier{" "}
            <span className="text-foreground-muted">(ex: REP-2026-0458)</span>
          </label>
          <div className="flex gap-2">
            <input
              name="ref"
              defaultValue={ref ?? ""}
              type="text"
              placeholder="REP-2026-XXXX"
              className="flex-1 px-4 py-3 bg-surface-2 border border-border rounded-lg focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_20px_var(--primary-glow)]"
            >
              <Search className="h-4 w-4" />
              Suivre
            </button>
          </div>
          <p className="text-xs text-foreground-muted mt-3">
            Démo : essayez avec{" "}
            <Link
              href="?ref=REP-2026-0458"
              className="text-primary underline decoration-primary/40 hover:decoration-primary"
            >
              REP-2026-0458
            </Link>
          </p>
        </form>

        {/* Pas trouvé */}
        {ref && !repair && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <p className="text-foreground-muted">
              Aucun dossier trouvé pour la référence{" "}
              <strong className="text-foreground">{ref}</strong>.
            </p>
          </div>
        )}

        {/* Résultat */}
        {repair && (() => {
          const Icon = DEVICE_ICON[repair.deviceType] ?? Smartphone;
          const currentIdx = STATUS_FLOW.findIndex((s) => s.code === repair.status);
          const isFinished = repair.status === "RESTITUE";
          const isIrreparable = repair.status === "IRREPARABLE";
          const lastEvent = repair.statusHistory[repair.statusHistory.length - 1];

          return (
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <div className="h-14 w-14 grid place-items-center bg-primary/10 border border-primary/20 text-primary rounded-xl">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-foreground-muted">
                    Dossier n° <span className="text-primary font-mono">{repair.number}</span>
                  </div>
                  <div className="font-bold text-lg">
                    {repair.brand} {repair.model} · {repair.issueType}
                  </div>
                  <div className="text-sm text-foreground-muted">
                    Reçu le {repair.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-bold border ${
                    isIrreparable
                      ? "bg-primary/10 text-primary border-primary/30"
                      : isFinished
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {isFinished ? "Terminé" : isIrreparable ? "Irréparable" : "En cours"}
                </span>
              </div>

              {!isIrreparable && (
                <div className="mt-6">
                  <div className="font-bold mb-5">Étapes</div>
                  <ol className="space-y-5">
                    {STATUS_FLOW.map((step, i) => {
                      const done = i < currentIdx;
                      const current = i === currentIdx;
                      return (
                        <li key={step.code} className="flex gap-4">
                          <div className="relative">
                            {done ? (
                              <CheckCircle2 className="h-7 w-7 text-emerald-400 fill-emerald-400/10" />
                            ) : current ? (
                              <div className="h-7 w-7 rounded-full bg-primary text-white grid place-items-center animate-pulse shadow-[0_0_16px_var(--primary-glow)]">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              </div>
                            ) : (
                              <Circle className="h-7 w-7 text-border-strong" />
                            )}
                            {i < STATUS_FLOW.length - 1 && (
                              <div
                                className={`absolute top-7 left-1/2 -translate-x-1/2 w-0.5 h-7 ${
                                  done ? "bg-emerald-400/50" : "bg-border"
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <div
                              className={`font-semibold ${
                                done || current ? "text-foreground" : "text-foreground-subtle"
                              }`}
                            >
                              {step.label}
                            </div>
                            <div className="text-xs text-foreground-muted">{step.description}</div>
                            {current && lastEvent?.comment && (
                              <div className="text-xs text-primary mt-1.5 font-semibold">
                                {lastEvent.comment}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              <div className="mt-7 p-4 bg-surface-2 border border-border rounded-lg text-sm">
                <div className="font-bold mb-1">Une question sur cette réparation ?</div>
                <div className="text-foreground-muted">
                  Appelez-nous au{" "}
                  <a href={`tel:${STORE.phone}`} className="text-primary font-semibold">
                    {STORE.phone}
                  </a>{" "}
                  ou contactez-nous via{" "}
                  <Link href="/contact" className="text-primary font-semibold">
                    le formulaire
                  </Link>
                  .
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
