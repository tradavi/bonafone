// Le middleware Auth.js applique le callback `authorized` défini dans auth.ts
// à toutes les routes matchées par `config.matcher` ci-dessous.
//
// Runtime Node requis : auth.ts utilise Prisma + crypto pour déchiffrer les
// clés OAuth stockées en DB, ce qui n'est pas dispo sur Edge.
export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
  runtime: "nodejs",
};
