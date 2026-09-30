import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Configuration HTML Racine Web pour KemTchop (Expo Router v4 / PWA)
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
        />
        <title>KemTchop — Grillades & Plats du Jour</title>

        {/* PWA & Icons */}
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

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('[KemTchop PWA] Service Worker actif:', reg.scope);
                    },
                    function(err) {
                      console.log('[KemTchop PWA] Service Worker non enregistré:', err);
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
