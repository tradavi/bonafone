import Link from "next/link";
import { ArrowLeft, AlertCircle, FileText, Wrench } from "lucide-react";
import { NewRepairForm } from "@/components/admin/new-repair-form";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Nouveau dossier" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string; mode?: string }> };

export default async function NewRepairPage({ searchParams }: Props) {
  const { error, mode } = await searchParams;
  const isDevis = mode === "devis";

  // Charge le catalogue brands + models depuis la DB pour piloter les datalists.
  // Permet a l'admin d'ajouter une marque/modele via /admin/marques sans
  // toucher au code. Tri par nom de marque, modeles par deviceType puis nom.
  const brandsWithModels = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: {
      deviceModels: { orderBy: [{ deviceType: "asc" }, { name: "asc" }] },
    },
  });
  // Format leger pour le client component (pas d'objets Prisma profonds).
  const catalog = brandsWithModels.map((b) => ({
    name: b.name,
    models: b.deviceModels.map((m) => ({ name: m.name, deviceType: m.deviceType })),
  }));

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <Link
          href={isDevis ? "/admin/devis" : "/admin/reparations"}
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {isDevis ? "Retour aux demandes de devis" : "Retour à la liste"}
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          {isDevis ? (
            <>
              <FileText className="h-7 w-7 text-amber-400" />
              Nouveau devis en magasin
            </>
          ) : (
            <>
              <Wrench className="h-7 w-7 text-primary" />
              Nouveau dossier de réparation
            </>
          )}
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          {isDevis
            ? "Le client a déposé son appareil pour un devis. Diagnostiquez ensuite depuis la fiche, envoyez le devis par email, puis convertissez en réparation à l'acceptation du client."
            : "Création manuelle après dépôt en boutique. Un n° REP-YYYY-XXXX est généré automatiquement et deux tickets s'impriment (client + magasin)."}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-foreground-muted">{error}</div>
        </div>
      )}

      <NewRepairForm mode={isDevis ? "devis" : "repair"} catalog={catalog} />
    </div>
  );
}
