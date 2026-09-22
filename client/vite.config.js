import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // When a new build is deployed, update the service worker in the background.
      registerType: "autoUpdate",

      // Static files copied as-is (not bundled) — icons, favicon.
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "pwa-192.png", "pwa-512.png"],

      manifest: {
        name: "LUMERA — Curated Living",
        short_name: "LUMERA",
        description: "Curated commerce — shop, save favourites, and track orders.",
        theme_color: "#1a6b5c",
        background_color: "#f4f5f1",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        categories: ["shopping", "lifestyle"],
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        // Cache built JS/CSS/HTML and public assets for offline shell.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // The editorial hero is 2.25 MB, slightly above Workbox's 2 MB default.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // API calls still go to the network — ecommerce needs live data for checkout.
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "product-images",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },

      // Lets you test service worker during `npm run dev` (optional).
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
