import { redirect } from "next/navigation";
import { User, Lock, Save, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/auth";

export const metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ updated?: string; passwordChanged?: string; error?: string }>;
};

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

export default async function ProfilPage({ searchParams }: Props) {
  const { updated, passwordChanged, error } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/profil");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      passwordHash: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/connexion");

  const hasPassword = Boolean(user.passwordHash);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 grid place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">Mon profil</h1>
            <p className="text-sm text-foreground-muted">
              Modifiez vos informations personnelles.
            </p>
          </div>
        </div>
      </div>

      {/* Flash messages */}
      {error && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-sm flex items-center gap-2 text-primary">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {updated && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-sm flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Informations enregistrées.
        </div>
      )}
      {passwordChanged && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-sm flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Mot de passe mis à jour.
        </div>
      )}

      {/* Infos personnelles */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-extrabold tracking-tight mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Informations personnelles
        </h2>
        <form action={updateProfileAction} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Prénom</label>
              <input
                name="firstName"
                type="text"
                defaultValue={user.firstName ?? ""}
                required
                maxLength={100}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Nom</label>
              <input
                name="lastName"
                type="text"
                defaultValue={user.lastName ?? ""}
                required
                maxLength={100}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground-muted mb-1">Téléphone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={user.phone ?? ""}
              maxLength={30}
              placeholder="+32 ..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-foreground-muted mb-1">Email</label>
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground-muted">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
              <span className="ml-auto text-[10px] uppercase tracking-wider">Non modifiable</span>
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-extrabold tracking-tight mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          Mot de passe
        </h2>
        {!hasPassword ? (
          <p className="text-sm text-foreground-muted">
            Ce compte est connecté via un fournisseur externe (Google/Facebook). Il n&apos;y a pas
            de mot de passe local à modifier.
          </p>
        ) : (
          <form action={changePasswordAction} className="space-y-4">
            <div>
              <label className="block text-xs text-foreground-muted mb-1">
                Mot de passe actuel
              </label>
              <input
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className={inputCls}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-foreground-muted mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Confirmer</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputCls}
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition"
            >
              <Lock className="h-4 w-4" />
              Changer le mot de passe
            </button>
          </form>
        )}
      </div>

      <div className="text-xs text-foreground-muted text-right">
        Compte créé le {user.createdAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Brussels" })} ·{" "}
        {isAdmin ? "Administrateur" : user.role === "TECHNICIEN" ? "Technicien" : "Client"}
      </div>
    </div>
  );
}
