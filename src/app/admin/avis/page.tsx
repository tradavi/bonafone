import { Star, Eye, EyeOff, Trash2, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { getAdminAllReviews } from "@/lib/queries";
import {
  toggleReviewPublished,
  toggleReviewFeatured,
  deleteReview,
  createReview,
} from "@/lib/actions/admin";

export const metadata = { title: "Avis" };
export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  INTERNE: "Interne",
  GOOGLE: "Google",
  FACEBOOK: "Facebook",
};
const SOURCE_STYLES: Record<string, string> = {
  INTERNE: "bg-primary/10 text-primary border-primary/30",
  GOOGLE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  FACEBOOK: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

type Props = { searchParams: Promise<{ error?: string; created?: string }> };

export default async function AdminReviewsPage({ searchParams }: Props) {
  const { error, created } = await searchParams;
  const reviews = await getAdminAllReviews();
  const published = reviews.filter((r) => r.isPublished).length;
  const featured = reviews.filter((r) => r.isFeatured).length;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Avis</h1>
        <p className="text-sm text-foreground-muted">
          {reviews.length} avis · {published} publiés · {featured} en avant
        </p>
      </div>

      {created && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          Avis créé.
        </div>
      )}
      {error && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="h-5 w-5 text-primary shrink-0" />
          {error}
        </div>
      )}

      <details className="bg-surface border border-border rounded-2xl p-5">
        <summary className="cursor-pointer font-extrabold tracking-tight flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Ajouter un avis manuel
        </summary>
        <form action={createReview} className="mt-4 grid md:grid-cols-2 gap-3">
          <Field label="Auteur" name="authorName" required />
          <Field label="Note (1-5)" name="rating" type="number" min="1" max="5" required defaultValue="5" />
          <Field label="Titre (optionnel)" name="title" className="md:col-span-2" />
          <label className="block md:col-span-2">
            <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
              Commentaire <span className="text-primary">*</span>
            </span>
            <textarea name="comment" rows={3} required className={inputCls} />
          </label>
          <Select label="Source" name="source" defaultValue="INTERNE">
            <option value="INTERNE">Interne</option>
            <option value="GOOGLE">Google</option>
            <option value="FACEBOOK">Facebook</option>
          </Select>
          <label className="flex items-center gap-2 text-sm self-end pb-2">
            <input type="checkbox" name="isFeatured" className="accent-primary" />
            Mettre en avant
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_16px_var(--primary-glow)]"
            >
              <Plus className="h-4 w-4" />
              Créer l&apos;avis
            </button>
          </div>
        </form>
      </details>

      <div className="grid gap-3">
        {reviews.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-foreground-muted">
            Aucun avis pour le moment.
          </div>
        )}
        {reviews.map((r) => (
          <div
            key={r.id}
            className={`bg-surface border rounded-2xl p-5 ${
              r.isPublished ? "border-border" : "border-primary/30 opacity-70"
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-bold">{r.authorName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                      SOURCE_STYLES[r.source] ?? SOURCE_STYLES.INTERNE
                    }`}
                  >
                    {SOURCE_LABEL[r.source] ?? r.source}
                  </span>
                  {r.isFeatured && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">
                      ÉPINGLÉ
                    </span>
                  )}
                  {!r.isPublished && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-500/30 bg-zinc-500/10 text-zinc-400 font-bold">
                      MASQUÉ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i <= r.rating ? "fill-primary text-primary" : "text-border-strong"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-foreground-muted">
                    {r.createdAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Brussels" })}
                  </span>
                </div>
                {r.title && <div className="font-semibold mb-1">{r.title}</div>}
                <p className="text-sm text-foreground-muted leading-relaxed">{r.comment}</p>
                {r.product && (
                  <div className="text-xs text-foreground-muted mt-2">
                    Sur le produit :{" "}
                    <span className="text-primary font-medium">{r.product.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form action={toggleReviewPublished}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    title={r.isPublished ? "Masquer" : "Publier"}
                    className="h-9 w-9 grid place-items-center rounded-lg bg-surface-2 border border-border hover:border-primary transition"
                  >
                    {r.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </form>
                <form action={toggleReviewFeatured}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    title={r.isFeatured ? "Désépingler" : "Épingler"}
                    className={`h-9 w-9 grid place-items-center rounded-lg border transition ${
                      r.isFeatured
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-surface-2 border-border hover:border-primary"
                    }`}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
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
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary";

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  min,
  max,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  min?: string;
  max?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={min}
        max={max}
        className={inputCls}
      />
    </label>
  );
}
function Select({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">{label}</span>
      <select name={name} defaultValue={defaultValue} className={inputCls}>
        {children}
      </select>
    </label>
  );
}
