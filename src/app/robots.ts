import type { MetadataRoute } from "next";

const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/compte", "/compte/*", "/api/*", "/checkout/*"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
