/**
 * Emails synthétiques : générés automatiquement quand un client est créé
 * en back-office sans email réel (réparation walk-in avec téléphone seul).
 *
 * Format : `tel-{digits}@no-email.bonafone.local`
 * Sert d'identifiant unique (contrainte User.email @unique) sans correspondre
 * à une vraie adresse — donc à masquer dans l'UI.
 */

const SYNTHETIC_DOMAIN = "@no-email.bonafone.local";

export function isSyntheticEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.endsWith(SYNTHETIC_DOMAIN));
}

/**
 * Renvoie l'email à afficher dans l'UI (vide si synthétique).
 * Utiliser ce helper partout où on affiche `user.email` côté admin/front.
 */
export function displayEmail(email: string | null | undefined): string {
  if (!email || isSyntheticEmail(email)) return "";
  return email;
}
