"use client";

import { usePathname } from "next/navigation";

/**
 * Pages où la navigation boutique (TopBar publique non concernée, NavLinks,
 * search bar, panier, favoris) doit être masquée pour offrir une UX épurée
 * centrée sur la tâche en cours.
 */
const MINIMAL_PATHS = [
  "/", // home (service réparation)
  "/reclamations", // formulaire réclamation
  "/contact", // contact
];
const MINIMAL_PREFIXES = [
  "/reparations/suivi", // suivre ma réparation (et /reparations/suivi?ref=...)
  "/compte", // espace client (dashboard + sous-pages)
  "/admin", // back-office (a sa propre layout, mais le TopBar/Header global wrap aussi)
];

function isMinimalPath(pathname: string): boolean {
  if (MINIMAL_PATHS.includes(pathname)) return true;
  return MINIMAL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

/**
 * Wrapper client : masque ses enfants sur les pages "focalisées" (home,
 * réclamation, contact, suivi réparation, comptes client/admin) afin d'offrir
 * une UX sans distraction. Sur les pages boutique/produit/checkout, les
 * enfants sont rendus normalement.
 */
export function HideOnHome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isMinimalPath(pathname)) return null;
  return <>{children}</>;
}
