"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-5 py-2 bg-[#ff2d3a] text-white rounded-lg font-bold hover:bg-[#c4111e] transition shadow-lg shadow-[#ff2d3a]/30"
    >
      <Printer className="h-4 w-4" />
      Imprimer / Exporter PDF
    </button>
  );
}
