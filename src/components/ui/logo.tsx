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
 * Logo complet — SVG mark + wordmark texte + tagline.
 * Utilisé partout sur le site (header, footer, etc.) car léger,
 * accessible, et stylable via les variables CSS du thème (dark/light).
 */
export function LogoFull({
  className,
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark className="h-10 w-auto shrink-0" />
      <div className="leading-none">
        <div className="text-2xl font-black tracking-tight text-primary">
          BONAFONE
        </div>
        {showTagline && (
          <div className="text-[9px] uppercase tracking-[0.18em] text-foreground-muted mt-1">
            L&apos;expert en réparation
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Logo image officiel — PNG hostée dans public/bonafone-logo.png.
 * Réservé aux documents officiels (devis PDF, factures, tickets imprimés)
 * et aux emails (via baseUrl()/bonafone-logo.png dans les templates).
 * À ne PAS utiliser dans le UI du site (header/footer) pour préserver
 * le contraste dark/light et la légèreté du DOM.
 */
export function LogoImage({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/bonafone-logo.png"
      alt="Bonafone — L'expert en réparation"
      className={cn("h-14 w-auto", className)}
    />
  );
}
