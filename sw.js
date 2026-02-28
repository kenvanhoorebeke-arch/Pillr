// Cache versie — verhoog dit bij elke deploy om de cache te invalideren
const CACHE_VERSION = '20260228-001';
const CACHE = 'pillr-' + CACHE_VERSION;

const ASSETS = [
  './index.html',
  './icon.svg',
  './manifest.json'
];

// Installeer: cache alle assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activeer: verwijder alle oude caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategie:
// - HTML (navigatie): network-first → altijd verse versie laden, cache als fallback
// - Overige assets: cache-first → snel laden
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    // Network-first voor HTML
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first voor icons, manifests etc.
    e.respondWith(
      caches.match(e.request).then(cached => {
        return cached || fetch(e.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        });
      })
    );
  }
});
