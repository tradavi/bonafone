import { Star, Trash2, Clock, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createMyReview, deleteMyReview } from "@/lib/actions/reviews";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export const metadata = { title: "Mes avis" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ submitted?: string; deleted?: string; error?: string }>;
};

export default async function MesAvisPage({ searchParams }: Props) {
  const { submitted, deleted, error } = await searchParams;
  const session = await auth();
  if (!session?.user) return null;

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Mes avis</h1>
        <p className="text-sm text-foreground-muted">
          Partagez votre expérience. Les avis sont publiés sur le site après
          validation par notre équipe.
        </p>
      </div>

      {/* Flash messages */}
      {submitted && (
        <Banner type="success" icon={CheckCircle2}>
          <strong>Avis envoyé !</strong> Il apparaîtra sur le site après validation par notre équipe.
        </Banner>
      )}
      {deleted && (
        <Banner type="success" icon={CheckCircle2}>
          Avis supprimé.
        </Banner>
      )}
      {error && (
        <Banner type="error" icon={AlertCircle}>
          {error}
        </Banner>
      )}

      {/* Formulaire nouveau avis */}
      <NewReviewForm />

      {/* Liste des avis soumis */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-extrabold tracking-tight mb-4">
          Mes avis publiés et en attente ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-8">
            Vous n&apos;avez pas encore déposé d&apos;avis.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className={`border rounded-xl p-4 ${
                  r.isPublished
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-amber-500/5 border-amber-500/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= r.rating
                              ? "fill-primary text-primary"
                              : "text-border-strong"
                          }`}
                        />
                      ))}
                    </div>
                    {r.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        Publié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Clock className="h-3 w-3" />
                        En attente d&apos;approbation
                      </span>
                    )}
                  </div>
                  <form action={deleteMyReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmSubmitButton
                      message="Supprimer cet avis ?"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-foreground-muted hover:text-primary hover:bg-primary/10 rounded text-xs font-semibold transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </ConfirmSubmitButton>
                  </form>
                </div>

                {r.title && (
                  <div className="font-bold text-sm mb-1">{r.title}</div>
                )}
                <p className="text-sm text-foreground/80 whitespace-pre-line">{r.comment}</p>
                <div className="text-xs text-foreground-muted mt-2">
                  Soumis le{" "}
                  {r.createdAt.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Europe/Brussels",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewReviewForm() {
  return (
    <form
      action={createMyReview}
      className="bg-surface border border-border rounded-2xl p-6 space-y-4"
    >
      <h2 className="font-extrabold tracking-tight">Laisser un avis</h2>

      <div>
        <label className="block">
          <span className="text-xs text-foreground-muted font-semibold mb-2 block">
            Votre note <span className="text-primary">*</span>
          </span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="cursor-pointer group"
                title={`${n} étoile${n > 1 ? "s" : ""}`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  required
                  className="peer sr-only"
                />
                <Star className="h-8 w-8 text-border-strong hover:fill-primary hover:text-primary peer-checked:fill-primary peer-checked:text-primary transition" />
              </label>
            ))}
          </div>
        </label>
      </div>

      <div>
        <label className="block">
          <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
            Titre (optionnel)
          </span>
          <input
            name="title"
            type="text"
            maxLength={200}
            placeholder="Service rapide et efficace"
            className={inputCls}
          />
        </label>
      </div>

      <div>
        <label className="block">
          <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
            Votre avis <span className="text-primary">*</span>
          </span>
          <textarea
            name="comment"
            rows={4}
            required
            minLength={10}
            maxLength={2000}
            placeholder="Décrivez votre expérience avec Bonafone…"
            className={inputCls}
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_18px_var(--primary-glow)]"
        >
          <Send className="h-4 w-4" />
          Envoyer mon avis
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

function Banner({
  type,
  icon: Icon,
  children,
}: {
  type: "success" | "error";
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const cls =
    type === "success"
      ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
      : "bg-primary/10 border-primary/30 text-foreground";
  const iconCls = type === "success" ? "text-emerald-400" : "text-primary";
  return (
    <div className={`p-3 rounded-xl border flex items-start gap-2 text-sm ${cls}`}>
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconCls}`} />
      <div>{children}</div>
    </div>
  );
}
