// KemTchop PWA Service Worker v13 (Conforme critères d'installation Google Chrome PWA)
const CACHE_NAME = 'kemtchop-pwa-v13';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  console.log('[KEMTCHOP-SW-v13] Installation du Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[KEMTCHOP-SW-v13] Pré-cache partiel:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[KEMTCHOP-SW-v13] Activation et nettoyage des anciens caches...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => {
      console.log('[KEMTCHOP-SW-v13] Prise de contrôle immédiate.');
      return self.clients.claim();
    })
  );
});

// IMPORTANT : Chrome exige un écouteur 'fetch' actif pour autoriser l'installation PWA
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. MÉDIA & CLOUDINARY : 100% DIRECT NAVIGATEUR <-> CDN (ZÉRO INTERCEPTION)
  // Ne JAMAIS intercepter les vidéos ni les images pour préserver le Range 206 et la rapidité
  if (
    url.includes('res.cloudinary.com') ||
    url.includes('images.unsplash.com') ||
    url.includes('.mp4') ||
    url.includes('.webm') ||
    url.includes('/video/') ||
    event.request.headers.get('range')
  ) {
    return; // Direct navigateur <-> CDN Cloudinary
  }

  // 3. API FASTAPI : 100% DIRECT NAVIGATEUR <-> BACKEND (AUCUN CACHE STALE)
  if (
    url.includes('api.kemtchop.shop') ||
    url.includes(':8000') ||
    url.includes(':3000') ||
    url.includes('campay') ||
    url.includes('/products/') ||
    url.includes('/reels/') ||
    url.includes('/offers/') ||
    url.includes('/cities/') ||
    url.includes('/users/') ||
    url.includes('/orders/')
  ) {
    return; // Direct navigateur <-> FastAPI
  }

  // 4. Navigation HTML (App Shell PWA) : Network-First avec fallback cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          return caches.match(event.request).then((c) => c || caches.match('/'));
        })
    );
    return;
  }

  // 5. Assets statiques locaux (JS Bundles, CSS, Polices, Icônes du site) : Cache-First
  const isSameOrigin = url.startsWith(self.location.origin);
  if (
    isSameOrigin &&
    (url.includes('/_expo/static/') ||
     url.includes('/assets/') ||
     url.endsWith('.js') ||
     url.endsWith('.css') ||
     url.endsWith('.png') ||
     url.endsWith('.ico') ||
     url.endsWith('.json'))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  return;
});
