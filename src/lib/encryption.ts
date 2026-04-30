import "server-only";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from "node:crypto";

// =====================================================
// CHIFFREMENT-AT-REST DES SECRETS (clés API stockées en DB)
// =====================================================
// Algorithme : AES-256-GCM (authentifié — détecte les altérations).
// Clé maître : process.env.SECRETS_ENCRYPTION_KEY (32 bytes idéalement, sinon
// dérivée par scrypt). Sans cette variable, on retombe sur du clair (mode dev),
// avec un avertissement remonté à l'UI via isEncryptionConfigured().
//
// Format des valeurs chiffrées en DB : `enc:v1:<base64(iv|tag|ciphertext)>`
// Le préfixe permet la migration douce : les anciennes valeurs en clair sont
// reconnues et renvoyées telles quelles par decryptSecret().

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // standard GCM
const TAG_LENGTH = 16;
const PREFIX = "enc:v1:";
const SCRYPT_SALT = "bonafone-store-settings-v1";

let cachedKey: Buffer | null | undefined;

function getKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = process.env.SECRETS_ENCRYPTION_KEY;
  if (!raw || !raw.trim()) {
    cachedKey = null;
    return null;
  }
  // Hex 64 chars (clé directe 32 bytes)
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    cachedKey = Buffer.from(raw, "hex");
    return cachedKey;
  }
  // Base64 32 bytes
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length === 32) {
      cachedKey = decoded;
      return cachedKey;
    }
  }
  // Sinon dérivation déterministe via scrypt — accepte n'importe quelle phrase
  cachedKey = scryptSync(raw, SCRYPT_SALT, 32);
  return cachedKey;
}

export function isEncryptionConfigured(): boolean {
  return getKey() !== null;
}

export function encryptSecret(plain: string | null | undefined): string | null {
  if (plain == null) return null;
  if (plain === "") return "";
  // Idempotent : si déjà chiffré, on ne re-chiffre pas
  if (plain.startsWith(PREFIX)) return plain;
  const key = getKey();
  if (!key) return plain; // pas de clé → on stocke en clair (mode dev)
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, tag, ct]).toString("base64");
  return PREFIX + blob;
}

export function decryptSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (!value.startsWith(PREFIX)) return value; // legacy plaintext, on retourne tel quel
  const key = getKey();
  if (!key) {
    console.error(
      "[crypto] valeur chiffrée trouvée mais SECRETS_ENCRYPTION_KEY absente — impossible de déchiffrer",
    );
    return "";
  }
  try {
    const blob = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = blob.subarray(0, IV_LENGTH);
    const tag = blob.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ct = blob.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } catch (err) {
    console.error("[crypto] échec du déchiffrement :", err);
    return "";
  }
}
