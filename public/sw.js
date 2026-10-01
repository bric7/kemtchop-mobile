// KemTchop Service Worker v12 (Découplage Strict : Static Cache / Direct Media & API)
const CACHE_NAME = 'kemtchop-pwa-v12';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  console.log('[KEMTCHOP-SW-v12] Installation & mise en cache des assets statiques...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[KEMTCHOP-SW-v12] Pré-cache partiel:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[KEMTCHOP-SW-v12] Activation & purge de TOUS les anciens caches (v11 inclus)...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[KEMTCHOP-SW-v12] Suppression ancien cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('[KEMTCHOP-SW-v12] Contrôle actif immédiat.');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 🚫 1. IGNORER TOTALEMENT les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // 🎬 2. MÉDIA & CLOUDINARY : 100% DIRECT NAVIGATEUR <-> CDN (ZÉRO INTERCEPTION SW)
  // Ne JAMAIS intercepter les vidéos (Range 206) ni les images Cloudinary
  if (
    url.includes('res.cloudinary.com') ||
    url.includes('images.unsplash.com') ||
    url.includes('.mp4') ||
    url.includes('.webm') ||
    url.includes('/video/') ||
    event.request.headers.get('range')
  ) {
    return; // Laisser le navigateur et Cloudinary gérer nativement le streaming HTTP
  }

  // ⚡ 3. API FASTAPI : 100% DIRECT NAVIGATEUR <-> BACKEND (AUCUN CACHE STALE)
  // Toutes les routes API de KemTchop et partenaires
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
    return; // Laisser le navigateur communiquer directement avec FastAPI sans CacheStorage
  }

  // 🔄 4. NAVIGATION HTML (App Shell PWA) : Network-First avec timeout rapide
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 📦 5. ASSETS STATIQUES LOCAUX (JS Bundles Metro, Polices, CSS, Icônes du domaine) : Cache-First
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

  // Pour tout le reste : laisser passer directement au réseau
  return;
});
