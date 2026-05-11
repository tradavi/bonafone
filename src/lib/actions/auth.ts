"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut, auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, tplWelcome } from "@/lib/notifications";

// =====================================================
// CONNEXION
// =====================================================

const SignInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  callbackUrl: z.string().optional(),
});

export async function signInAction(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    // Trim défensif (sauf password : voir signUpAction).
    if (typeof v === "string") raw[k] = k === "password" ? v : v.trim();
  }
  const parsed = SignInSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/connexion?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }

  const { email, password, callbackUrl } = parsed.data;

  try {
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirectTo: callbackUrl || "/compte",
    });
  } catch (err) {
    // signIn() jette une erreur de redirect spéciale en cas de succès — il faut la laisser remonter.
    if (err instanceof AuthError) {
      const msg =
        err.type === "CredentialsSignin"
          ? "Email ou mot de passe incorrect"
          : "Erreur de connexion, réessayez";
      redirect(`/connexion?error=${encodeURIComponent(msg)}`);
    }
    throw err;
  }
}

// =====================================================
// INSCRIPTION
// =====================================================

const SignUpSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().max(30).optional(),
  password: z.string().min(6, "Mot de passe : 6 caractères min"),
});

export async function signUpAction(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    // Trim défensif sur tout sauf le mot de passe (un mdp peut commencer
    // par un espace volontaire — rare mais on respecte).
    if (typeof v === "string") raw[k] = k === "password" ? v : v.trim();
  }
  const parsed = SignUpSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/inscription?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }

  const { firstName, lastName, email, phone, password } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
  if (existing) {
    redirect(
      `/inscription?error=${encodeURIComponent("Un compte existe déjà avec cet email")}`,
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email: lowerEmail,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: "CLIENT",
      loyalty: { create: {} },
    },
  });

  const tpl = tplWelcome({ firstName });
  await sendEmail({
    to: lowerEmail,
    toName: `${firstName} ${lastName}`,
    subject: tpl.subject,
    html: tpl.html,
  });

  // Auto-connexion après inscription
  try {
    await signIn("credentials", {
      email: lowerEmail,
      password,
      redirectTo: "/compte",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      // Compte créé mais signIn a échoué — on redirige vers la page de connexion.
      redirect("/connexion?registered=1");
    }
    throw err;
  }
}

// =====================================================
// DÉCONNEXION
// =====================================================

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

// =====================================================
// MISE À JOUR PROFIL
// =====================================================

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  phone: z.string().max(30).optional(),
});

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion?error=Non+connecté");
  }

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const parsed = UpdateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/compte/profil?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }

  const { firstName, lastName, phone } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName,
      lastName,
      phone: phone || null,
    },
  });

  redirect("/compte/profil?updated=1");
}

// =====================================================
// CHANGEMENT DE MOT DE PASSE
// =====================================================

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(6, "Nouveau mot de passe : 6 caractères min"),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion?error=Non+connecté");
  }

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const parsed = ChangePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/compte/profil?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    redirect(
      `/compte/profil?error=${encodeURIComponent("Ce compte n'a pas de mot de passe (connexion via Google/Facebook)")}`,
    );
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    redirect(
      `/compte/profil?error=${encodeURIComponent("Mot de passe actuel incorrect")}`,
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  redirect("/compte/profil?passwordChanged=1");
}

// =====================================================
// OAUTH (Google / Facebook)
// =====================================================

export async function signInWithGoogle(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  await signIn("google", {
    redirectTo: typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/compte",
  });
}

export async function signInWithFacebook(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  await signIn("facebook", {
    redirectTo: typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/compte",
  });
}
