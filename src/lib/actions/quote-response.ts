"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyQuoteToken } from "@/lib/quote-token";
import { sendEmail } from "@/lib/notifications";
import { sendPushToAdmins } from "@/lib/push";
import { STORE, formatPrice } from "@/lib/utils";
import { getStoreApiKeys } from "@/lib/store-settings";

// =====================================================
// RÉPONSE CLIENT AU DEVIS (Valider / Refuser)
// =====================================================
// Appelée depuis /reparations/devis-reponse?ref=...&t=...
// Pas d'auth nécessaire — la signature HMAC du token sécurise l'opération.
//
// Comportement idempotent : si le client clique à nouveau alors que le statut
// a déjà évolué, on retourne sans rien faire (et on redirige vers la page de
// confirmation qui affichera "déjà traité").

const ACCEPT_TRANSITION_FROM = new Set([
  "DEMANDE_DEVIS",
  "RECU",
  "DIAGNOSTIC",
]);
const REFUSE_TRANSITION_FROM = new Set([
  "DEMANDE_DEVIS",
  "RECU",
  "DIAGNOSTIC",
]);

export async function respondToQuote(formData: FormData) {
  const refRaw = formData.get("ref");
  const tokenRaw = formData.get("token");
  const actionRaw = formData.get("action");

  if (typeof refRaw !== "string" || typeof tokenRaw !== "string") {
    redirect("/reparations/devis-reponse?status=invalid");
  }
  if (actionRaw !== "accept" && actionRaw !== "refuse") {
    redirect(
      `/reparations/devis-reponse?ref=${encodeURIComponent(refRaw)}&t=${encodeURIComponent(
        tokenRaw,
      )}&status=invalid`,
    );
  }

  // 1) Vérif signature
  if (!verifyQuoteToken(refRaw, tokenRaw)) {
    redirect(
      `/reparations/devis-reponse?ref=${encodeURIComponent(refRaw)}&status=invalid-token`,
    );
  }

  // 2) Charge le dossier
  const repair = await prisma.repair.findUnique({
    where: { number: refRaw },
    select: {
      id: true,
      number: true,
      status: true,
      customerName: true,
      customerEmail: true,
      brand: true,
      model: true,
      estimatedCost: true,
    },
  });

  if (!repair) {
    redirect(
      `/reparations/devis-reponse?ref=${encodeURIComponent(refRaw)}&status=not-found`,
    );
  }

  // 3) Idempotence : si le client a déjà répondu, on affiche le résultat précédent.
  if (repair.status === "DEVIS_VALIDE" || repair.status === "EN_REPARATION") {
    redirect(
      `/reparations/devis-reponse?ref=${encodeURIComponent(refRaw)}&t=${encodeURIComponent(
        tokenRaw,
      )}&status=already-accepted`,
    );
  }
  if (repair.status === "ATTENTE_RESTITUTION") {
    redirect(
      `/reparations/devis-reponse?ref=${encodeURIComponent(refRaw)}&t=${encodeURIComponent(
        tokenRaw,
      )}&status=already-refused`,
    );
  }

  const action = actionRaw;
  const allowed =
    action === "accept" ? ACCEPT_TRANSITION_FROM : REFUSE_TRANSITION_FROM;
  if (!allowed.has(repair.status)) {
    redirect(
      `/reparations/devis-reponse?ref=${encodeURIComponent(refRaw)}&t=${encodeURIComponent(
        tokenRaw,
      )}&status=closed`,
    );
  }

  const newStatus = action === "accept" ? "DEVIS_VALIDE" : "ATTENTE_RESTITUTION";
  const comment =
    action === "accept"
      ? "Devis validé par le client par email — réparation autorisée"
      : "Devis refusé par le client par email — appareil à restituer non réparé";

  // 4) Transition atomique : update statut + event historique
  await prisma.$transaction([
    prisma.repair.update({
      where: { id: repair.id },
      data: { status: newStatus },
    }),
    prisma.repairStatusEvent.create({
      data: {
        repairId: repair.id,
        status: newStatus,
        comment,
        notifiedClient: false, // c'est le client qui a déclenché, pas l'inverse
      },
    }),
  ]);

  // 5) Notification admin (push + email)
  const adminEmail = (await getStoreApiKeys()).brevoFromEmail;
  const amount = repair.estimatedCost != null ? formatPrice(repair.estimatedCost) : "";
  const pushTitle =
    action === "accept" ? "✅ Devis validé par le client" : "❌ Devis refusé par le client";
  const pushBody = `${repair.customerName} — ${repair.brand} ${repair.model}${amount ? ` (${amount})` : ""}`;

  sendPushToAdmins({
    title: pushTitle,
    body: pushBody,
    url: `/admin/reparations/${repair.number}`,
    tag: `quote-response-${repair.number}`,
  }).catch((err) => console.error("[respondToQuote] push:", err));

  if (adminEmail) {
    const subjectAdmin =
      action === "accept"
        ? `Devis ${repair.number} VALIDÉ par ${repair.customerName}`
        : `Devis ${repair.number} REFUSÉ par ${repair.customerName}`;
    const colorAccent = action === "accept" ? "#15803d" : "#dc2626";
    const labelAccent = action === "accept" ? "VALIDÉ" : "REFUSÉ";
    const followUp =
      action === "accept"
        ? "Vous pouvez démarrer la réparation."
        : "Préparez la restitution de l'appareil non réparé.";
    const html = `<!doctype html>
<html><body style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#f4f4f5;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:10px;padding:24px">
    <div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px">Réponse client devis</div>
    <h1 style="font-size:22px;font-weight:800;color:#18181b;margin:0 0 16px 0">Devis <span style="font-family:ui-monospace,Menlo,monospace;color:#ff2d3a">${repair.number}</span> ${labelAccent}</h1>
    <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:14px;margin:12px 0;font-size:14px;color:#18181b">
      <div><strong>Client :</strong> ${escape(repair.customerName)}</div>
      <div><strong>Appareil :</strong> ${escape(repair.brand)} ${escape(repair.model)}</div>
      ${amount ? `<div><strong>Montant :</strong> <span style="color:#ff2d3a;font-weight:700">${amount}</span> TTC</div>` : ""}
      <div style="margin-top:8px;font-size:13px;color:${colorAccent};font-weight:700">→ ${labelAccent}</div>
    </div>
    <p style="font-size:14px;color:#52525b;margin:14px 0">${followUp}</p>
    <a href="${baseUrl()}/admin/reparations/${repair.number}" style="display:inline-block;background:#ff2d3a;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">Ouvrir le dossier</a>
  </div>
  <div style="text-align:center;margin-top:14px;font-size:11px;color:#a1a1aa">${escape(STORE.name)}</div>
</body></html>`;
    sendEmail({
      to: adminEmail,
      subject: subjectAdmin,
      html,
    }).catch((err) => console.error("[respondToQuote] admin email:", err));
  }

  // 6) Invalide les pages concernées
  revalidatePath(`/admin/reparations/${repair.number}`);
  revalidatePath("/admin/reparations");
  revalidatePath("/admin/devis");
  revalidatePath("/admin");
  revalidatePath(`/reparations/suivi`);

  // 7) Redirection vers la page de confirmation
  redirect(
    `/reparations/devis-reponse?ref=${encodeURIComponent(refRaw)}&t=${encodeURIComponent(
      tokenRaw,
    )}&status=${action === "accept" ? "accepted" : "refused"}`,
  );
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseUrl(): string {
  return process.env.AUTH_URL ?? "http://localhost:3000";
}
