import "server-only";
import { STORE } from "@/lib/utils";
import { getStoreApiKeys } from "@/lib/store-settings";

// =====================================================
// NOTIFICATIONS — Brevo (email) + Twilio (SMS)
// =====================================================
// Tolérant aux clés manquantes : si BREVO_API_KEY ou les vars Twilio
// sont absentes, on no-op silencieusement (log uniquement). Permet
// le mode démo en local sans crash.

type SendEmailInput = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; skipped?: boolean }> {
  const keys = await getStoreApiKeys();
  const apiKey = keys.brevoApiKey;
  const fromEmail = keys.brevoFromEmail;

  if (!apiKey || !fromEmail) {
    console.log(`📧 [demo] email à ${input.to} : ${input.subject}`);
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: STORE.name },
        to: [{ email: input.to, name: input.toName ?? input.to }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text ?? stripHtml(input.html),
        ...(input.replyTo && { replyTo: { email: input.replyTo } }),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[brevo] ${res.status} ${res.statusText} :`, body.slice(0, 500));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[brevo] exception:", err);
    return { ok: false };
  }
}

type SendSmsInput = {
  to: string;
  body: string;
};

export async function sendSms(input: SendSmsInput): Promise<{ ok: boolean; skipped?: boolean }> {
  const keys = await getStoreApiKeys();
  const sid = keys.twilioAccountSid;
  const token = keys.twilioAuthToken;
  const from = keys.twilioFromNumber;

  if (!sid || !token || !from) {
    console.log(`📲 [demo] sms à ${input.to} : ${input.body.slice(0, 80)}`);
    return { ok: true, skipped: true };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ From: from, To: input.to, Body: input.body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: params,
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[twilio] ${res.status} ${res.statusText} :`, body.slice(0, 500));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[twilio] exception:", err);
    return { ok: false };
  }
}

// =====================================================
// TEMPLATES
// =====================================================

function emailLayout(content: string): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>${STORE.name}</title></head>
<body style="margin:0;background:#0a0a0a;color:#e5e5e5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:16px;padding:28px">
    <div style="font-size:20px;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px">${STORE.name}</div>
    <div style="color:#a3a3a3;font-size:13px;margin-bottom:20px">${STORE.tagline}</div>
    <div style="font-size:14px;line-height:1.6">${content}</div>
    <div style="border-top:1px solid #262626;margin-top:24px;padding-top:16px;color:#737373;font-size:12px">
      ${STORE.address}<br>
      ${STORE.phone} · <a style="color:#a3a3a3" href="mailto:${STORE.email}">${STORE.email}</a>
    </div>
  </div>
</body></html>`;
}

export function tplDevisReceived(opts: {
  customerName: string;
  number: string;
  device: string;
  issueType: string;
}) {
  const subject = `Votre demande de devis ${opts.number}`;
  const trackUrl = `${baseUrl()}/reparations/suivi?ref=${opts.number}`;
  const html = emailLayout(`
    <p>Bonjour ${escapeHtml(opts.customerName.split(" ")[0])},</p>
    <p>Nous avons bien reçu votre demande de devis pour <strong>${escapeHtml(opts.device)}</strong> (${escapeHtml(opts.issueType)}).</p>
    <p>Numéro de dossier : <strong style="color:#ef4444;font-family:ui-monospace,Menlo,monospace">${opts.number}</strong></p>
    <p>Notre équipe revient vers vous sous 24h ouvrées.</p>
    <p><a href="${trackUrl}" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Suivre ma réparation</a></p>
  `);
  return { subject, html };
}

export function tplRepairQuote(opts: {
  customerName: string;
  number: string;
  device: string;
  issueType: string;
  estimatedCost: string;
  parts: { name: string; cost: number }[];
  message?: string;
}) {
  const subject = `Devis ${opts.number} — ${opts.estimatedCost}`;
  const trackUrl = `${baseUrl()}/reparations/suivi?ref=${opts.number}`;
  const partsHtml = opts.parts.length
    ? `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px">
        <thead><tr style="text-align:left;color:#a3a3a3;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">
          <th style="padding:6px 0;border-bottom:1px solid #262626">Pièce</th>
          <th style="padding:6px 0;border-bottom:1px solid #262626;text-align:right">Prix</th>
        </tr></thead>
        <tbody>
        ${opts.parts
          .map(
            (p) => `<tr>
            <td style="padding:6px 0;border-bottom:1px solid #1f1f1f">${escapeHtml(p.name)}</td>
            <td style="padding:6px 0;border-bottom:1px solid #1f1f1f;text-align:right;color:#a3a3a3">${p.cost.toFixed(2)} €</td>
          </tr>`,
          )
          .join("")}
        </tbody>
       </table>`
    : "";
  const html = emailLayout(`
    <p>Bonjour ${escapeHtml(opts.customerName.split(" ")[0])},</p>
    <p>Voici notre proposition de devis pour la réparation de votre <strong>${escapeHtml(opts.device)}</strong> (${escapeHtml(opts.issueType)}).</p>
    <p>Numéro de dossier : <strong style="color:#ef4444;font-family:ui-monospace,Menlo,monospace">${opts.number}</strong></p>
    ${partsHtml}
    <div style="background:#1f1f1f;border:1px solid #262626;border-radius:10px;padding:14px 18px;margin:16px 0;display:flex;justify-content:space-between;align-items:baseline">
      <span style="color:#a3a3a3;font-size:13px">Montant estimé</span>
      <strong style="font-size:20px;color:#ef4444">${escapeHtml(opts.estimatedCost)}</strong>
    </div>
    ${opts.message ? `<p style="color:#a3a3a3;white-space:pre-line">${escapeHtml(opts.message)}</p>` : ""}
    <p>Pour valider ce devis, répondez à cet email ou rendez-vous sur le suivi de votre dossier.</p>
    <p><a href="${trackUrl}" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Suivre mon dossier</a></p>
  `);
  return { subject, html };
}

export function tplOrderConfirmation(opts: {
  customerName?: string;
  number: string;
  total: string;
}) {
  const subject = `Confirmation de commande ${opts.number}`;
  const ordersUrl = `${baseUrl()}/compte/commandes`;
  const html = emailLayout(`
    <p>Bonjour ${escapeHtml(opts.customerName?.split(" ")[0] ?? "")},</p>
    <p>Merci pour votre commande ! Nous préparons votre colis.</p>
    <p>Numéro de commande : <strong style="color:#ef4444;font-family:ui-monospace,Menlo,monospace">${opts.number}</strong><br>
    Montant : <strong>${escapeHtml(opts.total)}</strong></p>
    <p><a href="${ordersUrl}" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Mes commandes</a></p>
  `);
  return { subject, html };
}

export function tplRepairStatus(opts: {
  customerName: string;
  number: string;
  status: string;
  comment?: string;
}) {
  const label = REPAIR_STATUS_LABEL[opts.status] ?? opts.status.replace(/_/g, " ");
  const subject = `${opts.number} — ${label}`;
  const trackUrl = `${baseUrl()}/reparations/suivi?ref=${opts.number}`;
  const html = emailLayout(`
    <p>Bonjour ${escapeHtml(opts.customerName.split(" ")[0])},</p>
    <p>Le statut de votre dossier <strong style="color:#ef4444;font-family:ui-monospace,Menlo,monospace">${opts.number}</strong> a évolué :</p>
    <p style="font-size:18px;font-weight:700">${escapeHtml(label)}</p>
    ${opts.comment ? `<p style="color:#a3a3a3">${escapeHtml(opts.comment)}</p>` : ""}
    <p><a href="${trackUrl}" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Suivre ma réparation</a></p>
  `);
  const sms = `${STORE.name} — ${opts.number} : ${label}${opts.comment ? `. ${opts.comment}` : ""}. Suivi : ${trackUrl}`;
  return { subject, html, sms };
}

export function tplWelcome(opts: { firstName: string }) {
  const subject = `Bienvenue chez ${STORE.name} !`;
  const html = emailLayout(`
    <p>Bonjour ${escapeHtml(opts.firstName)},</p>
    <p>Merci pour votre inscription. Vous pouvez désormais suivre vos commandes et réparations depuis votre espace client.</p>
    <p><a href="${baseUrl()}/compte" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Mon espace client</a></p>
  `);
  return { subject, html };
}

/**
 * Envoyé quand l'admin crée un compte client lors d'une réparation.
 * Le client reçoit un mot de passe temporaire qu'il peut changer
 * depuis son espace.
 */
export function tplAccountCreatedByAdmin(opts: {
  firstName: string;
  email: string;
  temporaryPassword: string;
  repairNumber?: string;
}) {
  const subject = `Bienvenue chez ${STORE.name} — accès à votre espace client`;
  const repairLine = opts.repairNumber
    ? `<p>Votre dossier de réparation <strong style="color:#ef4444;font-family:ui-monospace,Menlo,monospace">${opts.repairNumber}</strong> est désormais accessible depuis votre espace.</p>`
    : "";
  const html = emailLayout(`
    <p>Bonjour ${escapeHtml(opts.firstName)},</p>
    <p>Un espace client a été créé pour vous chez <strong>${STORE.name}</strong>.</p>
    ${repairLine}
    <p>Vos identifiants de connexion :</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;overflow:hidden">
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280">Email</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-family:ui-monospace,Menlo,monospace;font-size:14px;font-weight:600">${escapeHtml(opts.email)}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#6b7280">Mot de passe temporaire</td>
        <td style="padding:10px 14px;font-family:ui-monospace,Menlo,monospace;font-size:14px;font-weight:600;color:#ef4444">${escapeHtml(opts.temporaryPassword)}</td>
      </tr>
    </table>
    <p><a href="${baseUrl()}/connexion" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Se connecter</a></p>
    <p style="color:#6b7280;font-size:13px;margin-top:24px">
      Pour votre sécurité, changez ce mot de passe dès votre première connexion depuis l'onglet
      <strong>Mon profil</strong>.
    </p>
  `);
  return { subject, html };
}

export function tplReclamationReceived(opts: { number: string }) {
  const subject = `Votre réclamation ${opts.number} a bien été reçue`;
  const html = emailLayout(`
    <p>Bonjour,</p>
    <p>Nous avons bien reçu votre réclamation <strong style="color:#ef4444;font-family:ui-monospace,Menlo,monospace">${opts.number}</strong>. Notre équipe vous répondra dans les plus brefs délais.</p>
  `);
  return { subject, html };
}

export function tplContactReply(opts: {
  customerName: string;
  subject: string;
  message: string;
}) {
  const subject = `Re: ${opts.subject}`;
  const html = emailLayout(`
    <p>Bonjour ${escapeHtml(opts.customerName.split(" ")[0] || opts.customerName)},</p>
    <p>Merci pour votre message. Voici notre réponse :</p>
    <div style="background:#1f1f1f;border:1px solid #262626;border-radius:10px;padding:14px 18px;margin:16px 0;white-space:pre-line">${escapeHtml(opts.message)}</div>
    <p style="color:#a3a3a3;font-size:13px">Pour toute précision, n'hésitez pas à répondre à cet email.</p>
  `);
  return { subject, html };
}

export function tplReclamationReply(opts: {
  number: string;
  message: string;
}) {
  const subject = `Réponse à votre réclamation ${opts.number}`;
  // Le message admin est inséré tel quel (whitespace préservé via white-space:pre-line)
  const html = emailLayout(`
    <p>Bonjour,</p>
    <p>Concernant votre réclamation <strong style="color:#ef4444;font-family:ui-monospace,Menlo,monospace">${opts.number}</strong>, voici notre réponse :</p>
    <div style="background:#1f1f1f;border:1px solid #262626;border-radius:10px;padding:14px 18px;margin:16px 0;white-space:pre-line">${escapeHtml(opts.message)}</div>
    <p style="color:#a3a3a3;font-size:13px">Pour toute précision, n'hésitez pas à répondre à cet email.</p>
  `);
  return { subject, html };
}

// =====================================================
// HELPERS
// =====================================================

const REPAIR_STATUS_LABEL: Record<string, string> = {
  DEMANDE_DEVIS: "Demande de devis reçue",
  RECU: "Appareil reçu en boutique",
  DIAGNOSTIC: "Diagnostic en cours",
  DEVIS_VALIDE: "Devis validé",
  EN_REPARATION: "En réparation",
  ATTENTE_PIECE: "En attente de pièce",
  TERMINE: "Réparation terminée",
  PRET_RECUPERATION: "Prêt à récupérer",
  RESTITUE: "Restitué",
  IRREPARABLE: "Irréparable",
};

function baseUrl() {
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
