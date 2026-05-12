import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  Save,
  Mail,
  Phone,
  Send,
  Lock,
  Clock,
  Paperclip,
  Archive,
  Inbox,
  ArchiveRestore,
} from "lucide-react";
import { getAdminAllReclamations } from "@/lib/queries";
import {
  updateReclamationStatus,
  sendReclamationReply,
  toggleArchiveReclamation,
} from "@/lib/actions/admin";

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

type HistoryEvent = { at: string; type: string; message: string };
type Attachment = { url: string; name?: string };

function parseHistory(raw: string | null): HistoryEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }
  return [];
}

function parseAttachments(raw: string | null): Attachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((a): a is Attachment => typeof a?.url === "string")
        .map((a) => ({ url: a.url, name: typeof a.name === "string" ? a.name : undefined }));
    }
  } catch {
    // ignore
  }
  return [];
}

type Props = { searchParams: Promise<{ archived?: string }> };

// Statuts "archivés" = traités/terminés. RESOLUE et CLOSE sortent les dossiers
// de la liste active mais restent consultables via l'onglet Archivés.
const ARCHIVED_STATUSES = new Set(["RESOLUE", "CLOSE"]);

export default async function AdminReclamationsPage({ searchParams }: Props) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";

  const all = await getAdminAllReclamations();
  const items = all.filter((r) =>
    showArchived
      ? ARCHIVED_STATUSES.has(r.status)
      : !ARCHIVED_STATUSES.has(r.status),
  );
  const activeCount = all.filter((r) => !ARCHIVED_STATUSES.has(r.status)).length;
  const archivedCount = all.length - activeCount;
  const open = all.filter(
    (r) => r.status === "OUVERTE" || r.status === "EN_COURS",
  ).length;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Réclamations</h1>
        <p className="text-sm text-foreground-muted">
          {activeCount} active{activeCount > 1 ? "s" : ""} · {archivedCount} archivée
          {archivedCount > 1 ? "s" : ""} · {open} à traiter
        </p>
      </div>

      {/* Onglets Actifs / Archivés — pattern identique aux réparations */}
      <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
        <Link
          href="/admin/reclamations"
          className={`px-4 py-2 inline-flex items-center gap-2 ${
            !showArchived
              ? "bg-primary text-white"
              : "bg-surface-2 hover:bg-surface text-foreground-muted"
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          Actives ({activeCount})
        </Link>
        <Link
          href="/admin/reclamations?archived=1"
          className={`px-4 py-2 inline-flex items-center gap-2 ${
            showArchived
              ? "bg-primary text-white"
              : "bg-surface-2 hover:bg-surface text-foreground-muted"
          }`}
        >
          <Archive className="h-3.5 w-3.5" />
          Archivées ({archivedCount})
        </Link>
      </div>

      <div className="grid gap-3">
        {items.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-foreground-muted">
            {showArchived
              ? "Aucune réclamation archivée pour le moment."
              : "Aucune réclamation active — bon travail !"}
          </div>
        )}
        {items.map((r) => {
          const history = parseHistory(r.history);
          const replies = history.filter(
            (h) => h.type === "REPLY_SENT" || h.type === "REPLY_DRAFT",
          );
          const attachments = parseAttachments(r.attachments);
          return (
            <div key={r.id} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              {/* En-tête */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
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
                        <span>
                          Ref : <span className="font-mono">{r.orderRef}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-xs text-foreground-muted">
                    {r.createdAt.toLocaleString("fr-FR", { timeZone: "Europe/Brussels" })}
                  </div>
                  {/* Bouton archiver/désarchiver — action 1 clic, ne touche pas
                      aux autres champs (notes internes, assignation) */}
                  <form action={toggleArchiveReclamation}>
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      type="hidden"
                      name="action"
                      value={showArchived ? "unarchive" : "archive"}
                    />
                    <button
                      type="submit"
                      className={
                        showArchived
                          ? "inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-2 border border-border hover:border-primary text-foreground-muted hover:text-primary rounded-lg text-xs font-semibold transition"
                          : "inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 hover:border-amber-500 text-amber-400 rounded-lg text-xs font-semibold transition"
                      }
                      title={
                        showArchived
                          ? "Réouvrir le dossier (statut EN_COURS)"
                          : "Archiver le dossier (statut CLOSE)"
                      }
                    >
                      {showArchived ? (
                        <>
                          <ArchiveRestore className="h-3.5 w-3.5" />
                          Réouvrir
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5" />
                          Archiver
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Description du client */}
              <div>
                <div className="text-xs text-foreground-muted font-semibold mb-1.5">
                  Description du client
                </div>
                <p className="text-sm whitespace-pre-line bg-surface-2 border border-border rounded-lg p-3">
                  {r.description}
                </p>
              </div>

              {/* Photos jointes par le client */}
              {attachments.length > 0 && (
                <div>
                  <div className="text-xs text-foreground-muted font-semibold mb-1.5 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" />
                    Photos jointes ({attachments.length})
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {attachments.map((a, i) => (
                      <a
                        key={i}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        title={a.name ?? `Photo ${i + 1}`}
                        className="relative aspect-square bg-surface-2 border border-border hover:border-primary rounded-lg overflow-hidden transition"
                      >
                        <Image
                          src={a.url}
                          alt={a.name ?? `Photo ${i + 1} de la réclamation ${r.number}`}
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                          className="object-cover"
                          unoptimized
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique des réponses envoyées */}
              {replies.length > 0 && (
                <div>
                  <div className="text-xs text-foreground-muted font-semibold mb-1.5">
                    Historique des réponses ({replies.length})
                  </div>
                  <ul className="space-y-2">
                    {replies.map((h, i) => (
                      <li
                        key={i}
                        className="text-sm bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 text-[11px] text-foreground-muted mb-1">
                          <Send className="h-3 w-3" />
                          <span className="font-semibold">
                            {h.type === "REPLY_SENT" ? "Email envoyé" : "Email préparé (mode démo)"}
                          </span>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          {new Date(h.at).toLocaleString("fr-FR", { timeZone: "Europe/Brussels" })}
                        </div>
                        <p className="whitespace-pre-line">{h.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form 1 — statut + assigné + notes internes */}
              <form action={updateReclamationStatus} className="space-y-3">
                <input type="hidden" name="id" value={r.id} />
                <div className="grid sm:grid-cols-2 gap-3">
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
                  <label className="block">
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
                </div>
                <label className="block">
                  <span className="text-xs text-foreground-muted font-semibold mb-1.5 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Note interne (jamais envoyée au client)
                  </span>
                  <textarea
                    name="internalNotes"
                    defaultValue={r.internalNotes ?? ""}
                    rows={3}
                    placeholder="Diagnostic, suivi équipe, remboursement validé par X…"
                    className={inputCls + " resize-none"}
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border hover:border-primary text-foreground rounded-lg text-sm font-semibold transition"
                  >
                    <Save className="h-4 w-4" />
                    Enregistrer le suivi interne
                  </button>
                </div>
              </form>

              {/* Form 2 — réponse au client par email */}
              <form action={sendReclamationReply} className="space-y-3 pt-3 border-t border-border">
                <input type="hidden" name="id" value={r.id} />
                <label className="block">
                  <span className="text-xs text-foreground-muted font-semibold mb-1.5 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-primary" />
                    Message au client (envoyé par email à {r.email})
                  </span>
                  <textarea
                    name="message"
                    rows={5}
                    minLength={5}
                    required
                    placeholder="Bonjour, suite à votre réclamation…"
                    className={inputCls + " resize-none"}
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_18px_var(--primary-glow)]"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer par email
                  </button>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";
