// KemTchop Service Worker for PWA v10 (Network-First for HTML navigation)
const CACHE_NAME = 'kemtchop-pwa-v10';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Suppression ancien cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET, les API, Campay, backend
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api.') ||
    event.request.url.includes('campay') ||
    event.request.url.includes(':8000') ||
    event.request.url.includes('railway.app') ||
    event.request.url.includes('fly.dev')
  ) {
    return;
  }

  // 🔄 Navigation (HTML) : NETWORK-FIRST
  // Permet de recevoir instantanément le nouvel index.html sans être bloqué par le cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request) || caches.match('/'))
    );
    return;
  }

  // ⚡ Assets statiques (JS, CSS, images avec hash) : Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
