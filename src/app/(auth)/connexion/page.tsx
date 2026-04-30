import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { auth, getOAuthStatus } from "@/auth";
import {
  signInAction,
  signInWithGoogle,
  signInWithFacebook,
} from "@/lib/actions/auth";

export const metadata = { title: "Connexion" };

type Props = {
  searchParams: Promise<{ error?: string; callbackUrl?: string; registered?: string }>;
};

export default async function ConnexionPage({ searchParams }: Props) {
  const { error, callbackUrl, registered } = await searchParams;

  // Déjà connecté ? On redirige.
  const session = await auth();
  if (session?.user) {
    redirect(callbackUrl || (session.user.role === "ADMIN" ? "/admin" : "/compte"));
  }

  const oauth = await getOAuthStatus();

  return (
    <div className="bg-background min-h-[70vh] grid place-items-center py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative bg-surface border border-border rounded-2xl p-8 w-full max-w-md mx-4">
        <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Connexion</h1>
        <p className="text-foreground-muted mb-6">Heureux de vous revoir !</p>

        {registered && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-400">Compte créé</div>
              <div className="text-foreground-muted">Connectez-vous avec vos identifiants.</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-foreground-muted">{error}</div>
          </div>
        )}

        <form action={signInAction} className="space-y-4">
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
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
            <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_24px_var(--primary-glow)]"
          >
            Se connecter
          </button>
        </form>

        {(oauth.google || oauth.facebook) && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-foreground-subtle">
              <div className="flex-1 h-px bg-border" /> ou <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              {oauth.google && (
                <form action={signInWithGoogle}>
                  {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 bg-surface-2 border border-border hover:border-primary rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <GoogleLogo />
                    Continuer avec Google
                  </button>
                </form>
              )}
              {oauth.facebook && (
                <form action={signInWithFacebook}>
                  {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 bg-surface-2 border border-border hover:border-primary rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <FacebookLogo />
                    Continuer avec Facebook
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        <p className="text-sm text-center mt-6 text-foreground-muted">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-primary font-semibold">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary";

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.7 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.7 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.2 5.2C40.9 36 44 30.6 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.469H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/>
    </svg>
  );
}
