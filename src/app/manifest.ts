import type { MetadataRoute } from "next";

/**
 * PWA manifest. Installable in Chrome/Edge/Android and Safari's Add to Home
 * Screen. The service worker (public/sw.js) caches the shell and an offline
 * quick-check page; the full analyzer still needs the server.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FakeShield AI — Detect digital scams",
    short_name: "FakeShield",
    description:
      "Explainable scam checks for suspicious messages, emails and links. Risk guidance, not a final security verdict.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0b0704",
    theme_color: "#0b0704",
    lang: "en-IN",
    dir: "ltr",
    categories: ["security", "utilities", "education"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Analyze a message",
        short_name: "Analyze",
        description: "Paste an SMS or WhatsApp message",
        url: "/analyze",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Check a link",
        short_name: "Links",
        description: "Inspect a URL without opening it",
        url: "/link",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Offline quick check",
        short_name: "Offline",
        description: "A local pattern check when the network is down",
        url: "/offline",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
