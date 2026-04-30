import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStoreApiKeys } from "@/lib/store-settings";

// Étendre les types NextAuth pour exposer id + role.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Cache des clés OAuth — auth() est appelé à chaque requête authentifiée et
// chaque session check. On évite de taper la DB à chaque fois.
let cachedKeys: { google?: { id: string; secret: string }; facebook?: { id: string; secret: string } } | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

async function loadOAuthKeys() {
  if (cachedKeys && Date.now() - cachedAt < CACHE_TTL_MS) return cachedKeys;
  const keys = await getStoreApiKeys();
  cachedKeys = {
    google:
      keys.googleClientId && keys.googleClientSecret
        ? { id: keys.googleClientId, secret: keys.googleClientSecret }
        : undefined,
    facebook:
      keys.facebookClientId && keys.facebookClientSecret
        ? { id: keys.facebookClientId, secret: keys.facebookClientSecret }
        : undefined,
  };
  cachedAt = Date.now();
  return cachedKeys;
}

/** Invalide le cache OAuth — appelé après mise à jour des paramètres. */
export function invalidateAuthCache() {
  cachedKeys = null;
  cachedAt = 0;
}

/**
 * État courant des providers OAuth — utilisé par les pages UI (page connexion,
 * page paramètres) pour afficher ou masquer les boutons. Async car DB-driven.
 */
export async function getOAuthStatus() {
  const keys = await loadOAuthKeys();
  return {
    google: Boolean(keys.google),
    facebook: Boolean(keys.facebook),
  };
}

const sharedConfig: Pick<NextAuthConfig, "session" | "pages" | "callbacks"> = {
  session: { strategy: "jwt" },
  pages: { signIn: "/connexion" },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Sign-in OAuth : on upsert l'utilisateur en DB et on remplace l'id par celui de notre DB.
      if (
        user &&
        account &&
        (account.provider === "google" || account.provider === "facebook")
      ) {
        const email = (user.email ?? "").toLowerCase();
        if (email) {
          const [firstName, ...rest] = (user.name ?? profile?.name ?? "").split(" ");
          const lastName = rest.join(" ") || null;
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
              email,
              firstName: firstName || null,
              lastName,
              role: "CLIENT",
              loyalty: { create: {} },
            },
          });
          token.id = dbUser.id;
          token.role = dbUser.role;
          return token;
        }
      }
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const isAdmin = path.startsWith("/admin");
      const isCompte = path.startsWith("/compte");

      if (!session?.user) {
        if (isAdmin || isCompte) {
          const url = new URL("/connexion", nextUrl);
          url.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
          return Response.redirect(url);
        }
        return true;
      }

      if (isAdmin && session.user.role !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
};

const credentialsProvider = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Mot de passe", type: "password" },
  },
  async authorize(credentials) {
    const parsed = CredentialsSchema.safeParse(credentials);
    if (!parsed.success) return null;

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.passwordHash) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    return {
      id: user.id,
      email: user.email,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.email.split("@")[0],
      role: user.role,
    };
  },
});

// Config dynamique : NextAuth v5 supporte une fonction async qui charge la
// config par requête. Permet de récupérer Google/Facebook depuis la DB.
export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
  const keys = await loadOAuthKeys();
  const providers: NextAuthConfig["providers"] = [credentialsProvider];

  if (keys.google) {
    providers.push(
      Google({ clientId: keys.google.id, clientSecret: keys.google.secret }),
    );
  }
  if (keys.facebook) {
    providers.push(
      Facebook({
        clientId: keys.facebook.id,
        clientSecret: keys.facebook.secret,
      }),
    );
  }

  return {
    ...sharedConfig,
    providers,
  };
});
