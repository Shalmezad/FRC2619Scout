/* Charge Scout service worker: cache the whole app shell so it runs with
 * zero network after the first visit (the venue-offline requirement).
 *
 * Two strategies:
 *  - SHELL (index/styles/app/manifest): stale-while-revalidate — serve the
 *    cached copy instantly (works offline), refresh it in the background so
 *    app updates go live without users being stuck on an old build.
 *  - STATIC (vendor libs, icons): cache-first — these never change.
 *
 * NOTE: deployed under a subfolder (/FRC2619Scout/); all paths are relative
 * so the same file works locally and on the server.
 */

const CACHE = 'charge-scout-v2';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
];
const STATIC = [
  './vendor/qrcode-generator.js',
  './vendor/jsQR.js',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll([...SHELL, ...STATIC]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  const url = new URL(req.url);
  const isShell = req.mode === 'navigate' || SHELL.some(p => url.pathname.endsWith(p.replace('./', '')));

  if (isShell) {
    // stale-while-revalidate
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(req, { ignoreSearch: true }) ||
                       (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
        const network = fetch(req)
          .then(res => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached); // offline: cached copy (or undefined → error)
        return cached || network;
      })
    );
  } else {
    // cache-first for stable assets
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
