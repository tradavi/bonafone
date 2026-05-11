import "server-only";
import webpush from "web-push";
import { prisma } from "./prisma";

// =====================================================
// WEB PUSH — envoi de notifications navigateur aux admins
// =====================================================
// Tolérant aux clés manquantes : si VAPID_PRIVATE_KEY absent, on no-op
// silencieusement (mode dev sans push).

export type PushPayload = {
  title: string;
  body: string;
  /** URL à ouvrir au clic — relatif au domaine, ex: "/admin/reclamations" */
  url?: string;
  /** Tag pour dédoublonner (si plusieurs notifs même tag, la dernière remplace) */
  tag?: string;
  /** Override icône (défaut : /icon de Next.js) */
  icon?: string;
};

let vapidConfigured = false;

function configureVapid(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:info@bonafone.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    return true;
  } catch (err) {
    console.error("[push] VAPID config failed:", err);
    return false;
  }
}

/**
 * Envoie une notification push à tous les admins abonnés.
 * - Supprime automatiquement les souscriptions périmées (410 Gone).
 * - No-op silencieux si VAPID pas configuré.
 */
export async function sendPushToAdmins(payload: PushPayload): Promise<{
  sent: number;
  failed: number;
  pruned: number;
}> {
  if (!configureVapid()) {
    console.log("[push] VAPID non configuré — push ignoré :", payload.title);
    return { sent: 0, failed: 0, pruned: 0 };
  }

  // Pas de relation Prisma entre PushSubscription et User → join manuel.
  // Coût négligeable : il y a au plus quelques admins/appareils.
  const allSubs = await prisma.pushSubscription.findMany();
  if (allSubs.length === 0) {
    return { sent: 0, failed: 0, pruned: 0 };
  }
  const userIds = Array.from(new Set(allSubs.map((s) => s.userId)));
  const admins = await prisma.user.findMany({
    where: { id: { in: userIds }, role: "ADMIN" },
    select: { id: true },
  });
  const adminIds = new Set(admins.map((u) => u.id));
  const subscriptions = allSubs.filter((s) => adminIds.has(s.userId));

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, pruned: 0 };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/admin",
    tag: payload.tag || "bonafone-admin",
    icon: payload.icon,
  });

  let sent = 0;
  let failed = 0;
  let pruned = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
        sent++;
      } catch (err: unknown) {
        // 404/410 = subscription périmée → on la supprime.
        const status =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        if (status === 404 || status === 410) {
          try {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
            pruned++;
          } catch {
            /* ignore */
          }
        } else {
          console.error("[push] sendNotification failed:", status, err);
          failed++;
        }
      }
    }),
  );

  return { sent, failed, pruned };
}

/**
 * Envoie une notification à un user spécifique (utilisé pour le bouton "tester
 * la notification" en paramètres). Renvoie le détail par souscription.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number; pruned: number; total: number }> {
  if (!configureVapid()) {
    return { sent: 0, failed: 0, pruned: 0, total: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, pruned: 0, total: 0 };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/admin",
    tag: payload.tag || "bonafone-test",
    icon: payload.icon,
  });

  let sent = 0;
  let failed = 0;
  let pruned = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
        sent++;
      } catch (err: unknown) {
        const status =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        if (status === 404 || status === 410) {
          try {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
            pruned++;
          } catch {
            /* ignore */
          }
        } else {
          console.error("[push] sendNotification failed:", status, err);
          failed++;
        }
      }
    }),
  );

  return { sent, failed, pruned, total: subscriptions.length };
}
