import { Mail, Phone, Trash2, Reply } from "lucide-react";
import { getAdminAllMessages } from "@/lib/queries";
import { deleteContactMessage } from "@/lib/actions/admin";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await getAdminAllMessages();
  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Messages de contact</h1>
        <p className="text-sm text-foreground-muted">
          {messages.length} message{messages.length > 1 ? "s" : ""} reçu{messages.length > 1 ? "s" : ""}.
        </p>
      </div>

      <div className="grid gap-3">
        {messages.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-foreground-muted">
            Aucun message pour le moment.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <div className="font-bold mb-1">{m.subject}</div>
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
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border hover:border-primary rounded-lg text-sm font-semibold transition"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Répondre
                </a>
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
            <p className="text-sm whitespace-pre-line bg-surface-2 border border-border rounded-lg p-3 mb-2">
              {m.message}
            </p>
            <div className="text-xs text-foreground-muted">
              Reçu le {m.createdAt.toLocaleString("fr-FR")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
