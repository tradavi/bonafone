import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Enregistre (ou met à jour) une souscription Web Push pour l'admin courant.
 * Le body attend la PushSubscription sérialisée côté client (toJSON()).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const authKey = body?.keys?.auth;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json(
      { error: "Missing endpoint/keys" },
      { status: 400 },
    );
  }

  const userAgent = req.headers.get("user-agent") ?? null;

  // Upsert par endpoint (chaque navigateur/device en a un unique).
  // Si l'utilisateur change de compte sur la même machine, on réassigne
  // au nouvel userId — c'est voulu.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: session.user.id as string,
      p256dh,
      auth: authKey,
      userAgent,
    },
    create: {
      userId: session.user.id as string,
      endpoint,
      p256dh,
      auth: authKey,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
