import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/queries";

const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/boutique", priority: 0.9, changeFrequency: "daily" },
  { path: "/boutique/smartphones", priority: 0.9, changeFrequency: "daily" },
  { path: "/boutique/tablettes", priority: 0.8, changeFrequency: "daily" },
  { path: "/boutique/ordinateurs", priority: 0.8, changeFrequency: "daily" },
  { path: "/boutique/accessoires", priority: 0.7, changeFrequency: "weekly" },
  { path: "/reparations", priority: 0.9, changeFrequency: "weekly" },
  { path: "/reparations/devis", priority: 0.9, changeFrequency: "monthly" },
  { path: "/temoignages", priority: 0.6, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
  { path: "/reclamations", priority: 0.4, changeFrequency: "yearly" },
  { path: "/connexion", priority: 0.3, changeFrequency: "yearly" },
  { path: "/inscription", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllProductSlugs();
    productEntries = slugs.map((slug) => ({
      url: `${SITE_URL}/produit/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Build sans DB ouverte → on retourne les routes statiques uniquement.
  }

  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...productEntries,
  ];
}
