import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { auth } from "@/auth";
import { signUpAction } from "@/lib/actions/auth";

export const metadata = { title: "Créer un compte" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function InscriptionPage({ searchParams }: Props) {
  const { error } = await searchParams;

  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/compte");
  }

  return (
    <div className="bg-background min-h-[70vh] grid place-items-center py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative bg-surface border border-border rounded-2xl p-8 w-full max-w-md mx-4">
        <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Créer un compte</h1>
        <p className="text-foreground-muted mb-6">
          Suivez vos commandes et bénéficiez du programme fidélité.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-foreground-muted">{error}</div>
          </div>
        )}

        <form action={signUpAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Prénom</label>
              <input name="firstName" required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom</label>
              <input name="lastName" required className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Téléphone</label>
            <input name="phone" type="tel" autoComplete="tel" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Mot de passe <span className="text-foreground-muted text-xs">(6 caractères min)</span>
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className={inputCls}
            />
          </div>
          <label className="flex items-start gap-2 text-xs text-foreground-muted">
            <input type="checkbox" required className="mt-0.5 accent-primary" />
            J&apos;accepte les CGV et la politique de confidentialité (RGPD).
          </label>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_24px_var(--primary-glow)]"
          >
            Créer mon compte
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-foreground-muted">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-primary font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary";
