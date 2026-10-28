// Offline-first service worker: precache the app shell, serve from cache,
// refresh in the background. Bump VERSION whenever files change.
const VERSION = 'v1.1.0';
const CACHE = `hypertrophy-${VERSION}`;
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/store.js',
  'js/engine.js',
  'js/figure.js',
  'js/musclemap.js',
  'js/charts.js',
  'js/ui.js',
  'js/timer.js',
  'js/data/exercises.js',
  'js/data/programs.js',
  'js/views/today.js',
  'js/views/plan.js',
  'js/views/progress.js',
  'js/views/library.js',
  'js/views/workout.js',
  'js/views/settings.js',
  'js/views/onboarding.js',
  'js/views/session.js',
  'js/views/shared.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hypertrophy-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
      return cached || network;
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const c = list.find((x) => 'focus' in x);
      return c ? c.focus() : self.clients.openWindow('./#/workout');
    }),
  );
});
