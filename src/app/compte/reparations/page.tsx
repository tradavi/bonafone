import Link from "next/link";
import { Wrench, Plus, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, priceBreakdown } from "@/lib/utils";

export const metadata = { title: "Mes réparations" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  RECU: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DIAGNOSTIC: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  DEVIS_VALIDE: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  EN_REPARATION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ATTENTE_PIECE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  TERMINE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PRET_RECUPERATION: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  ATTENTE_RESTITUTION: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  RESTITUE: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  IRREPARABLE: "bg-primary/10 text-primary border-primary/30",
};

const STATUS_LABEL: Record<string, string> = {
  RECU: "Reçu",
  DIAGNOSTIC: "Diagnostic",
  DEVIS_VALIDE: "Devis validé",
  EN_REPARATION: "En réparation",
  ATTENTE_PIECE: "Attente pièce",
  TERMINE: "Terminé",
  PRET_RECUPERATION: "À récupérer",
  ATTENTE_RESTITUTION: "Devis refusé — à récupérer",
  RESTITUE: "Restitué",
  IRREPARABLE: "Irréparable",
};

export default async function MesReparationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  // On exclut les DEMANDE_DEVIS — ils ont leur propre page /compte/devis.
  const repairs = await prisma.repair.findMany({
    where: {
      userId: session.user.id,
      status: { not: "DEMANDE_DEVIS" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (repairs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-10 text-center">
        <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4">
          <Wrench className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2 tracking-tight">
          Mes réparations
        </h1>
        <p className="text-foreground-muted mb-6">
          Aucune réparation enregistrée pour l&apos;instant.
        </p>
        <Link
          href="/reparations/devis"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
        >
          <Plus className="h-4 w-4" />
          Demander un devis
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Mes réparations</h1>
          <p className="text-sm text-foreground-muted">
            {repairs.length} dossier{repairs.length > 1 ? "s" : ""} enregistré
            {repairs.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Link
          href="/reparations/devis"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_16px_var(--primary-glow)]"
        >
          <Plus className="h-4 w-4" />
          Nouveau devis
        </Link>
      </div>

      <div className="grid gap-3">
        {repairs.map((r) => (
          <Link
            key={r.id}
            href={`/reparations/suivi?ref=${r.number}`}
            className="bg-surface border border-border hover:border-primary rounded-2xl p-5 flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 grid place-items-center bg-primary/10 border border-primary/20 text-primary rounded-xl shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <div className="font-mono text-xs text-primary mb-0.5">{r.number}</div>
                <div className="font-bold">
                  {r.brand} {r.model}
                </div>
                <div className="text-xs text-foreground-muted">
                  {r.issueType} ·{" "}
                  {r.createdAt.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {r.estimatedCost && (
                    <>
                      {" · "}
                      <span className="text-foreground">
                        Devis TTC : {formatPrice(r.estimatedCost)}
                        <span className="text-foreground-subtle ml-1">
                          (HT {formatPrice(priceBreakdown(r.estimatedCost).ht)})
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`hidden sm:inline-flex px-2.5 py-1 text-[10px] font-bold rounded border ${
                  STATUS_STYLES[r.status] ?? STATUS_STYLES.RECU
                }`}
              >
                {STATUS_LABEL[r.status] ?? r.status.replace(/_/g, " ")}
              </span>
              <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-1 transition" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
