
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("skincare-cache-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/icon-192x192.png",
        "/icon-512x512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Не кэшировать POST-запросы
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

