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
    <!-- PWA & Service Worker Registration + Early beforeinstallprompt Capture -->
    <script>
      // Capture précoce de l'événement PWA avant le montage de React
      window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        window.deferredPWAPrompt = e;
        window.dispatchEvent(new Event('pwa-prompt-ready'));
        console.log('[KemTchop PWA] beforeinstallprompt capturé sur window');
      });

      window.addEventListener('appinstalled', function() {
        console.log('[KemTchop PWA] Application installée avec succès !');
        window.deferredPWAPrompt = null;
      });

      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').then(
            function(reg) {
              console.log('[KemTchop PWA] Service Worker actif:', reg.scope);
            },
            function(err) {
              console.warn('[KemTchop PWA] Service Worker non enregistré:', err);
            }
          );
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
