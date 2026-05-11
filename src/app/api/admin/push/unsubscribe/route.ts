import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Supprime une souscription Web Push. Le client envoie l'endpoint qu'il vient
 * de désabonner.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  // deleteMany pour ne pas crasher si déjà supprimé.
  await prisma.pushSubscription.deleteMany({
    where: {
      endpoint: body.endpoint,
      userId: session.user.id as string,
    },
  });

  return NextResponse.json({ ok: true });
}
