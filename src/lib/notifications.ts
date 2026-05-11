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

export type SendEmailResult = {
  ok: boolean;
  skipped?: boolean;
  /** Message d'erreur Brevo (lisible humain) si ok=false */
  error?: string;
  /** Code de statut HTTP renvoyé par Brevo */
  status?: number;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
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
      // Tente d'extraire le message lisible de la réponse JSON Brevo
      let humanMessage = `${res.status} ${res.statusText}`;
      try {
        const parsed = JSON.parse(body);
        if (parsed?.message) humanMessage = `${parsed.code ?? res.status} : ${parsed.message}`;
        else if (typeof parsed === "string") humanMessage = parsed;
      } catch {
        if (body) humanMessage = body.slice(0, 250);
      }
      return { ok: false, status: res.status, error: humanMessage };
    }
    return { ok: true };
  } catch (err) {
    console.error("[brevo] exception:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

type SendSmsInput = {
  to: string;
  body: string;
};

export type SendSmsResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  status?: number;
};

export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
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
      let humanMessage = `${res.status} ${res.statusText}`;
      try {
        const parsed = JSON.parse(body);
        if (parsed?.message) humanMessage = `${parsed.code ?? res.status} : ${parsed.message}`;
      } catch {
        if (body) humanMessage = body.slice(0, 250);
      }
      return { ok: false, status: res.status, error: humanMessage };
    }
    return { ok: true };
  } catch (err) {
    console.error("[twilio] exception:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

// =====================================================
// TEMPLATES
// =====================================================

// =====================================================
// EMAIL DESIGN — calqué sur le PDF devis (fond blanc, accent rouge)
// =====================================================
// Conventions :
// - Fond blanc, texte zinc-900 (contraste WCAG AA)
// - Accent rouge Bonafone #ff2d3a (logo, totaux, boutons)
// - Boîtes en zinc-50 + bordure zinc-200 (= identique au PDF)
// - Header : logo gauche + adresse magasin droite, séparé du contenu par
//   une bordure rouge épaisse (signature visuelle du devis)
// - Tables imbriquées pour compat Outlook/Gmail/iOS Mail
// - Police système (Arial fallback)

const COLORS = {
  page: "#f4f4f5", // zinc-100 — fond de la page mail (autour de la carte)
  surface: "#ffffff", // blanc — la "carte" email
  surface2: "#fafafa", // zinc-50 — boîtes d'info, lignes de table alt.
  border: "#e4e4e7", // zinc-200 — bordures fines
  borderStrong: "#d4d4d8", // zinc-300 — séparateurs de tableau
  primary: "#ff2d3a", // rouge Bonafone
  primaryDark: "#c4111e",
  primarySoft: "#fef2f2", // red-50 — fond doux pour la ligne TOTAL TTC
  foreground: "#18181b", // zinc-900 — texte principal
  muted: "#52525b", // zinc-600 — texte secondaire
  subtle: "#71717a", // zinc-500 — labels uppercase, footer
  faint: "#a1a1aa", // zinc-400 — copyright
  success: "#15803d", // green-700
  successBg: "#f0fdf4", // green-50
  successBorder: "#bbf7d0", // green-200
  warning: "#b45309", // amber-700
  warningBg: "#fffbeb", // amber-50
  warningBorder: "#fde68a", // amber-200
};

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO_STACK = "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace";

/** Bouton CTA principal — fond rouge Bonafone */
function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${COLORS.primary};color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;font-family:${FONT_STACK};line-height:1">${escapeHtml(label)}</a>`;
}

/** Référence dossier — mono rouge sur fond rouge très clair (style "tag PDF") */
function ref(number: string): string {
  return `<span style="display:inline-block;background:${COLORS.primarySoft};color:${COLORS.primary};font-family:${MONO_STACK};font-size:13px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:0.5px">${escapeHtml(number)}</span>`;
}

/** Encart d'info — couleur selon variant (neutre/success/warning) */
function infoBox(content: string, variant: "neutral" | "success" | "warning" = "neutral"): string {
  const v = {
    neutral: { bg: COLORS.surface2, border: COLORS.border },
    success: { bg: COLORS.successBg, border: COLORS.successBorder },
    warning: { bg: COLORS.warningBg, border: COLORS.warningBorder },
  }[variant];
  return `<div style="background:${v.bg};border:1px solid ${v.border};border-radius:8px;padding:16px 18px;margin:16px 0">${content}</div>`;
}

/** Petit titre de section uppercase letter-spaced — identique au PDF */
function sectionTitle(text: string): string {
  return `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${COLORS.subtle};margin:22px 0 8px 0;font-family:${FONT_STACK}">${escapeHtml(text)}</div>`;
}

/**
 * Header type "facture" : logo gauche + coordonnées magasin droite.
 * Reprend la signature visuelle du PDF devis (bordure rouge épaisse en bas).
 */
function letterheadBlock(): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <!-- Logo + nom + tagline -->
        <td style="vertical-align:middle">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:middle">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="44" height="44" style="background:${COLORS.primary};border-radius:10px">
                  <tr>
                    <td align="center" valign="middle" height="44" style="height:44px;font-family:'Arial Black',Arial,sans-serif;color:#ffffff;font-size:28px;font-weight:900;line-height:44px">b</td>
                  </tr>
                </table>
              </td>
              <td style="padding-left:14px;vertical-align:middle">
                <div style="font-size:22px;font-weight:900;color:${COLORS.primary};letter-spacing:-0.5px;line-height:1;font-family:${FONT_STACK}">BONAFONE</div>
                <div style="font-size:9px;color:${COLORS.subtle};letter-spacing:2px;text-transform:uppercase;margin-top:5px;font-family:${FONT_STACK};font-weight:600">${escapeHtml(STORE.tagline)}</div>
              </td>
            </tr>
          </table>
        </td>
        <!-- Coordonnées magasin (cachées sur très petits écrans) -->
        <td align="right" style="vertical-align:middle;font-size:11px;color:${COLORS.muted};line-height:1.55;font-family:${FONT_STACK}" class="store-info">
          <div>${escapeHtml(STORE.address)}</div>
          <div>Tél : ${escapeHtml(STORE.phone)}</div>
          <div>Email : ${escapeHtml(STORE.email)}</div>
        </td>
      </tr>
    </table>`;
}

/** Footer minimaliste — copyright + URL */
function footerBlock(): string {
  const year = new Date().getFullYear();
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="font-size:11px;color:${COLORS.subtle};line-height:1.7;font-family:${FONT_STACK};text-align:center">
          <div style="color:${COLORS.foreground};font-weight:700;font-size:12px;margin-bottom:6px">${escapeHtml(STORE.name)}</div>
          <div>${escapeHtml(STORE.address)}</div>
          <div style="margin-top:2px">
            <a href="tel:${STORE.phone.replace(/\s/g, "")}" style="color:${COLORS.muted};text-decoration:none">${escapeHtml(STORE.phone)}</a>
            <span style="color:${COLORS.faint};margin:0 6px">·</span>
            <a href="mailto:${STORE.email}" style="color:${COLORS.muted};text-decoration:none">${escapeHtml(STORE.email)}</a>
          </div>
          <div style="margin-top:2px">${escapeHtml(STORE.hours)}</div>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid ${COLORS.border};color:${COLORS.faint};font-size:10px">
            © ${year} ${escapeHtml(STORE.name)} · <a href="${baseUrl()}" style="color:${COLORS.faint};text-decoration:underline">bonafone.com</a>
          </div>
        </td>
      </tr>
    </table>`;
}

function emailLayout(content: string, opts?: { preheader?: string }): string {
  // Le preheader = texte de prévisualisation affiché par les clients mail
  // avant le contenu réel. Caché visuellement mais lu par les screen-readers.
  const preheader = opts?.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(opts.preheader)}</div>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(STORE.name)}</title>
  <style>
    /* Force light mode même si le client a l'apparence sombre activée. */
    :root { color-scheme: light; supported-color-schemes: light; }
    @media (max-width: 480px) {
      .store-info { display: none !important; }
      .email-card { border-radius: 0 !important; }
      .pad-x { padding-left: 22px !important; padding-right: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};color:${COLORS.foreground};font-family:${FONT_STACK};-webkit-text-size-adjust:100%">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${COLORS.page}">
    <tr>
      <td align="center" style="padding:32px 12px">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" class="email-card" style="max-width:640px;width:100%;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
          <!-- HEADER (letterhead façon facture) -->
          <tr>
            <td class="pad-x" style="padding:28px 36px 22px 36px;border-bottom:2px solid ${COLORS.primary};background:${COLORS.surface}">
              ${letterheadBlock()}
            </td>
          </tr>
          <!-- CONTENT -->
          <tr>
            <td class="pad-x" style="padding:32px 36px;font-size:15px;line-height:1.65;color:${COLORS.foreground};font-family:${FONT_STACK};background:${COLORS.surface}">
              ${content}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td class="pad-x" style="padding:22px 36px 28px 36px;background:${COLORS.surface2};border-top:1px solid ${COLORS.border}">
              ${footerBlock()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function tplDevisReceived(opts: {
  customerName: string;
  number: string;
  device: string;
  issueType: string;
}) {
  const subject = `Votre demande de devis ${opts.number}`;
  const trackUrl = `${baseUrl()}/reparations/suivi?ref=${opts.number}`;
  const firstName = opts.customerName.split(" ")[0] || opts.customerName;
  const html = emailLayout(
    `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:${COLORS.foreground};letter-spacing:-0.3px">Demande de devis reçue</h1>
    <p style="margin:0 0 20px 0;color:${COLORS.muted};font-size:14px">Bonjour ${escapeHtml(firstName)}, nous traitons votre demande.</p>

    <p style="margin:0 0 8px 0">Nous avons bien reçu votre demande de devis pour&nbsp;:</p>
    ${infoBox(`
      <div style="font-size:13px;color:${COLORS.muted};margin-bottom:4px">Appareil</div>
      <div style="font-size:16px;font-weight:700;color:${COLORS.foreground};margin-bottom:10px">${escapeHtml(opts.device)}</div>
      <div style="font-size:13px;color:${COLORS.muted};margin-bottom:4px">Type d'intervention</div>
      <div style="font-size:14px;color:${COLORS.foreground}">${escapeHtml(opts.issueType)}</div>
    `)}

    ${sectionTitle("Numéro de dossier")}
    <div style="margin:0 0 16px 0">${ref(opts.number)}</div>

    <p style="margin:20px 0">Notre équipe revient vers vous sous <strong>24 h ouvrées</strong> avec une proposition détaillée et un devis chiffré.</p>

    <div style="margin:28px 0 8px 0">${btn(trackUrl, "Suivre mon dossier")}</div>
  `,
    { preheader: `Devis ${opts.number} — ${opts.device}` },
  );
  return { subject, html };
}

export function tplRepairQuote(opts: {
  customerName: string;
  number: string;
  device: string;
  issueType: string;
  totalTtc: number;
  parts: { name: string; costTtc: number }[];
  message?: string;
}) {
  // Décomposition TVA belge (21%) — cohérent avec lib/utils#priceBreakdown.
  const VAT = 0.21;
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
  const breakdown = (ttc: number) => {
    const ht = Math.round((ttc / (1 + VAT)) * 100) / 100;
    return { ht, vat: Math.round((ttc - ht) * 100) / 100, ttc };
  };
  const totals = breakdown(opts.totalTtc);

  // Main d'œuvre = total - sum(pièces). Si positif, on l'ajoute en ligne.
  // Mimétisme du PDF (devis-print/page.tsx).
  const partsTotalTtc = opts.parts.reduce((s, p) => s + p.costTtc, 0);
  const laborTtc = Math.max(0, opts.totalTtc - partsTotalTtc);

  const subject = `Devis ${opts.number} — ${fmt(opts.totalTtc)} TTC`;
  const trackUrl = `${baseUrl()}/reparations/suivi?ref=${opts.number}`;
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Lignes du tableau (pièces + main d'œuvre éventuelle).
  const rowsHtml = (() => {
    const partRows = opts.parts.length
      ? opts.parts
          .map((p) => {
            const b = breakdown(p.costTtc);
            return `<tr>
              <td style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:14px;color:${COLORS.foreground};font-family:${FONT_STACK}">${escapeHtml(p.name)}</td>
              <td align="right" style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.muted};font-family:${MONO_STACK}">${fmt(b.ht)}</td>
              <td align="right" style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:14px;color:${COLORS.foreground};font-family:${MONO_STACK};font-weight:600">${fmt(b.ttc)}</td>
            </tr>`;
          })
          .join("")
      : `<tr>
          <td style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:14px;color:${COLORS.foreground};font-family:${FONT_STACK}">Pièces (à définir)</td>
          <td align="right" style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.faint};font-family:${MONO_STACK}">—</td>
          <td align="right" style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.faint};font-family:${MONO_STACK}">—</td>
        </tr>`;

    const laborRow =
      laborTtc > 0
        ? (() => {
            const b = breakdown(laborTtc);
            return `<tr>
              <td style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:14px;color:${COLORS.foreground};font-family:${FONT_STACK}">
                <div style="font-weight:500">Main d'œuvre</div>
                <div style="font-size:11px;color:${COLORS.subtle};margin-top:2px">Démontage, réparation, tests, remontage</div>
              </td>
              <td align="right" style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.muted};font-family:${MONO_STACK}">${fmt(b.ht)}</td>
              <td align="right" style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:14px;color:${COLORS.foreground};font-family:${MONO_STACK};font-weight:600">${fmt(b.ttc)}</td>
            </tr>`;
          })()
        : "";

    return partRows + laborRow;
  })();

  const html = emailLayout(
    `
    <!-- Titre DEVIS + référence + date (mimique PDF) -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0">
      <tr>
        <td style="vertical-align:bottom">
          <h1 style="font-size:30px;font-weight:800;margin:0;color:${COLORS.foreground};letter-spacing:-0.5px;line-height:1">DEVIS</h1>
        </td>
        <td align="right" style="vertical-align:bottom;font-family:${FONT_STACK}">
          <div style="font-size:18px;font-weight:700;color:${COLORS.primary};font-family:${MONO_STACK};line-height:1.1">${escapeHtml(opts.number)}</div>
          <div style="font-size:11px;color:${COLORS.subtle};margin-top:4px">Édité le ${escapeHtml(today)}</div>
        </td>
      </tr>
    </table>

    <!-- Client + Appareil (2 colonnes comme le PDF) -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px 0">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:12px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${COLORS.subtle};margin-bottom:6px;font-family:${FONT_STACK}">Client</div>
          <div style="font-size:14px;font-weight:600;color:${COLORS.foreground};font-family:${FONT_STACK}">${escapeHtml(opts.customerName)}</div>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:12px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${COLORS.subtle};margin-bottom:6px;font-family:${FONT_STACK}">Appareil</div>
          <div style="font-size:14px;font-weight:600;color:${COLORS.foreground};font-family:${FONT_STACK}">${escapeHtml(opts.device)}</div>
          <div style="font-size:12px;color:${COLORS.muted};margin-top:2px;font-family:${FONT_STACK}">${escapeHtml(opts.issueType)}</div>
        </td>
      </tr>
    </table>

    <!-- Tableau pièces + main d'œuvre, colonnes HT/TTC -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin:0 0 4px 0;font-family:${FONT_STACK}">
      <thead>
        <tr>
          <th align="left" style="padding:10px 8px;border-bottom:2px solid ${COLORS.borderStrong};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${COLORS.subtle}">Désignation</th>
          <th align="right" style="padding:10px 8px;border-bottom:2px solid ${COLORS.borderStrong};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${COLORS.subtle};width:90px">HT</th>
          <th align="right" style="padding:10px 8px;border-bottom:2px solid ${COLORS.borderStrong};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${COLORS.subtle};width:100px">TTC</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding:10px 8px;border-top:2px solid ${COLORS.borderStrong};font-size:13px;font-weight:600;color:${COLORS.foreground}">Sous-total HT</td>
          <td colspan="2" align="right" style="padding:10px 8px;border-top:2px solid ${COLORS.borderStrong};font-size:14px;font-weight:600;color:${COLORS.foreground};font-family:${MONO_STACK}">${fmt(totals.ht)}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;font-size:12px;color:${COLORS.muted}">TVA 21 %</td>
          <td colspan="2" align="right" style="padding:6px 8px;font-size:13px;color:${COLORS.muted};font-family:${MONO_STACK}">${fmt(totals.vat)}</td>
        </tr>
        <tr>
          <td style="padding:14px 8px;border-top:2px solid ${COLORS.borderStrong};font-size:16px;font-weight:800;color:${COLORS.foreground}">TOTAL TTC</td>
          <td colspan="2" align="right" style="padding:14px 8px;border-top:2px solid ${COLORS.borderStrong};font-size:24px;font-weight:900;color:${COLORS.primary};font-family:${MONO_STACK};letter-spacing:-0.5px">${fmt(totals.ttc)}</td>
        </tr>
      </tfoot>
    </table>

    ${
      opts.message
        ? `
      ${sectionTitle("Message du technicien")}
      ${infoBox(`<div style="white-space:pre-line;color:${COLORS.foreground};font-size:14px;line-height:1.6">${escapeHtml(opts.message)}</div>`)}
    `
        : ""
    }

    <!-- Conditions (mimique PDF) -->
    ${infoBox(`
      <div style="font-size:12px;font-weight:700;color:${COLORS.foreground};margin-bottom:8px">Conditions</div>
      <ul style="margin:0;padding-left:18px;font-size:12px;color:${COLORS.muted};line-height:1.7">
        <li>Devis valable 30 jours à compter de la date d'édition.</li>
        <li>Garantie 6 mois sur les pièces et la main d'œuvre.</li>
        <li>Aucun frais si l'appareil est jugé irréparable après diagnostic.</li>
        <li>L'acceptation de ce devis vaut autorisation d'effectuer la réparation.</li>
      </ul>
    `)}

    <!-- CTA -->
    <p style="margin:24px 0 8px 0;color:${COLORS.foreground}">Pour <strong>valider</strong> ce devis, répondez à cet email ou rendez-vous sur le suivi de votre dossier :</p>
    <div style="margin:18px 0 4px 0">${btn(trackUrl, "Valider mon devis")}</div>
  `,
    { preheader: `Devis ${opts.number} : ${fmt(opts.totalTtc)} TTC pour ${opts.device}` },
  );
  return { subject, html };
}

export function tplOrderConfirmation(opts: {
  customerName?: string;
  number: string;
  total: string;
}) {
  const subject = `Confirmation de commande ${opts.number}`;
  const ordersUrl = `${baseUrl()}/compte/commandes`;
  const firstName = opts.customerName?.split(" ")[0] ?? "";
  const html = emailLayout(
    `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:${COLORS.foreground};letter-spacing:-0.3px">Commande confirmée</h1>
    <p style="margin:0 0 20px 0;color:${COLORS.muted};font-size:14px">${firstName ? `Bonjour ${escapeHtml(firstName)}, ` : ""}merci pour votre confiance !</p>

    ${infoBox(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="vertical-align:top">
            <div style="font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px">N° de commande</div>
            ${ref(opts.number)}
          </td>
          <td align="right" style="vertical-align:top">
            <div style="font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px">Montant</div>
            <div style="font-size:18px;font-weight:800;color:${COLORS.primary};font-family:${MONO_STACK}">${escapeHtml(opts.total)}</div>
          </td>
        </tr>
      </table>
    `, "success")}

    <p style="margin:20px 0">Nous préparons votre colis. Vous recevrez un email dès qu'il sera expédié, avec votre numéro de suivi.</p>

    <div style="margin:28px 0 8px 0">${btn(ordersUrl, "Voir mes commandes")}</div>
  `,
    { preheader: `Commande ${opts.number} — ${opts.total}` },
  );
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
  const firstName = opts.customerName.split(" ")[0] || opts.customerName;
  // PRET_RECUPERATION et TERMINE = bonne nouvelle → variant success
  const variant: "neutral" | "success" =
    opts.status === "PRET_RECUPERATION" || opts.status === "TERMINE" || opts.status === "RESTITUE"
      ? "success"
      : "neutral";
  const html = emailLayout(
    `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:${COLORS.foreground};letter-spacing:-0.3px">Mise à jour de votre réparation</h1>
    <p style="margin:0 0 20px 0;color:${COLORS.muted};font-size:14px">Bonjour ${escapeHtml(firstName)}, votre dossier ${ref(opts.number)} évolue.</p>

    ${infoBox(`
      <div style="font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:8px">Nouveau statut</div>
      <div style="font-size:20px;font-weight:800;color:${variant === "success" ? COLORS.success : COLORS.foreground};letter-spacing:-0.3px">${escapeHtml(label)}</div>
      ${opts.comment ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid ${COLORS.border};color:${COLORS.muted};font-size:14px;line-height:1.6;white-space:pre-line">${escapeHtml(opts.comment)}</div>` : ""}
    `, variant)}

    <div style="margin:28px 0 8px 0">${btn(trackUrl, "Suivre mon dossier")}</div>
  `,
    { preheader: `${opts.number} : ${label}` },
  );
  const sms = `${STORE.name} — ${opts.number} : ${label}${opts.comment ? `. ${opts.comment}` : ""}. Suivi : ${trackUrl}`;
  return { subject, html, sms };
}

export function tplWelcome(opts: { firstName: string }) {
  const subject = `Bienvenue chez ${STORE.name} !`;
  const html = emailLayout(
    `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 8px 0;color:${COLORS.foreground};letter-spacing:-0.3px">Bienvenue, ${escapeHtml(opts.firstName)} 👋</h1>
    <p style="margin:0 0 20px 0;color:${COLORS.muted};font-size:14px">Votre espace client ${escapeHtml(STORE.name)} est prêt.</p>

    <p style="margin:0 0 16px 0">Merci pour votre inscription ! Depuis votre espace client, vous pouvez désormais&nbsp;:</p>

    ${infoBox(`
      <div style="color:${COLORS.foreground};font-size:14px;line-height:1.9">
        <div>→ Suivre l'avancement de vos <strong>réparations</strong></div>
        <div>→ Consulter vos <strong>devis</strong> et les valider</div>
        <div>→ Retrouver l'historique de vos <strong>commandes</strong></div>
        <div>→ Laisser un <strong>avis</strong> après une intervention</div>
      </div>
    `)}

    <div style="margin:28px 0 8px 0">${btn(`${baseUrl()}/compte`, "Accéder à mon espace")}</div>
  `,
    { preheader: `Votre espace client ${STORE.name} est prêt.` },
  );
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
    ? `<p style="margin:0 0 16px 0">Votre dossier de réparation ${ref(opts.repairNumber)} est désormais accessible depuis votre espace.</p>`
    : "";
  const html = emailLayout(
    `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:${COLORS.foreground};letter-spacing:-0.3px">Votre espace client est prêt</h1>
    <p style="margin:0 0 20px 0;color:${COLORS.muted};font-size:14px">Bonjour ${escapeHtml(opts.firstName)}, un compte a été créé pour vous chez ${escapeHtml(STORE.name)}.</p>

    ${repairLine}

    ${sectionTitle("Vos identifiants de connexion")}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin:8px 0 16px 0;background:${COLORS.surface2};border:1px solid ${COLORS.border};border-radius:10px;overflow:hidden;font-family:${FONT_STACK}">
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid ${COLORS.border};font-size:12px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;width:40%">Email</td>
        <td style="padding:14px 16px;border-bottom:1px solid ${COLORS.border};font-family:${MONO_STACK};font-size:14px;font-weight:600;color:${COLORS.foreground}">${escapeHtml(opts.email)}</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:12px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:700">Mot de passe</td>
        <td style="padding:14px 16px;font-family:${MONO_STACK};font-size:16px;font-weight:700;color:${COLORS.primary};letter-spacing:0.5px">${escapeHtml(opts.temporaryPassword)}</td>
      </tr>
    </table>

    <div style="margin:24px 0 8px 0">${btn(`${baseUrl()}/connexion`, "Se connecter")}</div>

    ${infoBox(`<div style="color:${COLORS.foreground};font-size:13px;line-height:1.6"><strong>⚠ Important :</strong> pour votre sécurité, changez ce mot de passe dès votre première connexion depuis <strong>Mon profil</strong>.</div>`, "warning")}
  `,
    { preheader: `Vos identifiants ${STORE.name} sont à l'intérieur.` },
  );
  return { subject, html };
}

/**
 * Envoyé quand l'admin réinitialise le mot de passe d'un client depuis
 * la fiche client (utile si le client a oublié son mdp).
 */
export function tplPasswordReset(opts: {
  firstName: string;
  email: string;
  temporaryPassword: string;
}) {
  const subject = `${STORE.name} — votre nouveau mot de passe`;
  const html = emailLayout(
    `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:${COLORS.foreground};letter-spacing:-0.3px">Mot de passe réinitialisé</h1>
    <p style="margin:0 0 20px 0;color:${COLORS.muted};font-size:14px">Bonjour ${escapeHtml(opts.firstName)}, votre nouveau mot de passe est prêt.</p>

    <p style="margin:0 0 8px 0">Notre équipe a réinitialisé l'accès à votre compte. Voici vos nouveaux identifiants&nbsp;:</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin:16px 0;background:${COLORS.surface2};border:1px solid ${COLORS.border};border-radius:10px;overflow:hidden;font-family:${FONT_STACK}">
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid ${COLORS.border};font-size:12px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;width:40%">Email</td>
        <td style="padding:14px 16px;border-bottom:1px solid ${COLORS.border};font-family:${MONO_STACK};font-size:14px;font-weight:600;color:${COLORS.foreground}">${escapeHtml(opts.email)}</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:12px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:700">Nouveau mot de passe</td>
        <td style="padding:14px 16px;font-family:${MONO_STACK};font-size:16px;font-weight:700;color:${COLORS.primary};letter-spacing:0.5px">${escapeHtml(opts.temporaryPassword)}</td>
      </tr>
    </table>

    <div style="margin:24px 0 8px 0">${btn(`${baseUrl()}/connexion`, "Se connecter")}</div>

    ${infoBox(`<div style="color:${COLORS.foreground};font-size:13px;line-height:1.6"><strong>⚠ Important :</strong> changez ce mot de passe dès votre prochaine connexion depuis <strong>Mon profil</strong>. Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement.</div>`, "warning")}
  `,
    { preheader: `Votre nouveau mot de passe ${STORE.name}.` },
  );
  return { subject, html };
}

export function tplReclamationReceived(opts: { number: string }) {
  const subject = `Votre réclamation ${opts.number} a bien été reçue`;
  const html = emailLayout(
    `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:${COLORS.foreground};letter-spacing:-0.3px">Réclamation enregistrée</h1>
    <p style="margin:0 0 20px 0;color:${COLORS.muted};font-size:14px">Bonjour, votre demande nous est bien parvenue.</p>

    ${infoBox(`
      <div style="font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px">Référence dossier</div>
      ${ref(opts.number)}
    `)}

    <p style="margin:20px 0">Nous avons bien reçu votre réclamation. Notre équipe l'examine et reviendra vers vous dans les plus brefs délais.</p>
    <p style="margin:0;color:${COLORS.muted};font-size:13px">Vous pouvez répondre à cet email à tout moment pour ajouter des informations à votre dossier.</p>
  `,
    { preheader: `Réclamation ${opts.number} prise en compte.` },
  );
  return { subject, html };
}

export function tplContactReply(opts: {
  customerName: string;
  subject: string;
  message: string;
}) {
  const subject = `Re: ${opts.subject}`;
  const firstName = opts.customerName.split(" ")[0] || opts.customerName;
  const html = emailLayout(
    `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:${COLORS.foreground};letter-spacing:-0.3px">Notre réponse à votre message</h1>
    <p style="margin:0 0 20px 0;color:${COLORS.muted};font-size:14px">Bonjour ${escapeHtml(firstName)}, merci d'avoir pris contact avec nous.</p>

    ${sectionTitle("Concernant votre demande")}
    <p style="margin:0 0 16px 0;color:${COLORS.foreground};font-size:14px;font-weight:600">${escapeHtml(opts.subject)}</p>

    ${infoBox(`<div style="white-space:pre-line;color:${COLORS.foreground};font-size:14px;line-height:1.7">${escapeHtml(opts.message)}</div>`)}

    <p style="margin:20px 0 0 0;color:${COLORS.muted};font-size:13px">Pour toute précision complémentaire, n'hésitez pas à répondre directement à cet email.</p>
  `,
    { preheader: `Notre réponse à : ${opts.subject}` },
  );
  return { subject, html };
}

export function tplReclamationReply(opts: {
  number: string;
  message: string;
}) {
  const subject = `Réponse à votre réclamation ${opts.number}`;
  // Le message admin est inséré tel quel (whitespace préservé via white-space:pre-line)
  const html = emailLayout(
    `
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:${COLORS.foreground};letter-spacing:-0.3px">Réponse à votre réclamation</h1>
    <p style="margin:0 0 20px 0;color:${COLORS.muted};font-size:14px">Bonjour, notre équipe a traité votre demande.</p>

    ${infoBox(`
      <div style="font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px">Référence dossier</div>
      ${ref(opts.number)}
    `)}

    ${sectionTitle("Notre réponse")}
    ${infoBox(`<div style="white-space:pre-line;color:${COLORS.foreground};font-size:14px;line-height:1.7">${escapeHtml(opts.message)}</div>`)}

    <p style="margin:20px 0 0 0;color:${COLORS.muted};font-size:13px">Pour toute précision complémentaire, n'hésitez pas à répondre directement à cet email.</p>
  `,
    { preheader: `Réponse à votre réclamation ${opts.number}.` },
  );
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
