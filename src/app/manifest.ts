import type { MetadataRoute } from "next";

/**
 * Web app manifest — what makes NUR installable. On Android, Chrome offers
 * "Install app"; NUR then gets its own icon, opens full screen without the
 * browser bar, and appears in the app drawer and app switcher.
 *
 * The same manifest is what a Google Play package (Trusted Web Activity)
 * is generated from, so publishing to the Play Store needs no code changes.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NUR — light upon light",
    short_name: "NUR",
    description:
      "Nasheeds, Qur'an, Seerah, dhikr and reflection — one quiet place to return to each day.",
    // Installed users open straight into the app; the proxy sends anyone
    // signed out to sign-in first.
    start_url: "/home?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B0A12",
    theme_color: "#0B0A12",
    categories: ["lifestyle", "books", "music", "health"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Qur'an", url: "/quran", icons: [{ src: "/icons/192", sizes: "192x192" }] },
      { name: "Tasbeeh", url: "/tasbeeh", icons: [{ src: "/icons/192", sizes: "192x192" }] },
      { name: "Nasheed", url: "/nasheeds", icons: [{ src: "/icons/192", sizes: "192x192" }] },
    ],
  };
}
