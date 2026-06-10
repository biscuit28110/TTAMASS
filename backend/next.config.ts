import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les photos envoyées à l'IA (base64) peuvent dépasser 1MB (limite Next.js par défaut)
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
