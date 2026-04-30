"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/**
 * Déclenche window.print() au montage. Utilisé par la page tickets quand on
 * arrive depuis la création d'un dossier (?print=1).
 */
export function AutoPrint() {
  useEffect(() => {
    // Petit délai pour laisser le DOM se peindre + le SVG du code-barres se rendre.
    const t = setTimeout(() => {
      window.print();
    }, 350);
    return () => clearTimeout(t);
  }, []);
  return null;
}

type PrintMode = "client" | "store" | "all";

function printWithMode(mode: PrintMode) {
  document.body.dataset.printMode = mode;
  // Petit délai pour laisser le navigateur appliquer la classe avant l'impression.
  requestAnimationFrame(() => {
    window.print();
    // Reset après un court délai (le navigateur a fini de générer l'aperçu).
    setTimeout(() => {
      delete document.body.dataset.printMode;
    }, 500);
  });
}

/**
 * 3 boutons d'impression : reçu client uniquement, ticket magasin uniquement,
 * ou les deux. Chaque mode pose `data-print-mode` sur <body> et la CSS
 * @media print masque les tickets non concernés.
 */
export function PrintButtons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => printWithMode("client")}
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-2 border border-border hover:border-primary text-foreground rounded-lg text-sm font-semibold transition"
      >
        <Printer className="h-4 w-4" />
        Reçu client
      </button>
      <button
        type="button"
        onClick={() => printWithMode("store")}
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-2 border border-border hover:border-primary text-foreground rounded-lg text-sm font-semibold transition"
      >
        <Printer className="h-4 w-4" />
        Ticket magasin
      </button>
      <button
        type="button"
        onClick={() => printWithMode("all")}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_16px_var(--primary-glow)]"
      >
        <Printer className="h-4 w-4" />
        Imprimer les 2
      </button>
    </div>
  );
}

/** Compat : ancien nom utilisé ailleurs. */
export function PrintButton() {
  return <PrintButtons />;
}
