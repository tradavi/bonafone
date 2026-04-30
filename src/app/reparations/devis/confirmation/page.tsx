import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight, Search } from "lucide-react";
import { getRepairByNumber } from "@/lib/queries";

export const metadata = {
  title: "Demande envoyée",
};

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function ConfirmationPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  if (!ref) notFound();

  const repair = await getRepairByNumber(ref);
  if (!repair) notFound();

  return (
    <div className="bg-background py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute -top-32 -right-32 h-64 w-64 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />
          <div className="relative">
            <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-5">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
              Demande envoyée !
            </h1>
            <p className="text-foreground-muted mb-6">
              Merci {repair.customerName.split(" ")[0]}, votre demande de devis a bien été enregistrée.
              Notre équipe revient vers vous sous <strong className="text-primary">24h ouvrées</strong>{" "}
              par <strong>{contactLabel(repair.contactPref)}</strong>.
            </p>

            <div className="bg-surface-2 border border-border rounded-xl p-5 mb-6 text-left">
              <div className="text-xs text-foreground-muted uppercase tracking-wider font-semibold mb-3">
                Votre numéro de dossier
              </div>
              <div className="font-mono text-2xl font-bold text-primary mb-4">
                {repair.number}
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-foreground-muted">Appareil</div>
                <div className="font-medium text-right">
                  {repair.brand} {repair.model}
                </div>
                <div className="text-foreground-muted">Panne</div>
                <div className="font-medium text-right">{repair.issueType}</div>
                <div className="text-foreground-muted">Email</div>
                <div className="font-medium text-right text-xs">{repair.customerEmail}</div>
              </div>
            </div>

            <p className="text-sm text-foreground-muted mb-6">
              Conservez ce numéro pour suivre l&apos;état de votre réparation à tout moment.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href={`/reparations/suivi?ref=${repair.number}`}
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
              >
                <Search className="h-4 w-4" />
                Suivre ma réparation
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-3 bg-surface-2 border border-border hover:border-primary rounded-lg font-semibold transition"
              >
                Retour à l&apos;accueil
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function contactLabel(pref: string) {
  switch (pref) {
    case "TELEPHONE":
      return "téléphone";
    case "WHATSAPP":
      return "WhatsApp";
    default:
      return "email";
  }
}
