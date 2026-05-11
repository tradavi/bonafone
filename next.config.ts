import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shaking ciblé des libs d'icônes : Next.js ne bundle que les icônes
  // réellement utilisées au lieu de tirer toute la lib. Gros gain en bundle JS.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
