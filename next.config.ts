import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Désactivé : @supabase/auth-js appelle Date.now() en interne (vérification
  // d'expiration du token), ce que Cache Components refuse pendant le
  // prerendering. Pas de valeur ajoutée pour cette app, donc on reste en
  // rendu dynamique classique plutôt que de contourner une lib tierce.
  cacheComponents: false,
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
