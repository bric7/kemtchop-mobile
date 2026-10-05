const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log('[postbuild-pwa] Injection des métadonnées PWA & SEO dans dist/index.html...');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf-8');

  // 1. Remplacement ou injection du Titre optimisé SEO
  const seoTitle = '<title>KemTchop — Cuisine Camerounaise Authentique & Grillades | Livraison Yaoundé & Douala</title>';
  if (html.includes('<title>')) {
    html = html.replace(/<title>.*?<\/title>/, seoTitle);
  }

  // 2. Balises SEO, Open Graph, Twitter Cards et Schema.org JSON-LD
  const seoAndPwaTags = `
    <!-- 🚀 Resource Hints Haute Performance -->
    <link rel="preconnect" href="https://res.cloudinary.com" crossorigin />
    <link rel="dns-prefetch" href="https://res.cloudinary.com" />
    <link rel="preconnect" href="https://api.kemtchop.shop" crossorigin />
    <link rel="dns-prefetch" href="https://api.kemtchop.shop" />

    <!-- 🔍 Métadonnées SEO Fondamentales (Google, Bing, Yahoo) -->
    <meta name="description" content="Commandez vos plats camerounais authentiques et grillades en ligne sur KemTchop : Ndolè, Eru, Poisson braisé, Taro sauce jaune, Poulet DG, Koki. Livraison rapide à domicile et au bureau à Yaoundé et Douala." />
    <meta name="keywords" content="cuisine camerounaise, plats camerounais, restaurant camerounais, livraison repas yaounde, livraison repas douala, ndole, eru, poisson braise, taro sauce jaune, poulet dg, sanga, koki, okok, grillades cameroun, commande nourriture cameroun, restaurant africain, plats du jour yaounde, bastos, akwa, bonapriso, kemtchop" />
    <meta name="author" content="KemTchop" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="canonical" href="https://kemtchop.shop/" />

    <!-- 🌐 Open Graph / Facebook / WhatsApp / LinkedIn -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="KemTchop" />
    <meta property="og:title" content="KemTchop — Plats Camerounais Authentiques & Grillades en Ligne" />
    <meta property="og:description" content="Commandez vos repas camerounais traditionnels livrés chez vous à Yaoundé et Douala : Ndolè, Eru, Poisson braisé, Taro sauce jaune, Poulet DG." />
    <meta property="og:url" content="https://kemtchop.shop/" />
    <meta property="og:image" content="https://kemtchop.shop/icon-512.png" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:image:alt" content="KemTchop - Plats et grillades camerounaises" />
    <meta property="og:locale" content="fr_CM" />

    <!-- 🐦 Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="KemTchop — Cuisine Camerounaise & Grillades en Ligne" />
    <meta name="twitter:description" content="Livraison rapide de repas camerounais authentiques à Yaoundé et Douala." />
    <meta name="twitter:image" content="https://kemtchop.shop/icon-512.png" />

    <!-- 📱 Configuration PWA & Icônes -->
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <meta name="theme-color" content="#E31C25" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="KemTchop" />
    <meta name="application-name" content="KemTchop" />

    <!-- 📊 Données Structurées Schema.org JSON-LD (Restaurant & FoodDelivery) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "@id": "https://kemtchop.shop/#restaurant",
      "name": "KemTchop",
      "alternateName": "Kem Tchop",
      "url": "https://kemtchop.shop",
      "logo": "https://kemtchop.shop/icon-512.png",
      "image": "https://kemtchop.shop/icon-512.png",
      "description": "Plateforme de commande et réservation de repas traditionnels camerounais et grillades. Livraison à domicile et au bureau à Yaoundé et Douala.",
      "servesCuisine": [
        "Camerounaise",
        "Africaine",
        "Grillades",
        "Street Food",
        "Plats traditionnels"
      ],
      "priceRange": "1500 - 10000 XAF",
      "currenciesAccepted": "XAF",
      "paymentAccepted": "Mobile Money, Orange Money, MTN MoMo, Cash",
      "areaServed": [
        {
          "@type": "City",
          "name": "Yaoundé",
          "addressRegion": "Centre",
          "addressCountry": "CM"
        },
        {
          "@type": "City",
          "name": "Douala",
          "addressRegion": "Littoral",
          "addressCountry": "CM"
        }
      ],
      "hasMenu": {
        "@type": "Menu",
        "name": "Menu KemTchop",
        "hasMenuSection": [
          {
            "@type": "MenuSection",
            "name": "Plats Traditionnels du Terroir",
            "hasMenuItem": [
              {
                "@type": "MenuItem",
                "name": "Ndolè",
                "description": "Plat emblématique camerounais aux feuilles de ndolè, arachides fraîches, viande de bœuf, poisson fumé ou crevettes, servi avec miondo ou plantains"
              },
              {
                "@type": "MenuItem",
                "name": "Eru",
                "description": "Feuilles sauvages d'eru et waterleaf mijotées à l'huile de palme avec écrevisses et peau de bœuf kanda"
              },
              {
                "@type": "MenuItem",
                "name": "Taro Sauce Jaune",
                "description": "Taro pilé traditionnel accompagné de sa sauce jaune achu aux épices aromatiques des hauts plateaux de l'Ouest"
              },
              {
                "@type": "MenuItem",
                "name": "Poulet DG",
                "description": "Poulet Directeur Général mijoté aux plantains mûrs dorés, carottes, haricots verts et poivrons"
              },
              {
                "@type": "MenuItem",
                "name": "Koki",
                "description": "Gâteau moelleux de haricots cornille blancs à l'huile de palme rouge et piment"
              },
              {
                "@type": "MenuItem",
                "name": "Okok",
                "description": "Plat traditionnel aux feuilles d'okok finement découpées, jus de noix de palme et pâte d'arachide"
              },
              {
                "@type": "MenuItem",
                "name": "Sanga",
                "description": "Mélange onctueux de maïs frais et jeunes feuilles de manioc cuits dans le jus de noix de palme"
              }
            ]
          },
          {
            "@type": "MenuSection",
            "name": "Grillades & Poissons Braisés",
            "hasMenuItem": [
              {
                "@type": "MenuItem",
                "name": "Poisson Braisé",
                "description": "Bar, carpe ou silure mariné aux épices traditionnelles du pays (pebbé, rondelles, djansang) et braisé au feu de bois"
              },
              {
                "@type": "MenuItem",
                "name": "Poulet Braisé",
                "description": "Poulet fermier mariné aux épices du terroir et braisé à point"
              }
            ]
          }
        ]
      },
      "potentialAction": {
        "@type": "OrderAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://kemtchop.shop",
          "inLanguage": "fr",
          "actionPlatform": [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform"
          ]
        },
        "deliveryMethod": "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"
      }
    }
    </script>

    <!-- ⚡ PWA & Service Worker Registration -->
    <script>
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

  // Nettoyer les anciens blocs réinjectés s'ils existent
  if (html.includes('<!-- 🚀 Resource Hints Haute Performance -->')) {
    html = html.replace(/<!-- 🚀 Resource Hints Haute Performance -->[\s\S]*?<\/script>\s*/, '');
  }

  // Injecter les métadonnées SEO & PWA dans <head>
  html = html.replace('</head>', `${seoAndPwaTags}\n</head>`);

  // Garantir interactive-widget=resizes-content pour le clavier Android
  if (html.includes('shrink-to-fit=no') && !html.includes('interactive-widget')) {
    html = html.replace(
      'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
      'content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, interactive-widget=resizes-content"'
    );
  }

  // Langue FR + blocage de la traduction auto (évite l'erreur insertBefore)
  html = html.replace(/<html[^>]*>/, '<html lang="fr" translate="no" class="notranslate">');
  if (!html.includes('name="google"')) {
    html = html.replace('</head>', '<meta name="google" content="notranslate" />\n</head>');
  }

  // 3. Contenu sémantique de repli <noscript> pour les robots d'indexation (Googlebot, Bingbot)
  const seoSemanticFallback = `
    <noscript>
      <div style="padding: 20px; font-family: -apple-system, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <header>
          <h1 style="color: #E31C25;">KemTchop — Restaurant & Livraison de Plats Camerounais à Yaoundé et Douala</h1>
          <p><strong>Commandez en ligne vos repas traditionnels camerounais et grillades authentiques :</strong> Ndolè, Eru, Taro sauce jaune, Poisson braisé, Poulet DG, Koki, Sanga, Okok.</p>
        </header>
        <section>
          <h2>Nos Plats Emblématiques du Cameroun</h2>
          <ul>
            <li><strong>Ndolè Royal</strong> : Préparé avec des feuilles de ndolè fraîches, pâte d'arachide, viande, poisson fumé ou crevettes, accompagné de miondo, bobolo ou plantains mûrs.</li>
            <li><strong>Eru du Sud-Ouest</strong> : Légumes eru sauvages et waterleaf sautés aux écrevisses et kanda, servi avec fufu ou couscous de manioc.</li>
            <li><strong>Taro Sauce Jaune (Achu)</strong> : Taro blanc pilé avec la fameuse sauce jaune parfumée aux épices médicinales des hauts plateaux de l'Ouest.</li>
            <li><strong>Poisson Braisé au Feu de Bois</strong> : Bar, carpe ou silure mariné aux aromates traditionnels camerounais (pebbé, rondelle, djansang) et braisé sur braise ardente.</li>
            <li><strong>Poulet DG (Directeur Général)</strong> : Morceaux de poulet croustillants mijotés aux plantains mûrs dorés et légumes croquants.</li>
            <li><strong>Koki, Okok & Sanga</strong> : Plats du terroir pour les amateurs de cuisine authentique africaine.</li>
          </ul>
        </section>
        <section>
          <h2>Livraison Rapide à Domicile et au Bureau</h2>
          <p>Nous livrons vos commandes chaudes et fraîches à :</p>
          <ul>
            <li><strong>Yaoundé :</strong> Bastos, Odza, Omnisports, Biyem-Assi, Mimboman, Ngousso, Mendong, Tsinga...</li>
            <li><strong>Douala :</strong> Akwa, Bonapriso, Bonanjo, Deido, Makepe, Kotto, Denver, Bali...</li>
          </ul>
          <p>Paiement sécurisé via Mobile Money (Orange Money, MTN MoMo) ou à la livraison.</p>
        </section>
      </div>
    </noscript>
  `;

  if (!html.includes('KemTchop — Restaurant & Livraison')) {
    html = html.replace('<body>', `<body>\n${seoSemanticFallback}`);
  }

  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('✅ [postbuild-pwa] Métadonnées SEO, Open Graph, Schema.org et sémantique injectées dans dist/index.html !');
} else {
  console.warn('⚠️ [postbuild-pwa] dist/index.html non trouvé !');
}

// 4. Copier les fichiers publics (manifest, sw, icons, robots.txt, sitemap.xml)
const publicDir = path.join(__dirname, '..', 'public');
const filesToEnsure = [
  'manifest.json',
  'sw.js',
  'icon-192.png',
  'icon-512.png',
  'favicon.png',
  'robots.txt',
  'sitemap.xml'
];

filesToEnsure.forEach((file) => {
  const src = path.join(publicDir, file);
  const dest = path.join(distPath, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ [postbuild-pwa] Copié ${file} vers dist/ (mis à jour)`);
  }
});
