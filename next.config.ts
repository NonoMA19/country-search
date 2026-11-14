import type { NextConfig } from "next";

// En-têtes de sécurité envoyés avec chaque page.
const ENTETES = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Le site n'utilise ni caméra, ni micro, ni position, ni paiement.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()" },
  // Personne ne peut afficher le site dans un cadre (iframe) d'un autre site.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: "/:path*", headers: ENTETES }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
