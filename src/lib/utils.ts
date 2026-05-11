import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | string, currency = "EUR") {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(num);
}

// =====================================================
// TVA — Belgique (taux standard 21%)
// =====================================================
// Convention Bonafone : les prix stockés en DB (Repair.estimatedCost,
// Repair.finalCost, RepairPart.cost, Product.price) sont en TTC (ce que
// le client paie au final). Le HT et la TVA sont calculés à l'affichage
// pour les devis et factures (mentions légales obligatoires en Belgique).
export const VAT_RATE = 0.21;

/**
 * Décompose un montant TTC en {ht, vat, ttc}.
 * Le HT est arrondi à 2 décimales pour cohérence d'affichage,
 * la TVA est recalculée comme TTC - HT pour éviter les écarts d'arrondi.
 */
export function priceBreakdown(ttc: number): {
  ht: number;
  vat: number;
  ttc: number;
} {
  if (!Number.isFinite(ttc) || ttc <= 0) {
    return { ht: 0, vat: 0, ttc: 0 };
  }
  const htRaw = ttc / (1 + VAT_RATE);
  const ht = Math.round(htRaw * 100) / 100;
  const vat = Math.round((ttc - ht) * 100) / 100;
  return { ht, vat, ttc };
}

/**
 * Format compact "HT 21,00 € · TTC 25,41 €" pour affichage dans listings.
 */
export function formatPriceHtTtc(ttc: number): string {
  const { ht } = priceBreakdown(ttc);
  return `HT ${formatPrice(ht)} · TTC ${formatPrice(ttc)}`;
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export const STORE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? "Bonafone",
  tagline: process.env.NEXT_PUBLIC_STORE_TAGLINE ?? "L'expert en réparation",
  phone: process.env.NEXT_PUBLIC_STORE_PHONE ?? "+32 2 347 36 62",
  email: process.env.NEXT_PUBLIC_STORE_EMAIL ?? "info@bonafone.com",
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS ?? "Chaussée d'Alsemberg 742, 1180 Uccle, Belgique",
  hours: process.env.NEXT_PUBLIC_STORE_HOURS ?? "Lun-Sam 10h-18h30",
  whatsapp: process.env.NEXT_PUBLIC_STORE_WHATSAPP ?? "+32477000000",
  gmaps: process.env.NEXT_PUBLIC_STORE_GMAPS ?? "https://maps.google.com/?q=Chauss%C3%A9e+d'Alsemberg+742+1180+Uccle",
};
