import { prisma } from "./prisma";
import { STORE } from "./utils";
import { encryptSecret, decryptSecret } from "./encryption";

export type StoreInfo = {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  whatsapp: string;
  gmaps: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
  twitter: string;
};

export type StoreApiKeys = {
  stripeSecretKey: string;
  stripePublicKey: string;
  stripeWebhookSecret: string;
  brevoApiKey: string;
  brevoFromEmail: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
  googleMapsApiKey: string;
  googleClientId: string;
  googleClientSecret: string;
  facebookClientId: string;
  facebookClientSecret: string;
};

const SINGLETON_ID = "singleton";

const PUBLIC_FIELDS = [
  "name",
  "tagline",
  "phone",
  "email",
  "address",
  "hours",
  "whatsapp",
  "gmaps",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "linkedin",
  "twitter",
] as const;

const API_FIELDS = [
  "stripeSecretKey",
  "stripePublicKey",
  "stripeWebhookSecret",
  "brevoApiKey",
  "brevoFromEmail",
  "twilioAccountSid",
  "twilioAuthToken",
  "twilioFromNumber",
  "googleMapsApiKey",
  "googleClientId",
  "googleClientSecret",
  "facebookClientId",
  "facebookClientSecret",
] as const;

const ALL_FIELDS = [...PUBLIC_FIELDS, ...API_FIELDS] as const;

type RawRow = Partial<Record<(typeof ALL_FIELDS)[number], string | null>>;

async function loadRow(): Promise<RawRow | null> {
  try {
    const cols = ALL_FIELDS.map((f) => `"${f}"`).join(", ");
    // Postgres : placeholders $1, $2... (pas ? comme SQLite/MySQL)
    const rows = await prisma.$queryRawUnsafe<RawRow[]>(
      `SELECT ${cols} FROM "StoreSettings" WHERE "id" = $1 LIMIT 1`,
      SINGLETON_ID,
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getStoreSettings(): Promise<StoreInfo> {
  const row = await loadRow();
  return {
    name: row?.name || STORE.name,
    tagline: row?.tagline || STORE.tagline,
    phone: row?.phone || STORE.phone,
    email: row?.email || STORE.email,
    address: row?.address || STORE.address,
    hours: row?.hours || STORE.hours,
    whatsapp: row?.whatsapp || STORE.whatsapp,
    gmaps: row?.gmaps || STORE.gmaps,
    facebook: row?.facebook || "",
    instagram: row?.instagram || "",
    youtube: row?.youtube || "",
    tiktok: row?.tiktok || "",
    linkedin: row?.linkedin || "",
    twitter: row?.twitter || "",
  };
}

/**
 * Renvoie les clés API stockées en DB en priorité (déchiffrées), sinon les
 * variables d'env. Lecture exclusivement côté serveur.
 */
export async function getStoreApiKeys(): Promise<StoreApiKeys> {
  const row = await loadRow();
  const dec = (v: string | null | undefined) => (v ? decryptSecret(v) : "");
  return {
    stripeSecretKey:
      dec(row?.stripeSecretKey) || process.env.STRIPE_SECRET_KEY || "",
    stripePublicKey:
      dec(row?.stripePublicKey) || process.env.STRIPE_PUBLIC_KEY || "",
    stripeWebhookSecret:
      dec(row?.stripeWebhookSecret) || process.env.STRIPE_WEBHOOK_SECRET || "",
    brevoApiKey: dec(row?.brevoApiKey) || process.env.BREVO_API_KEY || "",
    brevoFromEmail:
      dec(row?.brevoFromEmail) || process.env.BREVO_FROM_EMAIL || "",
    twilioAccountSid:
      dec(row?.twilioAccountSid) || process.env.TWILIO_ACCOUNT_SID || "",
    twilioAuthToken:
      dec(row?.twilioAuthToken) || process.env.TWILIO_AUTH_TOKEN || "",
    twilioFromNumber:
      dec(row?.twilioFromNumber) || process.env.TWILIO_FROM || "",
    googleMapsApiKey:
      dec(row?.googleMapsApiKey) || process.env.GOOGLE_MAPS_API_KEY || "",
    googleClientId:
      dec(row?.googleClientId) || process.env.AUTH_GOOGLE_ID || "",
    googleClientSecret:
      dec(row?.googleClientSecret) || process.env.AUTH_GOOGLE_SECRET || "",
    facebookClientId:
      dec(row?.facebookClientId) || process.env.AUTH_FACEBOOK_ID || "",
    facebookClientSecret:
      dec(row?.facebookClientSecret) || process.env.AUTH_FACEBOOK_SECRET || "",
  };
}

/**
 * Indique pour chaque clé API si elle a une valeur enregistrée (DB ou env),
 * sans renvoyer la valeur elle-même — utilisé par l'UI pour masquer les inputs.
 */
export async function getStoreApiKeysStatus(): Promise<
  Record<keyof StoreApiKeys, boolean>
> {
  const keys = await getStoreApiKeys();
  return {
    stripeSecretKey: Boolean(keys.stripeSecretKey),
    stripePublicKey: Boolean(keys.stripePublicKey),
    stripeWebhookSecret: Boolean(keys.stripeWebhookSecret),
    brevoApiKey: Boolean(keys.brevoApiKey),
    brevoFromEmail: Boolean(keys.brevoFromEmail),
    twilioAccountSid: Boolean(keys.twilioAccountSid),
    twilioAuthToken: Boolean(keys.twilioAuthToken),
    twilioFromNumber: Boolean(keys.twilioFromNumber),
    googleMapsApiKey: Boolean(keys.googleMapsApiKey),
    googleClientId: Boolean(keys.googleClientId),
    googleClientSecret: Boolean(keys.googleClientSecret),
    facebookClientId: Boolean(keys.facebookClientId),
    facebookClientSecret: Boolean(keys.facebookClientSecret),
  };
}

/**
 * Upsert partiel : seules les clés présentes dans `data` sont mises à jour.
 * Permet le pattern "input vide = ne rien changer" pour les secrets.
 *
 * Les colonnes API (clés sensibles) sont chiffrées via AES-256-GCM avant
 * stockage si SECRETS_ENCRYPTION_KEY est défini. Sinon stockées en clair
 * (mode dev), avec préfixe `enc:v1:` permettant la migration ultérieure.
 */
export async function upsertStoreSettings(
  data: Partial<Record<(typeof ALL_FIELDS)[number], string | null | undefined>>,
) {
  const keys = Object.keys(data).filter(
    (k): k is (typeof ALL_FIELDS)[number] =>
      (ALL_FIELDS as readonly string[]).includes(k),
  );
  if (keys.length === 0) return;

  const apiFieldSet = new Set<string>(API_FIELDS);

  // Construction dynamique : on récupère d'abord la ligne existante pour
  // l'INSERT, puis on n'écrase que les colonnes fournies via DO UPDATE.
  const insertCols = ["id", ...ALL_FIELDS, "updatedAt"];
  const insertValues = [
    SINGLETON_ID,
    ...ALL_FIELDS.map((f) => {
      const v = data[f];
      if (v === undefined) return null;
      const trimmed = typeof v === "string" ? v.trim() : "";
      if (!trimmed) return null;
      return apiFieldSet.has(f) ? encryptSecret(trimmed) : trimmed;
    }),
    new Date().toISOString(),
  ];
  // Postgres : placeholders $1, $2... (pas ? comme SQLite/MySQL)
  const insertPlaceholders = insertValues.map((_, i) => `$${i + 1}`).join(", ");

  // Pour le DO UPDATE on ne touche qu'aux colonnes effectivement fournies.
  const updateAssignments = [
    ...keys.map((k) => `"${k}" = excluded."${k}"`),
    `"updatedAt" = excluded."updatedAt"`,
  ].join(", ");

  const sql = `
    INSERT INTO "StoreSettings" (${insertCols.map((c) => `"${c}"`).join(", ")})
    VALUES (${insertPlaceholders})
    ON CONFLICT ("id") DO UPDATE SET ${updateAssignments}
  `;

  await prisma.$executeRawUnsafe(sql, ...insertValues);
}
