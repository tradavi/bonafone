import {
  Mail,
  Phone,
  Trash2,
  Send,
  Lock,
  Save,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { getAdminAllMessages } from "@/lib/queries";
import {
  deleteContactMessage,
  updateContactNotes,
  replyToContactMessage,
} from "@/lib/actions/admin";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

type HistoryEvent = { at: string; type: string; message: string };

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

export default async function AdminMessagesPage() {
  const messages = await getAdminAllMessages();
  const replied = messages.filter((m) => parseHistory(m.history).length > 0).length;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Messages de contact</h1>
        <p className="text-sm text-foreground-muted">
          {messages.length} message{messages.length > 1 ? "s" : ""} ·{" "}
          {replied} répondu{replied > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-3">
        {messages.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-foreground-muted">
            Aucun message pour le moment.
          </div>
        )}
        {messages.map((m) => {
          const history = parseHistory(m.history);
          const replies = history.filter(
            (h) => h.type === "REPLY_SENT" || h.type === "REPLY_DRAFT",
          );
          const hasReplied = replies.length > 0;
          return (
            <div key={m.id} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold">{m.subject}</span>
                    {hasReplied && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        Répondu
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-foreground-muted flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{m.name}</span>
                    <span className="text-foreground-subtle">·</span>
                    <Mail className="h-3.5 w-3.5" />
                    {m.email}
                    {m.phone && (
                      <>
                        <span className="text-foreground-subtle">·</span>
                        <Phone className="h-3.5 w-3.5" />
                        {m.phone}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-foreground-muted">
                    {m.createdAt.toLocaleString("fr-FR", { timeZone: "Europe/Brussels" })}
                  </span>
                  <form action={deleteContactMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      title="Supprimer"
                      className="h-9 w-9 grid place-items-center rounded-lg bg-surface-2 border border-border hover:border-primary hover:text-primary transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Message du client */}
              <div>
                <div className="text-xs text-foreground-muted font-semibold mb-1.5">
                  Message du client
                </div>
                <p className="text-sm whitespace-pre-line bg-surface-2 border border-border rounded-lg p-3">
                  {m.message}
                </p>
              </div>

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
                            {h.type === "REPLY_SENT"
                              ? "Email envoyé"
                              : "Email préparé (mode démo)"}
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

              {/* Form 1 — note interne */}
              <form action={updateContactNotes} className="space-y-2">
                <input type="hidden" name="id" value={m.id} />
                <label className="block">
                  <span className="text-xs text-foreground-muted font-semibold mb-1.5 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Note interne (jamais envoyée au client)
                  </span>
                  <textarea
                    name="internalNotes"
                    defaultValue={m.internalNotes ?? ""}
                    rows={2}
                    placeholder="Suivi équipe, contexte, à recontacter…"
                    className={inputCls + " resize-none"}
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border hover:border-primary text-foreground rounded-lg text-sm font-semibold transition"
                  >
                    <Save className="h-4 w-4" />
                    Enregistrer la note
                  </button>
                </div>
              </form>

              {/* Form 2 — réponse email */}
              <form
                action={replyToContactMessage}
                className="space-y-2 pt-3 border-t border-border"
              >
                <input type="hidden" name="id" value={m.id} />
                <label className="block">
                  <span className="text-xs text-foreground-muted font-semibold mb-1.5 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-primary" />
                    Réponse au client (envoyée par email à {m.email})
                  </span>
                  <textarea
                    name="message"
                    rows={5}
                    minLength={5}
                    required
                    placeholder={`Bonjour ${m.name.split(" ")[0]}, merci pour votre message…`}
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
