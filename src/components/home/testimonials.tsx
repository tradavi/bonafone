import { Star, Quote } from "lucide-react";
import { getFeaturedReviews, getReviewsStats } from "@/lib/queries";

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  GOOGLE: { label: "Google", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  FACEBOOK: { label: "Facebook", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  INTERNE: { label: "Vérifié", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
};

export async function Testimonials() {
  const [reviews, stats] = await Promise.all([
    getFeaturedReviews(4),
    getReviewsStats(),
  ]);

  return (
    <section className="py-16 md:py-20 bg-surface/40 border-b border-border">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
            Témoignages
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Ils nous font confiance
          </h2>
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-surface border border-border rounded-full">
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
              · {stats.count}+ avis Google et Facebook
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i <= review.rating
                            ? "fill-primary text-primary"
                            : "text-border-strong"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-5 line-clamp-4 relative">
                  « {review.comment} »
                </p>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-border">
                  <span className="font-semibold text-foreground">{review.authorName}</span>
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
      </div>
    </section>
  );
}
