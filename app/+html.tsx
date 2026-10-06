import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Configuration HTML Racine Web pour KemTchop (Expo Router v4 / PWA)
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr" translate="no" className="notranslate">
      <head>
        <meta charSet="utf-8" />
        <meta name="google" content="notranslate" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <title>KemTchop — Cuisine Camerounaise Authentique & Grillades | Livraison Yaoundé & Douala</title>
        <meta name="description" content="Commandez vos plats camerounais authentiques et grillades en ligne sur KemTchop : Ndolè, Eru, Poisson braisé, Taro sauce jaune, Poulet DG, Koki. Livraison rapide à domicile et au bureau à Yaoundé et Douala." />
        <meta name="keywords" content="cuisine camerounaise, plats camerounais, restaurant camerounais, livraison repas yaounde, livraison repas douala, ndole, eru, poisson braise, taro sauce jaune, poulet dg, sanga, koki, okok, grillades cameroun, commande nourriture cameroun, restaurant africain, plats du jour yaounde, bastos, akwa, bonapriso, kemtchop" />
        <meta name="author" content="KemTchop" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://kemtchop.shop/" />

        {/* Open Graph & Social Cards */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="KemTchop" />
        <meta property="og:title" content="KemTchop — Plats Camerounais Authentiques & Grillades en Ligne" />
        <meta property="og:description" content="Commandez vos repas camerounais traditionnels livrés chez vous à Yaoundé et Douala : Ndolè, Eru, Poisson braisé, Taro sauce jaune, Poulet DG." />
        <meta property="og:url" content="https://kemtchop.shop/" />
        <meta property="og:image" content="https://kemtchop.shop/icon-512-v2.png" />
        <meta property="og:locale" content="fr_CM" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="KemTchop — Cuisine Camerounaise & Grillades en Ligne" />
        <meta name="twitter:description" content="Livraison rapide de repas camerounais authentiques à Yaoundé et Douala." />
        <meta name="twitter:image" content="https://kemtchop.shop/icon-512-v2.png" />

        {/* Resource Hints for High Performance */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://api.kemtchop.shop" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.kemtchop.shop" />

        {/* PWA & Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/favicon-v2.png" />
        <link rel="apple-touch-icon" href="/icon-192-v2.png" />
        <meta name="theme-color" content="#E31C25" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KemTchop" />
        <meta name="application-name" content="KemTchop" />

        {/* PWA & Service Worker Registration + Early beforeinstallprompt Capture */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
            `,
          }}
        />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveWebStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveWebStyles = `
html, body {
  background-color: #0f172a;
  margin: 0;
  padding: 0;
  height: 100%;
  display: flex;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
#root {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 500px;
  min-height: 100vh;
  margin: 0 auto;
  background-color: #f8fafc;
  box-shadow: 0 0 50px rgba(0,0,0,0.4);
  position: relative;
  overflow-x: hidden;
}
`;
