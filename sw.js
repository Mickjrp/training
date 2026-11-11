// Offline cache for Weekly Training.
// 1) Bump CACHE every time you upload changes.
// 2) If you add a new file, add it to ASSETS too.
const CACHE = "weekly-training-v1.3.0";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/data.js",
  "./js/utils.js",
  "./js/ui.js",
  "./js/storage.js",
  "./js/exercise.js",
  "./js/muscle-map.js",
  "./js/timer.js",
  "./js/views/workout.js",
  "./js/views/sheets.js",
  "./js/views/body.js",
  "./js/views/week.js",
  "./js/views/settings.js",
  "./js/main.js",
  "./fonts/barlow-condensed-700.woff2",
  "./fonts/ibm-plex-mono-500.woff2",
  "./fonts/ibm-plex-mono-600.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
// Stale-while-revalidate: open instantly from cache (works offline at the gym),
// refresh the cache in the background so the next launch gets any update.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit =
        (await c.match(req, { ignoreSearch: true })) ||
        (req.mode === "navigate" ? await c.match("./index.html") : undefined);
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) c.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (hit) {
        e.waitUntil(net);
        return hit;
      }
      const res = await net;
      return res || (req.mode === "navigate" ? c.match("./index.html") : Response.error());
    }),
  );
});
