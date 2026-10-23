/**
 * Vapor service worker — offline-first static cache.
 * Keep CACHE_VERSION bumped when precached assets change.
 */

const CACHE_VERSION = "vapor-v1";

const PRECACHE = [
  "./",
  "./index.html",
  "./about.html",
  "./disclaimer.html",
  "./404.html",
  "./tools/e-liquid.html",
  "./tools/ohms-law.html",
  "./manifest.webmanifest",
  "./assets/css/style.css",
  "./assets/css/calculators.css",
  "./assets/js/main.js",
  "./assets/js/pwa.js",
  "./assets/js/theme.js",
  "./assets/js/theme-init.js",
  "./assets/js/storage.js",
  "./assets/js/e-liquid.js",
  "./assets/js/ohms-law.js",
  "./assets/js/calculators/e-liquid.js",
  "./assets/js/calculators/ohms-law.js",
  "./assets/icons/favicon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/droplet.svg",
  "./assets/icons/bolt.svg",
  "./assets/icons/copy.svg",
  "./assets/icons/reset.svg",
  "./assets/icons/github.svg",
  "./assets/icons/lock.svg",
  "./assets/icons/code.svg",
  "./assets/icons/sliders.svg",
  "./assets/icons/chart.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.all(
        PRECACHE.map(async (path) => {
          try {
            const response = await fetch(path, { cache: "reload" });
            if (response.ok) {
              await cache.put(path, response);
            }
          } catch {
            /* Skip missing optional assets so install can still succeed. */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Resolve a same-origin request against the cache, with HTML fallbacks.
 * @param {Request} request
 * @param {Response | undefined} cached
 */
async function fallback(request, cached) {
  if (cached) return cached;

  if (request.mode === "navigate") {
    const cache = await caches.open(CACHE_VERSION);
    return (
      (await cache.match("./index.html")) ||
      (await cache.match("./404.html")) ||
      Response.error()
    );
  }

  return Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);

      // Navigations: network first, cache fallback (fresher HTML when online).
      if (request.mode === "navigate") {
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          return fallback(request, await cache.match(request));
        }
      }

      // Static assets: cache first, then network.
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        return fallback(request, cached);
      }
    })()
  );
});
