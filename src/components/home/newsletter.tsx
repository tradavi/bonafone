import { Mail } from "lucide-react";
import { subscribeNewsletter } from "@/lib/actions/newsletter";

export function Newsletter() {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[800px] bg-primary/15 blur-[120px] rounded-full" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white mb-5 shadow-[0_0_32px_var(--primary-glow)]">
          <Mail className="h-6 w-6" />
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
          Restez à l&apos;affût des{" "}
          <span className="bg-gradient-to-r from-primary to-primary-strong bg-clip-text text-transparent">
            bons plans
          </span>
        </h2>
        <p className="text-foreground-muted mb-8 max-w-xl mx-auto leading-relaxed">
          Inscrivez-vous à la newsletter et recevez en avant-première nos offres exclusives, ventes flash et conseils tech.
        </p>
        <form
          action={subscribeNewsletter}
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="votre@email.com"
            className="flex-1 px-4 py-3.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="px-6 py-3.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_24px_var(--primary-glow)]"
          >
            S&apos;inscrire
          </button>
        </form>
        <p className="text-xs text-foreground-subtle mt-4">
          En vous inscrivant, vous acceptez de recevoir nos communications. Désabonnement en 1 clic.
        </p>
      </div>
    </section>
  );
}
