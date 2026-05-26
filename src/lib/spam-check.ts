import "server-only";

// =====================================================
// ANTI-SPAM — heuristiques cumulees pour les formulaires publics
// =====================================================
// Strategie defense in depth :
//   1. Honeypot field — input cache, rempli par bots seulement
//   2. Time check — formulaire soumis trop vite = bot
//   3. Patterns metier : numero US 10 chiffres sans prefixe, nom
//      CamelCase aleatoire, email avec dot-trick Gmail, etc.
// Aucun de ces checks ne necessite captcha ni service externe.

export type SpamCheckInput = {
  /** Nom complet ou prenom — optionnel */
  name?: string;
  /** Email — optionnel */
  email?: string;
  /** Telephone — optionnel */
  phone?: string;
  /** Valeur du champ honeypot cache (doit etre vide) */
  honeypot?: string;
  /** Timestamp (ms) du moment du rendu cote serveur, en hidden field */
  formRenderedAt?: string;
};

export type SpamCheckResult =
  | { spam: false }
  | { spam: true; reason: string };

// Un humain met au moins ~3s a remplir un formulaire texte.
// En dessous : tres probablement un bot qui auto-fill et submit.
const MIN_FILL_TIME_MS = 3000;
// Au dela d'1h, on assume que le form a ete laisse ouvert un long moment
// (pause, autre onglet) — on ne reject pas mais on n'utilise plus le delta.
const MAX_FILL_TIME_MS = 60 * 60 * 1000;

export function checkSpam(input: SpamCheckInput): SpamCheckResult {
  // 1. Honeypot : champ "website" cache. Si rempli, c'est un bot
  // (les bots remplissent aveuglement tous les champs).
  if (input.honeypot && input.honeypot.trim() !== "") {
    return { spam: true, reason: "honeypot-filled" };
  }

  // 2. Time check : timestamp serveur en hidden. Si l'ecart est < 3s,
  // c'est trop rapide pour un humain. Si negatif, timestamp force.
  if (input.formRenderedAt) {
    const renderedAt = parseInt(input.formRenderedAt, 10);
    if (!isNaN(renderedAt) && renderedAt > 0) {
      const elapsed = Date.now() - renderedAt;
      if (elapsed < 0) {
        return { spam: true, reason: "future-timestamp" };
      }
      if (elapsed < MIN_FILL_TIME_MS && elapsed < MAX_FILL_TIME_MS) {
        return { spam: true, reason: `too-fast-${elapsed}ms` };
      }
    }
  }

  // 3. Telephone : reject le format US 10 chiffres sans prefixe pays.
  // Les vrais clients belges/français commencent par + ou 0.
  if (input.phone) {
    const trimmed = input.phone.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 6) {
      return { spam: true, reason: "phone-too-short" };
    }
    const startsWithPlus = trimmed.startsWith("+");
    const startsWithZero = digits.startsWith("0");
    // Format US (10 chiffres exactement, pas de + ni de 0 initial)
    if (digits.length === 10 && !startsWithPlus && !startsWithZero) {
      return { spam: true, reason: "us-phone-format" };
    }
  }

  // 4. Nom : reject si CamelCase aleatoire long sans espace.
  // Pattern observe sur les spams : "zdtHTweVwDmHOlQTFa", "cZUQeOtSscLDkwCDE".
  if (input.name) {
    const name = input.name.trim();
    if (
      !name.includes(" ") &&
      name.length >= 14 &&
      /[A-Z][a-z]+[A-Z][a-z]+[A-Z]/.test(name)
    ) {
      return { spam: true, reason: "random-camelcase-name" };
    }
    // Cluster de consonnes consecutives (>= 5) = nom non-naturel
    if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(name)) {
      return { spam: true, reason: "consonant-cluster-name" };
    }
  }

  // 5. Email : dot-trick Gmail (>= 4 dots dans local part = trick gmail
  // utilise par les fermes a spam pour creer N "comptes" avec 1 seul email).
  if (input.email) {
    const [local, domain] = input.email.toLowerCase().split("@");
    if (local && domain === "gmail.com") {
      const dotCount = (local.match(/\./g) ?? []).length;
      if (dotCount >= 4) {
        return { spam: true, reason: "gmail-dot-trick" };
      }
    }
  }

  return { spam: false };
}

// =====================================================
// Helpers pour les formulaires (cote client)
// =====================================================

/**
 * CSS pour un champ honeypot invisible aux humains mais rempli par bots.
 * Utiliser comme : <input className={HONEYPOT_CLASS} ... />
 */
export const HONEYPOT_CLASS =
  "absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0 pointer-events-none";
