// KEMTCHOP DIAGNOSTIC BUILD: SERVICE WORKER TOTALEMENT DÉSACTIVÉ
// Auto-désenregistrement immédiat et purge intégrale de tous les caches (v11, v12, etc.)

self.addEventListener('install', (event) => {
  console.log('[SW Diagnostic] Install - skipWaiting...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW Diagnostic] Activation - Purge intégrale des caches et désenregistrement...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('[SW Diagnostic] Suppression cache:', key);
          return caches.delete(key);
        })
      );
    })
    .then(() => self.registration.unregister())
    .then(() => {
      console.log('[SW Diagnostic] Service Worker complètement DÉSENREGISTRÉ.');
      return self.clients.claim();
    })
  );
});

// Zéro interception : 100% des requêtes vont directement au réseau
self.addEventListener('fetch', (event) => {
  return;
});
