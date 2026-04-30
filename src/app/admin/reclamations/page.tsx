import { AlertCircle, Save, Mail, Phone } from "lucide-react";
import { getAdminAllReclamations } from "@/lib/queries";
import { updateReclamationStatus } from "@/lib/actions/admin";

export const metadata = { title: "Réclamations" };
export const dynamic = "force-dynamic";

const STATUSES = [
  { code: "OUVERTE", label: "Ouverte" },
  { code: "EN_COURS", label: "En cours" },
  { code: "RESOLUE", label: "Résolue" },
  { code: "CLOSE", label: "Close" },
];

const STATUS_STYLES: Record<string, string> = {
  OUVERTE: "bg-primary/10 text-primary border-primary/30",
  EN_COURS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  RESOLUE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CLOSE: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const TYPE_LABEL: Record<string, string> = {
  COMMANDE: "Commande",
  REPARATION: "Réparation",
  LIVRAISON: "Livraison",
  PRODUIT_DEFECTUEUX: "Produit défectueux",
  AUTRE: "Autre",
};

export default async function AdminReclamationsPage() {
  const items = await getAdminAllReclamations();
  const open = items.filter((r) => r.status === "OUVERTE" || r.status === "EN_COURS").length;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Réclamations</h1>
        <p className="text-sm text-foreground-muted">
          {items.length} dossier{items.length > 1 ? "s" : ""} · {open} à traiter
        </p>
      </div>

      <div className="grid gap-3">
        {items.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-foreground-muted">
            Aucune réclamation pour le moment.
          </div>
        )}
        {items.map((r) => (
          <div key={r.id} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-primary">{r.number}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      STATUS_STYLES[r.status] ?? STATUS_STYLES.OUVERTE
                    }`}
                  >
                    {STATUSES.find((s) => s.code === r.status)?.label ?? r.status}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-surface-2 font-medium text-foreground-muted">
                    {TYPE_LABEL[r.type] ?? r.type}
                  </span>
                </div>
                <div className="text-sm text-foreground-muted flex items-center gap-2 flex-wrap">
                  <Mail className="h-3.5 w-3.5" />
                  {r.email}
                  {r.phone && (
                    <>
                      <span className="text-foreground-subtle">·</span>
                      <Phone className="h-3.5 w-3.5" />
                      {r.phone}
                    </>
                  )}
                  {r.orderRef && (
                    <>
                      <span className="text-foreground-subtle">·</span>
                      <span>Ref : <span className="font-mono">{r.orderRef}</span></span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-foreground-muted">
                {r.createdAt.toLocaleString("fr-FR")}
              </div>
            </div>

            <p className="text-sm whitespace-pre-line bg-surface-2 border border-border rounded-lg p-3 mb-4">
              {r.description}
            </p>

            <form action={updateReclamationStatus} className="flex items-end gap-3 flex-wrap">
              <input type="hidden" name="id" value={r.id} />
              <label className="block">
                <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                  Statut
                </span>
                <select name="status" defaultValue={r.status} className={inputCls}>
                  {STATUSES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block flex-1 min-w-[180px]">
                <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                  Assigné à (interne)
                </span>
                <input
                  name="assignedTo"
                  defaultValue={r.assignedTo ?? ""}
                  placeholder="prénom@bonafone"
                  className={inputCls}
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_16px_var(--primary-glow)]"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";
