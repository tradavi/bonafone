"use client";

import { usePathname } from "next/navigation";

/**
 * Wrapper client : masque ses enfants quand on est sur la home (`/`).
 * Utilisé pour la TopBar et la NavLinks afin que la page d'accueil
 * (axée sur le service de réparation) reste épurée et sans navigation
 * boutique.
 */
export function HideOnHome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}
