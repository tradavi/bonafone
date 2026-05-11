import Link from "next/link";
import { Search, FileText, ArrowRight, Wrench, MailOpen, Send, Plus } from "lucide-react";
import { getAllDevisRequests } from "@/lib/queries";
import { convertDevisToRepair, sendRepairQuote } from "@/lib/actions/repairs";
import { formatPrice, priceBreakdown } from "@/lib/utils";

export const metadata = { title: "Demandes de devis" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

function daysSince(d: Date) {
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminDevisPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const all = await getAllDevisRequests();
  const filtered = q
    ? all.filter((r) => {
        const needle = q.toLowerCase();
        return (
          r.number.toLowerCase().includes(needle) ||
          r.customerName.toLowerCase().includes(needle) ||
          (r.customerEmail ?? "").toLowerCase().includes(needle) ||
          r.brand.toLowerCase().includes(needle) ||
          r.model.toLowerCase().includes(needle) ||
          r.issueType.toLowerCase().includes(needle)
        );
      })
    : all;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-3 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-48 w-48 bg-primary/10 blur-3xl rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">Demandes de devis</h1>
          </div>
          <p className="text-sm text-foreground-muted">
            {all.length} demande{all.length > 1 ? "s" : ""} en attente — formulaires en ligne et dépôts en magasin.
          </p>
        </div>
        <Link
          href="/admin/reparations/nouveau?mode=devis"
          className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
        >
          <Plus className="h-4 w-4" />
          Nouveau devis en magasin
        </Link>
      </div>

      <div className="bg-surface border border-amber-500/30 bg-amber-500/5 rounded-2xl p-4 text-sm flex items-start gap-2">
        <MailOpen className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-foreground-muted">
          <strong>Workflow devis :</strong> demande en ligne (formulaire client) <em>ou</em>
          dépôt physique en magasin → diagnostic & estimation par l&apos;équipe → bouton
          <strong>« Envoyer »</strong> pour transmettre le devis par email → bouton
          <strong>« Convertir »</strong> à l&apos;acceptation du client : le dossier passe
          en statut Réparation.
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <form className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher par numéro, client, email, appareil…"
              className="w-full pl-9 pr-3.5 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr className="text-left text-xs uppercase tracking-wider text-foreground-muted">
                <th className="px-4 py-3 font-semibold">N°</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Appareil</th>
                <th className="px-4 py-3 font-semibold">Panne</th>
                <th className="px-4 py-3 font-semibold">Devis</th>
                <th className="px-4 py-3 font-semibold">Reçue</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-foreground-muted">
                    {all.length === 0
                      ? "Aucune demande de devis en attente."
                      : "Aucune demande ne correspond à la recherche."}
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const age = daysSince(r.createdAt);
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-surface-2 transition group">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/admin/reparations/${r.number}`}
                        className="text-primary hover:underline"
                      >
                        {r.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.customerName}</div>
                      <div className="text-xs text-foreground-muted">{r.customerEmail}</div>
                      <div className="text-xs text-foreground-muted">{r.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {r.brand} {r.model}
                      </div>
                      <div className="text-xs text-foreground-muted capitalize">
                        {r.deviceType.toLowerCase().replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{r.issueType}</td>
                    <td className="px-4 py-3">
                      {r.estimatedCost != null ? (
                        <div className="leading-tight">
                          <div className="font-semibold tabular-nums text-primary">
                            {formatPrice(r.estimatedCost)}{" "}
                            <span className="text-[10px] font-normal text-foreground-muted">TTC</span>
                          </div>
                          <div className="text-[11px] text-foreground-muted tabular-nums">
                            HT {formatPrice(priceBreakdown(r.estimatedCost).ht)}
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={`/admin/reparations/${r.number}`}
                          className="text-xs text-foreground-muted hover:text-primary transition italic"
                        >
                          à définir
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>{r.createdAt.toLocaleDateString("fr-FR")}</div>
                      <div
                        className={`mt-0.5 ${
                          age >= 3 ? "text-primary font-semibold" : "text-foreground-muted"
                        }`}
                      >
                        {age === 0 ? "aujourd'hui" : `il y a ${age}j`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/reparations/${r.number}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition"
                          aria-label="Voir le détail"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        {r.estimatedCost != null && r.customerEmail && (
                          <form action={sendRepairQuote}>
                            <input type="hidden" name="repairId" value={r.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border hover:border-primary text-foreground rounded-lg text-xs font-semibold transition"
                              title={`Envoyer le devis à ${r.customerEmail}`}
                            >
                              <Send className="h-3.5 w-3.5" />
                              Envoyer
                            </button>
                          </form>
                        )}
                        <form action={convertDevisToRepair}>
                          <input type="hidden" name="repairId" value={r.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary hover:bg-primary-strong text-white rounded-lg text-xs font-semibold transition shadow-[0_0_12px_var(--primary-glow)]"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            Convertir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
