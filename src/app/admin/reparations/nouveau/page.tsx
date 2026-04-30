import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { NewRepairForm } from "@/components/admin/new-repair-form";

export const metadata = { title: "Nouveau dossier" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewRepairPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <Link
          href="/admin/reparations"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Nouveau dossier de réparation
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Création manuelle après dépôt en boutique. Un n° REP-YYYY-XXXX est généré automatiquement
          et deux tickets s&apos;impriment (client + magasin).
        </p>
      </div>

      {error && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-foreground-muted">{error}</div>
        </div>
      )}

      <NewRepairForm />
    </div>
  );
}
