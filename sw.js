/* Gym de Nela — Service Worker
   Cachea la app para que funcione sin internet en el gym.
   Sube ESTE archivo a la raíz del repo junto a index.html. */
const CACHE = "gymnela-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putCache(req, res) {
  const copy = res.clone();
  caches.open(CACHE).then((c) => c.put(req, copy).catch(() => {}));
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // La base de datos / auth de Firebase siempre va a la red.
  if (req.url.indexOf("firebaseio.com") >= 0 || req.url.indexOf("identitytoolkit") >= 0 || req.url.indexOf("googleapis.com") >= 0) return;
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").indexOf("text/html") >= 0;
  if (isHTML) {
    // network-first para el HTML (siempre la versión más nueva si hay internet)
    e.respondWith(fetch(req).then((res) => putCache(req, res)).catch(() => caches.match(req).then((m) => m || caches.match("./index.html"))));
  } else {
    // cache-first para el resto (imágenes, etc.)
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((res) => putCache(req, res)).catch(() => m)));
  }
});
