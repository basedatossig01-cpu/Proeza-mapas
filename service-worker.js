const CACHE_NAME = "proeza-offline-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copia));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);

          let response = await cache.match(request, { ignoreSearch: true });
          if (response) return response;

          response = await cache.match("./index.html", { ignoreSearch: true });
          if (response) return response;

          response = await cache.match("./", { ignoreSearch: true });
          if (response) return response;

          return new Response(
            "El visor no está disponible sin conexión. Prepará la zona antes de salir.",
            { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          if (response && (response.ok || response.type === "opaque")) {
            const copia = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copia).catch(() => {});
            });
          }
          return response;
        });
    })
  );
});
