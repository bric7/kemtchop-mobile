// constants/config.ts
// ✅ Configuration centrale pour Web + Mobile (Expo-compatible)
// ✅ Utilise UNIQUEMENT process.env (supporté par Metro + Vite)

import { Platform } from 'react-native';

// ============================================================
// 🌍 DÉTECTION ENVIRONNEMENT (Expo-standard)
// ============================================================
// Expo injecte uniquement les variables EXPO_PUBLIC_* via process.env
// @ts-ignore - process.env est disponible au runtime dans Expo
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // ✅ Expo-standard : process.env.EXPO_PUBLIC_*
    // @ts-ignore
    const value = process?.env?.[key];
    if (value !== undefined && value !== '') return value;
  } catch (e) {
    // Ignore les erreurs d'accès aux env vars
  }
  return fallback;
};

export const isProduction = getEnvVar('EXPO_PUBLIC_ENV', 'development') === 'production';
export const isDevelopment = getEnvVar('EXPO_PUBLIC_ENV', 'development') === 'development';
export const isWeb = typeof window !== 'undefined' && Platform.OS === 'web';

// ============================================================
// 🔌 URLS DE L'API (Expo-compatible)
// ============================================================
// ✅ URL de base : Lit EXPO_PUBLIC_API_URL via process.env
export const API_BASE_URL = getEnvVar(
  'EXPO_PUBLIC_API_URL',
  isProduction 
    ? 'https://kemtchop-backend-production.up.railway.app'
    : 'http://10.0.2.2:8000'
);

// ✅ Fonction getApiUrl pour construire des URLs complètes
export const getApiUrl = (endpoint: string = ''): string => {
  if (endpoint.startsWith('http')) return endpoint;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

// ✅ Helper pour construire des URLs d'endpoints complets
export const buildApiUrl = (endpoint: string): string => {
  return getApiUrl(endpoint);
};

// ============================================================
// 🎬 URLs DES MÉDIAS (Expo-compatible & Cloudinary-safe)
// ============================================================

// Configuration Cloudinary (à adapter si ton cloud/change de dossier)
const CLOUDINARY_CONFIG = {
  baseUrl: 'https://res.cloudinary.com/dqk85euoh',
  transformation: 'image/upload/v1782940834',
  folder: 'kemtchop/products',
} as const;

// Vérifie si une URL est déjà sur Cloudinary
const isCloudinaryUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.includes('res.cloudinary.com');
};

// Vérifie si c'est un identifiant d'image brut (ex: abc123.jpg)
const isRawImageId = (path: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const hasImageExtension = imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
  // Si ça finit par une extension d"image ET ne contient pas de "/", c'est un ID brut
  return hasImageExtension && !path.includes('/');
};

export const MEDIA_BASE_URL = getEnvVar(
  'EXPO_PUBLIC_MEDIA_URL',
  `${API_BASE_URL}/videos`
);

// ✅ Helper unique et ultra-robuste pour construire les URLs de médias
export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';

  let cleanPath = path.trim();

  // 🚨 CORRECTIF ULTIME : Si l'URL contient l'ancien domaine "tchopiol"
  if (cleanPath.includes('tchopiol-production.up.railway.app')) {
    // On extrait uniquement le nom du fichier à la fin (ex: s1gd33h62xs8z7esbdja.jpg)
    const segments = cleanPath.split('/');
    const fileName = segments[segments.length - 1];
    
    // Si c'est bien une image, on la redirige de force vers Cloudinary !
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) {
      return `${CLOUDINARY_CONFIG.baseUrl}/${CLOUDINARY_CONFIG.transformation}/${CLOUDINARY_CONFIG.folder}/${fileName}`;
    }
    
    // Si c'était une vidéo, on remplace juste le domaine par le nouveau Railway de KemTchop
    cleanPath = cleanPath.replace('tchopiol-production.up.railway.app', 'kemtchop-backend-production.up.railway.app');
  }

  // Cas 1 : URL absolue standard et propre (Cloudinary ou nouveau Railway) → on ne touche à rien
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    // Petit nettoyage au cas où le nouveau backend aurait aussi le bug du double "/videos/videos/"
    return cleanPath.replace(/\/videos\/videos\//gi, '/videos/');
  }

  // Nettoyage des slashes initiaux pour les chemins relatifs
  cleanPath = cleanPath
    .replace(/^\/+/, '')
    .replace(/\/videos\/videos\//gi, '/videos/');

  // Cas 2 : Identifiant Cloudinary brut (ex: s1gd33h62xs8z7esbdja.jpg)
  if (isRawImageId(cleanPath)) {
    return `${CLOUDINARY_CONFIG.baseUrl}/${CLOUDINARY_CONFIG.transformation}/${CLOUDINARY_CONFIG.folder}/${cleanPath}`;
  }

  // Cas 3 : Chemin relatif pour vidéos sur Railway
  if (cleanPath.startsWith('videos/') && MEDIA_BASE_URL.endsWith('/videos')) {
    const internalPath = cleanPath.replace(/^videos\//, '');
    return `${MEDIA_BASE_URL}/${internalPath}`;
  }

  return `${MEDIA_BASE_URL}/${cleanPath}`;
};
// ============================================================
// 🗂️ ENDPOINTS API (chemins relatifs)
// ============================================================
export const API_ENDPOINTS = {
  login: '/admin/login',
  register: '/users/register',
  userStatus: '/users/status',
  reels: '/reels/',
  products: '/reels/',
  createOrder: '/orders/create',
  myOrders: '/orders/my-orders',
  trackEvent: '/analytics/track',
  deliveryZones: '/admin/settings/delivery-zones',
  initPayment: '/payments/campay/init',
  paymentStatus: '/payments/campay/status',
} as const;

// ============================================================
// 🔐 CONFIGURATION AUTH
// ============================================================
export const AUTH = {
  storageKey: 'kemtchop_session',
  tokenKey: 'token',
  affiliateCodeKey: 'active_affiliate_code',
};

// ============================================================
// 📊 CONFIGURATION ANALYTICS
// ============================================================
export const ANALYTICS = {
  enabled: isProduction,
  endpoint: '/analytics/track',
};

// ============================================================
// 🧪 CONFIGURATION DEBUG
// ============================================================
export const DEBUG = {
  enabled: !isProduction,
  logApiCalls: true,
  logAnalytics: false,
};