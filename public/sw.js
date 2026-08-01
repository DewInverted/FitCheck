const CACHE_NAME = "fitcheck-v1";
const OFFLINE_URL = "/";

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Install — precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for API, cache first for assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls — always network, never cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request).catch(() => new Response('{"error":"offline"}', {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })));
    return;
  }

  // Everything else — stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached || caches.match(OFFLINE_URL));

      return cached || fetched;
    })
  );
});
