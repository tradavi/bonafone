import "server-only";
import crypto from "crypto";

// =====================================================
// TOKENS pour les boutons "Valider / Refuser" du devis email
// =====================================================
// Pas d'auth requise côté client — on ne peut pas demander au client
// de se connecter pour valider/refuser. Donc on signe le repairId avec
// HMAC-SHA256 et AUTH_SECRET. Lien typique :
//   /reparations/devis-reponse?ref=R-2026-0007&t=<signature>
//
// L'attaquant ne peut forger un lien valide sans connaître AUTH_SECRET.
// Le repairId (cuid + numéro de dossier) sert d'identifiant ; on signe
// par numéro (URL plus jolie qu'un cuid) puisque le numéro est unique.

const SECRET = process.env.AUTH_SECRET ?? "fallback-dev-secret-please-set-AUTH_SECRET";

// 16 hex chars = 64 bits d'entropie. Plus court qu'un sha256 complet (64 chars)
// pour des URLs lisibles dans les emails, suffisant contre brute force
// (avec rate limit côté server).
const SIG_LEN = 16;

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, SIG_LEN);
}

/**
 * Signature stable pour un numéro de réparation donné.
 * Pas d'expiration intégrée — le client peut prendre son temps pour
 * répondre. La protection vient du fait que le token est lié au statut
 * actuel : une fois validé/refusé, l'action devient idempotente.
 */
export function generateQuoteToken(repairNumber: string): string {
  return sign(repairNumber);
}

/**
 * Vérifie qu'un token correspond bien au numéro fourni.
 * Comparaison en temps constant pour éviter les attaques par timing.
 */
export function verifyQuoteToken(repairNumber: string, token: string): boolean {
  if (!repairNumber || !token || token.length !== SIG_LEN) return false;
  const expected = sign(repairNumber);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}
