const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log('[postbuild-pwa] Injection des métadonnées PWA dans dist/index.html...');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf-8');

  const pwaTags = `
    <!-- Resource Hints for High Performance -->
    <link rel="preconnect" href="https://res.cloudinary.com" crossorigin />
    <link rel="dns-prefetch" href="https://res.cloudinary.com" />
    <link rel="preconnect" href="https://api.kemtchop.shop" crossorigin />
    <link rel="dns-prefetch" href="https://api.kemtchop.shop" />

    <!-- PWA Configuration KemTchop -->
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <meta name="theme-color" content="#E31C25" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="KemTchop" />
    <meta name="application-name" content="KemTchop" />
    <meta name="description" content="Commandez et réservez vos grillades et plats camerounais en ligne" />
    <!-- Diagnostic Mode: Désenregistrement actif du Service Worker et vidage de CacheStorage -->
    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(regs) {
          for (var r of regs) {
            r.unregister();
            console.log('[Diagnostic] SW désenregistré:', r.scope);
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then(function(keys) {
          for (var k of keys) {
            caches.delete(k);
            console.log('[Diagnostic] CacheStorage purgé:', k);
          }
        });
      }
    </script>
  `;

  if (!html.includes('manifest.json')) {
    html = html.replace('</head>', `${pwaTags}\n</head>`);
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log('✅ [postbuild-pwa] Manifest et Service Worker injectés avec succès dans dist/index.html !');
  } else {
    console.log('ℹ️ [postbuild-pwa] Manifest déjà présent dans dist/index.html.');
  }
} else {
  console.warn('⚠️ [postbuild-pwa] dist/index.html non trouvé !');
}

// Vérifier et copier les fichiers PWA publics si absents de dist/
const publicDir = path.join(__dirname, '..', 'public');
const filesToEnsure = ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png', 'favicon.png'];

filesToEnsure.forEach((file) => {
  const src = path.join(publicDir, file);
  const dest = path.join(distPath, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ [postbuild-pwa] Copié ${file} vers dist/ (mis à jour)`);
  }
});
