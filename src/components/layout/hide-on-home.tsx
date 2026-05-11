"use client";

import { usePathname } from "next/navigation";

/**
 * 🚧 Mode "réparation seule" — TEMPORAIRE
 * Tant qu'il n'y a pas de catalogue produits actif, on masque tout ce qui
 * relève de l'e-commerce : NavLinks (Smartphones/Tablettes/...), barre de
 * recherche, favoris, panier. Le site se concentre sur le service réparation.
 *
 * 👉 Pour réactiver la boutique : passe `ECOMMERCE_ENABLED` à `true`. Les
 * règles MINIMAL_PATHS/MINIMAL_PREFIXES reprennent alors leur rôle d'origine
 * (cacher la nav uniquement sur les pages focalisées).
 */
const ECOMMERCE_ENABLED = false;

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

export function HideOnHome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Mode "réparation seule" : on masque partout.
  if (!ECOMMERCE_ENABLED) return null;
  if (isMinimalPath(pathname)) return null;
  return <>{children}</>;
}
