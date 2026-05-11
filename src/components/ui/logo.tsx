import { cn } from "@/lib/utils";

// =====================================================
// LOGO BONAFONE
// =====================================================
// Image officielle : public/bonafone-logo.png (b stylisé + ondes signal +
// wordmark "BONAFONE" + tagline "L'EXPERT EN RÉPARATION").
//
// LogoFull = image complète (icône + wordmark + tagline)
// LogoMark = SVG fallback icône-seule, conservé pour les endroits compacts
//            (favicon, notification bell, sidebar admin) où on n'a pas la
//            place pour le wordmark.

/**
 * Icône seule — SVG "b" rouge + ondes signal.
 * Conservée pour les zones compactes (favicon, sidebar admin).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      aria-hidden="true"
    >
      {/* Carré arrondi rouge */}
      <rect x="2" y="22" width="60" height="60" rx="14" fill="currentColor" />

      {/* Lettre "b" en blanc */}
      <text
        x="32"
        y="68"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="50"
        fontWeight="900"
        fill="#ffffff"
        textAnchor="middle"
      >
        b
      </text>

      {/* Ondes signal — 2 arcs concentriques en haut à droite */}
      <path
        d="M66 18 Q82 18 92 28 Q102 38 102 54"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M66 32 Q76 32 82 38 Q88 44 88 54"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Logo complet officiel — image PNG hostée dans public/.
 * Inclut l'icône, le wordmark "BONAFONE" et la tagline "L'EXPERT EN
 * RÉPARATION" en un seul élément graphique. Utilisé dans le header public,
 * les emails, et les documents imprimés (devis PDF, tickets).
 */
export function LogoFull({
  className,
}: {
  className?: string;
  /** Conservé pour compat — la tagline est désormais intégrée à l'image. */
  showTagline?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/bonafone-logo.png"
      alt="Bonafone — L'expert en réparation"
      className={cn("h-12 w-auto", className)}
    />
  );
}
