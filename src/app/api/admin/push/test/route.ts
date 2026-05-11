import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Envoie une notification push de test à l'admin courant (à toutes ses
 * souscriptions enregistrées). Utilisé par le bouton "Tester" dans la UI.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendPushToUser(session.user.id as string, {
    title: "Test Bonafone",
    body: "Si vous voyez cette notification, c'est que tout marche ✓",
    url: "/admin",
    tag: "bonafone-test",
  });

  if (result.total === 0) {
    return NextResponse.json(
      { ok: false, error: "Aucun appareil abonné. Activez d'abord les notifications push." },
      { status: 400 },
    );
  }
  if (result.sent === 0) {
    return NextResponse.json(
      { ok: false, error: "Envoi échoué — vérifiez la configuration VAPID côté serveur." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
