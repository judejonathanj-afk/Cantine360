import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 92],
  },
  turbopack: {
    root: __dirname,
  },
  // Évite que Turbopack casse le client Prisma (délégués undefined → findUnique impossible).
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@prisma/adapter-pg",
    "pg",
  ],
  // Autorise le HMR en dev quand tu ouvres le site via 127.0.0.1 plutôt que localhost (voir terminal Next.js).
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
