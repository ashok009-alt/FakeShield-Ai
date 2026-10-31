/*
 * FakeShield AI service worker.
 *
 * Goals:
 *  - keep the app shell fast with stale-while-revalidate for static assets;
 *  - always prefer fresh HTML and API responses (never cache POSTs or /api);
 *  - provide a working offline quick-check page when the network is down.
 *
 * The full analyzer requires the server. The offline page runs a deliberately
 * small, local pattern check and says so.
 */
const VERSION = "fakeshield-v1";
const PRECACHE = [
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) await cache.put(url, response);
          } catch {
            /* a missing precache entry must not block installation */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/tesseract/") ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // Never cache the large background videos.
  if (url.pathname.startsWith("/videos/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(VERSION);
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return (
            (await caches.match("/offline")) ||
            new Response("You are offline. Open the FakeShield app again when you have a connection.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })()
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const network = fetch(request)
          .then(async (response) => {
            if (response.ok) {
              const cache = await caches.open(VERSION);
              await cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);
        return cached || (await network) || new Response("", { status: 504 });
      })()
    );
  }
});
