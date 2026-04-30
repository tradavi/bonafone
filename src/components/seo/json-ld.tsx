import { STORE } from "@/lib/utils";

const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

/**
 * Injecte un bloc JSON-LD. Le rendu côté serveur garantit que les
 * crawlers le voient au premier chargement.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "@id": `${SITE_URL}/#store`,
    name: STORE.name,
    description:
      "Vente de smartphones, tablettes, accessoires et produits reconditionnés. Service de réparation avec devis gratuit et suivi en ligne.",
    url: SITE_URL,
    telephone: STORE.phone,
    email: STORE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: STORE.address.split(",")[0]?.trim(),
      addressLocality: "Uccle",
      postalCode: "1180",
      addressCountry: "BE",
    },
    openingHours: STORE.hours,
    areaServed: ["BE", "FR", "LU", "NL"],
  };
}

export function productSchema(product: {
  name: string;
  description?: string | null;
  primaryImage?: string | null;
  brand: { name: string };
  price: number;
  stock: number;
  slug: string;
  condition: string;
}) {
  const inStock = product.stock > 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.primaryImage ?? undefined,
    brand: { "@type": "Brand", name: product.brand.name },
    sku: product.slug,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/produit/${product.slug}`,
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition:
        product.condition === "OCCASION"
          ? "https://schema.org/UsedCondition"
          : "https://schema.org/RefurbishedCondition",
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
