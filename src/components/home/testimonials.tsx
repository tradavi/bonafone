import Link from "next/link";
import { Star, Quote } from "lucide-react";
import { getAllReviews, getReviewsStats } from "@/lib/queries";
import { getStoreSettings } from "@/lib/store-settings";

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  GOOGLE: { label: "Google", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  FACEBOOK: { label: "Facebook", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  INTERNE: { label: "Vérifié", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
};

const FILTERS: { key: string; label: string; rating?: number; source?: string }[] = [
  { key: "all", label: "Tous" },
  { key: "5", label: "5 étoiles", rating: 5 },
  { key: "4", label: "4 étoiles", rating: 4 },
  { key: "3", label: "3 étoiles", rating: 3 },
  { key: "google", label: "Google", source: "GOOGLE" },
  { key: "facebook", label: "Facebook", source: "FACEBOOK" },
  { key: "verified", label: "Vérifiés", source: "INTERNE" },
];

/**
 * Section témoignages sur la home : reprend exactement le contenu de la page
 * /temoignages (header + stats + filtres + grille d'avis + CTA Google/Facebook).
 * Les filtres pointent vers /temoignages?... pour drill-down.
 */
export async function Testimonials() {
  const [reviews, stats, store] = await Promise.all([
    getAllReviews(),
    getReviewsStats(),
    getStoreSettings(),
  ]);

  const filterHref = (f: (typeof FILTERS)[number]) => {
    const params = new URLSearchParams();
    if (f.rating) params.set("rating", String(f.rating));
    if (f.source) params.set("source", f.source);
    const q = params.toString();
    return q ? `/temoignages?${q}` : "/temoignages";
  };

  return (
    <section className="bg-surface/40 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-14">
        {/* Header centré */}
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
            Témoignages
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Avis clients
          </h2>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-surface border border-border rounded-full">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i <= Math.round(stats.average)
                      ? "fill-primary text-primary"
                      : "text-border-strong"
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-lg">{stats.average.toFixed(1)}/5</span>
            <span className="text-foreground-muted text-sm">
              · {stats.count} avis publiés
            </span>
          </div>
        </div>

        {/* Filtres → /temoignages?... */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={filterHref(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                f.key === "all"
                  ? "bg-primary text-white shadow-[0_0_16px_var(--primary-glow)]"
                  : "bg-surface border border-border hover:border-primary text-foreground"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Avis */}
        {reviews.length === 0 ? (
          <div className="text-center py-20 text-foreground-muted bg-surface border border-border rounded-2xl">
            Aucun avis pour le moment.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => {
              const badge = SOURCE_BADGE[review.source] ?? SOURCE_BADGE.INTERNE;
              return (
                <div
                  key={review.id}
                  className="relative bg-surface border border-border rounded-2xl p-6 hover:border-primary transition group"
                >
                  <Quote className="absolute top-5 right-5 h-8 w-8 text-primary/15 group-hover:text-primary/30 transition" />
                  <div className="flex items-center justify-between mb-4 relative">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-4 w-4 ${
                            n <= review.rating
                              ? "fill-primary text-primary"
                              : "text-border-strong"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mb-5">« {review.comment} »</p>
                  <div className="flex items-center justify-between text-xs pt-4 border-t border-border">
                    <span className="font-semibold">{review.authorName}</span>
                    <time className="text-foreground-muted">
                      {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA Google / Facebook */}
        {(store.gmaps || store.facebook) && (
          <div className="mt-12 text-center bg-surface border border-border rounded-2xl p-10">
            <h3 className="text-xl md:text-2xl font-extrabold mb-2 tracking-tight">
              Vous avez été client ?
            </h3>
            <p className="text-foreground-muted mb-6">
              Partagez votre expérience — chaque avis compte.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {store.gmaps && (
                <a
                  href={store.gmaps}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-lg font-semibold transition"
                >
                  Laisser un avis Google
                </a>
              )}
              {store.facebook && (
                <a
                  href={store.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500 hover:text-white rounded-lg font-semibold transition"
                >
                  Laisser un avis Facebook
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
