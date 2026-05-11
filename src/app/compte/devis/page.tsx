import Link from "next/link";
import { FileText, Plus, ArrowRight, MailOpen } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Mes devis" };
export const dynamic = "force-dynamic";

export default async function MesDevisPage() {
  const session = await auth();
  if (!session?.user) return null;

  const devis = await prisma.repair.findMany({
    where: {
      userId: session.user.id,
      status: "DEMANDE_DEVIS",
    },
    orderBy: { createdAt: "desc" },
  });

  if (devis.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-10 text-center">
        <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Mes devis</h1>
        <p className="text-foreground-muted mb-6">
          Aucun devis en attente. Vous pouvez en demander un en ligne ou venir
          déposer votre appareil en magasin.
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
          <h1 className="text-2xl font-extrabold tracking-tight">Mes devis</h1>
          <p className="text-sm text-foreground-muted">
            {devis.length} devis en attente d&apos;acceptation.
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

      <div className="bg-surface border border-amber-500/30 bg-amber-500/5 rounded-2xl p-4 text-sm flex items-start gap-2">
        <MailOpen className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-foreground-muted">
          Un devis est en attente tant que notre équipe n&apos;a pas diagnostiqué votre appareil
          ou que vous n&apos;avez pas validé l&apos;estimation. Dès que vous acceptez le devis,
          la réparation démarre et le dossier passe dans <strong>« Mes réparations »</strong>.
        </div>
      </div>

      <div className="grid gap-3">
        {devis.map((d) => (
          <Link
            key={d.id}
            href={`/reparations/suivi?ref=${d.number}`}
            className="bg-surface border border-border hover:border-primary rounded-2xl p-5 flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 grid place-items-center bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-mono text-xs text-primary mb-0.5">{d.number}</div>
                <div className="font-bold">
                  {d.brand} {d.model}
                </div>
                <div className="text-xs text-foreground-muted">
                  {d.issueType} ·{" "}
                  {d.createdAt.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {d.estimatedCost != null && (
                    <>
                      {" · "}
                      <span className="text-foreground font-semibold">
                        Devis : {formatPrice(d.estimatedCost)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex px-2.5 py-1 text-[10px] font-bold rounded border bg-amber-500/15 text-amber-400 border-amber-500/30">
                {d.estimatedCost != null ? "Devis en attente" : "Diagnostic en cours"}
              </span>
              <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-1 transition" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
