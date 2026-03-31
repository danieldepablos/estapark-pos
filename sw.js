const CACHE_VERSION = "estapark-pos-v2";
const STATIC_CACHE = [
  "./",
  "./index.html",
  "./js/html5-qrcode.min.js",
  "./apiService.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.allSettled(STATIC_CACHE.map((asset) => cache.add(asset)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // If request is cross-origin and targets the external API, proxy it here
  const isExternalApi = requestUrl.origin.includes("esta7.com") || requestUrl.pathname.startsWith("/ticket");

  if (isExternalApi) {
    // Intercept API calls and inject Authorization header
    event.respondWith((async () => {
      try {
        const AUTH = "Basic cHJ1ZWJhOnBydWViYQ==";

        // Build a new Request based on the original but with Authorization
        const newHeaders = new Headers(event.request.headers || {});
        newHeaders.set('Authorization', AUTH);

        const forwarded = new Request(event.request.url, {
          method: event.request.method,
          headers: newHeaders,
          body: event.request.method === 'GET' || event.request.method === 'HEAD' ? undefined : await event.request.clone().arrayBuffer(),
          redirect: 'follow',
          // let the browser decide about credentials; do not force credentials
        });

        const networkResponse = await fetch(forwarded);
        return networkResponse;
      } catch (err) {
        // If fetch to external API fails, return a 502 JSON response
        return new Response(JSON.stringify({ error: 'API proxy error', detail: String(err) }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })());

    return;
  }

  // For same-origin requests, serve from cache first, then network and update cache
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request)
        .then((networkResponse) => {
          if (event.request.method === "GET" && requestUrl.origin === self.location.origin) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
