"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, invalidateAuthCache } from "@/auth";
import { upsertStoreSettings, getStoreApiKeys } from "@/lib/store-settings";
import { sendEmail, sendSms } from "@/lib/notifications";
import { STORE } from "@/lib/utils";

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .refine(
    (v) => !v || /^https?:\/\//i.test(v),
    "L'URL doit commencer par http:// ou https://",
  );

const SettingsSchema = z.object({
  name: z.string().trim().max(100).optional(),
  tagline: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((v) => !v || /\S+@\S+\.\S+/.test(v), "Email invalide"),
  address: z.string().trim().max(300).optional(),
  hours: z.string().trim().max(200).optional(),
  whatsapp: z.string().trim().max(50).optional(),
  gmaps: optionalUrl,
  facebook: optionalUrl,
  instagram: optionalUrl,
  youtube: optionalUrl,
  tiktok: optionalUrl,
  linkedin: optionalUrl,
  twitter: optionalUrl,
  // Clés API — secrets, généralement < 200 chars
  stripeSecretKey: z.string().trim().max(300).optional(),
  stripePublicKey: z.string().trim().max(300).optional(),
  stripeWebhookSecret: z.string().trim().max(300).optional(),
  brevoApiKey: z.string().trim().max(300).optional(),
  brevoFromEmail: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((v) => !v || /\S+@\S+\.\S+/.test(v), "Email expéditeur invalide"),
  twilioAccountSid: z.string().trim().max(100).optional(),
  twilioAuthToken: z.string().trim().max(200).optional(),
  twilioFromNumber: z.string().trim().max(50).optional(),
  googleMapsApiKey: z.string().trim().max(200).optional(),
  googleClientId: z.string().trim().max(300).optional(),
  googleClientSecret: z.string().trim().max(300).optional(),
  facebookClientId: z.string().trim().max(300).optional(),
  facebookClientSecret: z.string().trim().max(300).optional(),
});

// Champs "secrets" pour lesquels une valeur vide signifie "ne pas changer"
// (l'admin ne re-saisit pas la clé à chaque fois). Les champs publics, eux,
// peuvent être effacés intentionnellement.
const SECRET_FIELDS = new Set([
  "stripeSecretKey",
  "stripePublicKey",
  "stripeWebhookSecret",
  "brevoApiKey",
  "twilioAccountSid",
  "twilioAuthToken",
  "googleMapsApiKey",
  "googleClientId",
  "googleClientSecret",
  "facebookClientId",
  "facebookClientSecret",
]);

export async function updateStoreSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Accès non autorisé");
  }

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const parsed = SettingsSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/admin/parametres?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }

  // Filtre : les champs secrets vides ne sont pas envoyés à l'upsert
  const data: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (SECRET_FIELDS.has(k) && (!v || v.trim() === "")) {
      // ne touche pas à la valeur existante
      continue;
    }
    data[k] = v;
  }

  await upsertStoreSettings(data);

  // Invalide le cache OAuth — les nouvelles clés sont prises en compte au
  // prochain auth() (sinon le cache 30s les masquerait jusqu'à expiration).
  invalidateAuthCache();

  revalidatePath("/", "layout");
  revalidatePath("/admin/parametres");

  redirect("/admin/parametres?updated=1");
}

// =====================================================
// TESTS — vérifier que Brevo / Twilio fonctionnent
// =====================================================

/**
 * Envoie un email de test à l'admin connecté.
 * Permet de valider en 1 clic que la clé Brevo + l'email expéditeur sont
 * correctement configurés. Le résultat est passé via les query params.
 */
export async function sendTestEmail(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/connexion");
  }

  // L'admin peut spécifier un destinataire de test, sinon on envoie à son email
  const toRaw = formData.get("testTo");
  const customTo = typeof toRaw === "string" ? toRaw.trim() : "";
  const to = customTo || session.user.email || "";
  if (!to) {
    redirect(
      `/admin/parametres?testEmail=error&msg=${encodeURIComponent("Aucun destinataire — renseignez votre profil")}`,
    );
  }

  const keys = await getStoreApiKeys();
  if (!keys.brevoApiKey || !keys.brevoFromEmail) {
    redirect(
      `/admin/parametres?testEmail=error&msg=${encodeURIComponent(
        "Clé API Brevo ou email expéditeur manquant — enregistrez d'abord ces deux champs.",
      )}`,
    );
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fafafa;border-radius:12px">
      <h1 style="color:#ef4444;margin:0 0 12px">✅ Email de test ${STORE.name}</h1>
      <p>Si tu lis ceci, ta configuration Brevo fonctionne — les emails transactionnels (devis, suivi de réparation, confirmations, mots de passe, etc.) seront bien envoyés à tes clients.</p>
      <hr style="border:0;border-top:1px solid #262626;margin:16px 0">
      <p style="color:#a3a3a3;font-size:13px">
        <strong>Expéditeur configuré :</strong> ${keys.brevoFromEmail}<br>
        <strong>Destinataire :</strong> ${to}<br>
        <strong>Envoyé le :</strong> ${new Date().toLocaleString("fr-BE")}
      </p>
    </div>`;

  const result = await sendEmail({
    to,
    toName: session.user.name ?? "Admin",
    subject: `[Test] ${STORE.name} — config Brevo OK`,
    html,
  });

  if (!result.ok) {
    redirect(
      `/admin/parametres?testEmail=error&msg=${encodeURIComponent(
        "Brevo a refusé la requête — vérifie la clé API et que l'expéditeur est validé dans ton compte Brevo (Senders).",
      )}`,
    );
  }
  if (result.skipped) {
    redirect(
      `/admin/parametres?testEmail=error&msg=${encodeURIComponent(
        "Aucune clé Brevo configurée (mode démo).",
      )}`,
    );
  }

  redirect(`/admin/parametres?testEmail=ok&to=${encodeURIComponent(to)}`);
}

/**
 * Envoie un SMS de test à l'admin connecté (ou un numéro fourni).
 */
export async function sendTestSms(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/connexion");
  }

  const toRaw = formData.get("testTo");
  const to = typeof toRaw === "string" ? toRaw.trim() : "";
  if (!to) {
    redirect(
      `/admin/parametres?testSms=error&msg=${encodeURIComponent(
        "Renseignez un numéro de téléphone de test (format E.164, ex : +32477112233).",
      )}`,
    );
  }

  const keys = await getStoreApiKeys();
  if (!keys.twilioAccountSid || !keys.twilioAuthToken || !keys.twilioFromNumber) {
    redirect(
      `/admin/parametres?testSms=error&msg=${encodeURIComponent(
        "Configuration Twilio incomplète — il faut SID + auth token + numéro expéditeur.",
      )}`,
    );
  }

  const result = await sendSms({
    to,
    body: `[Test ${STORE.name}] Si tu reçois ce SMS, ta config Twilio fonctionne. ${new Date().toLocaleTimeString("fr-BE")}`,
  });

  if (!result.ok) {
    redirect(
      `/admin/parametres?testSms=error&msg=${encodeURIComponent(
        "Twilio a refusé la requête — vérifie les identifiants et le numéro expéditeur.",
      )}`,
    );
  }
  if (result.skipped) {
    redirect(
      `/admin/parametres?testSms=error&msg=${encodeURIComponent("Mode démo — clés Twilio absentes.")}`,
    );
  }

  redirect(`/admin/parametres?testSms=ok&to=${encodeURIComponent(to)}`);
}
