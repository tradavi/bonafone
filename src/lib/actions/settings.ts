"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, invalidateAuthCache } from "@/auth";
import { upsertStoreSettings } from "@/lib/store-settings";

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
