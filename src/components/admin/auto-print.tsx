"use client";

import { useEffect } from "react";

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

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_16px_var(--primary-glow)]"
    >
      🖨️ Imprimer les 2 tickets
    </button>
  );
}
