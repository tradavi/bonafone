// Données mockées utilisées tant que la DB n'est pas branchée.
// À remplacer par des appels Prisma une fois la base configurée.

export type MockProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: "smartphone" | "tablette" | "accessoire" | "ordinateur";
  condition: "neuf" | "reconditionne" | "occasion";
  grade?: "A" | "B" | "C";
  price: number;
  originalPrice?: number;
  stock: number;
  warrantyMonths: number;
  image: string;
  badge?: "Nouveau" | "Promo" | "Top vente" | "Derniers articles";
};

const ph = (color: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='${color}'/><text x='50%' y='50%' fill='white' font-family='Arial' font-size='28' font-weight='bold' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`,
  )}`;

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "p1",
    slug: "iphone-15-pro-256",
    name: "iPhone 15 Pro 256 Go",
    brand: "Apple",
    category: "smartphone",
    condition: "neuf",
    price: 1229,
    stock: 8,
    warrantyMonths: 24,
    image: ph("#1f2937", "iPhone 15 Pro"),
    badge: "Top vente",
  },
  {
    id: "p2",
    slug: "samsung-galaxy-s24",
    name: "Samsung Galaxy S24 128 Go",
    brand: "Samsung",
    category: "smartphone",
    condition: "neuf",
    price: 899,
    originalPrice: 999,
    stock: 12,
    warrantyMonths: 24,
    image: ph("#0066ff", "Galaxy S24"),
    badge: "Promo",
  },
  {
    id: "p3",
    slug: "ipad-air-m2",
    name: "iPad Air M2 128 Go Wi-Fi",
    brand: "Apple",
    category: "tablette",
    condition: "neuf",
    price: 719,
    stock: 5,
    warrantyMonths: 24,
    image: ph("#374151", "iPad Air M2"),
  },
  {
    id: "p4",
    slug: "iphone-13-occasion-grade-a",
    name: "iPhone 13 128 Go - Reconditionné",
    brand: "Apple",
    category: "smartphone",
    condition: "reconditionne",
    grade: "A",
    price: 449,
    originalPrice: 829,
    stock: 3,
    warrantyMonths: 12,
    image: ph("#7c3aed", "iPhone 13 - A"),
    badge: "Derniers articles",
  },
  {
    id: "p5",
    slug: "airpods-pro-2",
    name: "AirPods Pro 2 (USB-C)",
    brand: "Apple",
    category: "accessoire",
    condition: "neuf",
    price: 279,
    stock: 25,
    warrantyMonths: 24,
    image: ph("#f97316", "AirPods Pro 2"),
  },
  {
    id: "p6",
    slug: "macbook-air-m2-occasion",
    name: "MacBook Air M2 - Occasion",
    brand: "Apple",
    category: "ordinateur",
    condition: "occasion",
    grade: "B",
    price: 899,
    stock: 1,
    warrantyMonths: 6,
    image: ph("#059669", "MacBook Air"),
  },
  {
    id: "p7",
    slug: "samsung-tab-s9",
    name: "Galaxy Tab S9 256 Go",
    brand: "Samsung",
    category: "tablette",
    condition: "neuf",
    price: 949,
    stock: 7,
    warrantyMonths: 24,
    image: ph("#0891b2", "Galaxy Tab S9"),
  },
  {
    id: "p8",
    slug: "chargeur-usb-c-65w",
    name: "Chargeur USB-C 65W",
    brand: "Anker",
    category: "accessoire",
    condition: "neuf",
    price: 39,
    stock: 50,
    warrantyMonths: 24,
    image: ph("#1e40af", "Chargeur 65W"),
    badge: "Nouveau",
  },
];

export const MOCK_BRANDS = [
  "Apple",
  "Samsung",
  "Huawei",
  "Xiaomi",
  "Google",
  "OnePlus",
  "Oppo",
  "Anker",
];

export type MockReview = {
  id: string;
  source: "google" | "facebook" | "interne";
  author: string;
  rating: number;
  comment: string;
  date: string;
};

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: "r1",
    source: "google",
    author: "Marie L.",
    rating: 5,
    comment: "Réparation impeccable de mon iPhone, écran changé en 1h. Très professionnel.",
    date: "2026-04-12",
  },
  {
    id: "r2",
    source: "facebook",
    author: "Karim B.",
    rating: 5,
    comment: "Boutique de confiance, prix corrects et conseils avisés. Je recommande !",
    date: "2026-04-08",
  },
  {
    id: "r3",
    source: "google",
    author: "Sophie D.",
    rating: 4,
    comment: "Bon service, j'ai trouvé un Galaxy S24 reconditionné comme neuf.",
    date: "2026-04-02",
  },
  {
    id: "r4",
    source: "google",
    author: "Yann P.",
    rating: 5,
    comment: "Diagnostic gratuit, devis honnête, batterie remplacée le jour même.",
    date: "2026-03-28",
  },
];

export const MOCK_REPAIR_STATUS = [
  { code: "RECU", label: "Reçu", description: "L'appareil a été déposé en magasin" },
  { code: "DIAGNOSTIC", label: "Diagnostic en cours", description: "Le technicien examine l'appareil" },
  { code: "DEVIS_VALIDE", label: "Devis validé", description: "Vous avez approuvé le devis" },
  { code: "EN_REPARATION", label: "En cours de réparation", description: "L'appareil est en cours de réparation" },
  { code: "ATTENTE_PIECE", label: "En attente de pièce", description: "Une pièce est commandée" },
  { code: "TERMINE", label: "Réparation terminée", description: "Prête pour restitution" },
  { code: "PRET_RECUPERATION", label: "Prêt à récupérer", description: "Vous pouvez venir le chercher" },
  { code: "ATTENTE_RESTITUTION", label: "Devis refusé", description: "Appareil non réparé à récupérer" },
  { code: "RESTITUE", label: "Restitué", description: "Appareil rendu" },
];
