/*
 * NUR service worker — deliberately minimal.
 *
 * It exists for two reasons: some Android browsers still require a service
 * worker with a fetch handler before offering "Install app", and a visitor
 * who opens the installed app with no signal should see a calm offline page
 * rather than the browser's dinosaur.
 *
 * It does NOT cache pages or API responses. Signed-in pages are personal
 * (notes, orders, membership), and caching them in a shared cache is how
 * one person's data ends up shown to another, or stale after sign-out.
 * Everything goes to the network; only the offline page is stored.
 */
const CACHE = "nur-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Only page navigations get the offline fallback; everything else
  // (audio, API calls, images) goes straight to the network untouched.
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())),
  );
});
