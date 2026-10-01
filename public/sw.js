// KemTchop Service Worker for PWA v11 (Optimisé Données Mobiles & Chargement Rapide)
const CACHE_NAME = 'kemtchop-pwa-v11';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pré-cache partiel:', err);
      });
    }).then(() => self.skipWaiting())
  );
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
  const url = event.request.url;

  // Ignorer les requêtes non-GET et les appels API dynamiques
  if (
    event.request.method !== 'GET' ||
    url.includes('/api.') ||
    url.includes('campay') ||
    url.includes(':8000') ||
    url.includes('/users/') ||
    url.includes('/orders/')
  ) {
    return;
  }

  // 🔄 1. Navigation HTML : Network avec Timeout ultra-rapide (1200ms) puis Cache immédiat
  if (event.request.mode === 'navigate') {
    event.respondWith(
      new Promise((resolve) => {
        let didTimeOut = false;
        const timer = setTimeout(() => {
          didTimeOut = true;
          caches.match(event.request).then((cached) => {
            if (cached) resolve(cached);
          });
        }, 1200);

        fetch(event.request)
          .then((networkResponse) => {
            clearTimeout(timer);
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            if (!didTimeOut) resolve(networkResponse);
          })
          .catch(() => {
            clearTimeout(timer);
            caches.match(event.request).then((cached) => {
              resolve(cached || caches.match('/'));
            });
          });
      })
    );
    return;
  }

  // ⚡ 2. Assets JS / CSS / Polices Expo (avec hash de version) : Cache-First
  if (url.includes('/_expo/static/') || url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 🖼️ 3. Images de plats (Cloudinary, Unsplash) : Stale-While-Revalidate (économise les Mo mobiles)
  if (
    url.includes('res.cloudinary.com') ||
    url.includes('images.unsplash.com') ||
    url.endsWith('.png') ||
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.webp')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Fallback par défaut Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
