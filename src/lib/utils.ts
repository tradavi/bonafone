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
