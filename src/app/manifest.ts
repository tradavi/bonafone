import type { MetadataRoute } from "next";
import { STORE } from "@/lib/utils";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${STORE.name} — ${STORE.tagline}`,
    short_name: STORE.name,
    description:
      "Vente de smartphones, tablettes, accessoires et produits reconditionnés. Service de réparation avec devis gratuit et suivi en ligne.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "fr",
    orientation: "portrait",
    categories: ["shopping", "business"],
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
