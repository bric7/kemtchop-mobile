// config/api.ts - Service API centralisé KemTchop (Version 100% Anti "Already read")
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL || 'https://api.kemtchop.shop';
  // Nettoyage de sécurité
  return url.trim().replace(/\/+$/, '');
};

const API_BASE_URL = getApiBaseUrl();

const log = (...args: any[]): void => {
  console.log('[KemTchop API]', ...args);
};

// ============================================================
// 🔐 GESTION TOKEN CENTRALISÉE
// ============================================================
export const getToken = async (): Promise<string | null> => {
  try {
    const accessToken = await AsyncStorage.getItem('access_token');
    if (accessToken) return accessToken;

    const sessionRaw = await AsyncStorage.getItem('kemtchop_session');
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      return session.access_token || session.token || null;
    }
    return null;
  } catch (e) {
    console.error('[API] Erreur lecture token:', e);
    return null;
  }
};

// ============================================================
// 🔄 DÉCLENCHEUR GLOBAL DE RAFRAÎCHISSEMENT UNIVERSEL (Web + Mobile)
// ============================================================
const refreshListeners = new Set<() => void>();

export const triggerGlobalRefresh = (): void => {
  refreshListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('[API] Erreur refresh listener:', e);
    }
  });

  if (typeof window !== 'undefined' && window.dispatchEvent) {
    try {
      window.dispatchEvent(new CustomEvent('kemtchop:refresh'));
    } catch {}
  }
};

export const onGlobalRefresh = (callback: () => void): (() => void) => {
  refreshListeners.add(callback);
  return () => {
    refreshListeners.delete(callback);
  };
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================
// 🌐 FETCH CENTRALISÉ AVEC RETRY AUTOMATIQUE
// ============================================================
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  auth: boolean = false,
  retryCount: number = 0
): Promise<any> => {
  const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${cleanBaseUrl}/${cleanEndpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  let token: string | null = null;
  if (auth) {
    token = await getToken();
  }

  log(`📡 ${method} ${url}${auth ? ' 🔐' : ''}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...(Platform.OS !== 'web' && { cache: 'no-store' }),
    });

    // 🛡️ CORRECTION CRITIQUE : On lit le corps de la réponse UNE SEULE FOIS
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      log(`❌ Erreur API: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    try {
      return responseText ? JSON.parse(responseText) : null;
    } catch {
      return responseText;
    }

  } catch (error: any) {
    const isNetworkError = 
      error.message?.includes('Network request failed') || 
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('Load failed') ||
      error.message?.includes('NetworkError');

    // ✅ Retry automatique sur les requêtes de lecture (GET) pour absorber les micro-coupures
    if (method === 'GET' && isNetworkError && retryCount < 2) {
      const delay = (retryCount + 1) * 700;
      log(`⚠️ Micro-coupure détectée sur ${endpoint}. Réessai automatique (${retryCount + 1}/2) dans ${delay}ms...`);
      await wait(delay);
      return apiFetch(endpoint, options, auth, retryCount + 1);
    }

    if (isNetworkError) {
      const networkError = new Error(`Impossible de contacter le serveur (${cleanBaseUrl}). Vérifie ta connexion internet.`);
      log(`❌ Erreur réseau persistante: ${networkError.message}`);
      throw networkError;
    }
    throw error;
  }
};

// ============================================================
// 🚀 API OBJECT (avec support auth)
// ============================================================
export const api = {
  get: (endpoint: string, auth: boolean = false) => apiFetch(endpoint, { method: 'GET' }, auth),
  post: (endpoint: string, body: any, auth: boolean = false) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }, auth),
  put: (endpoint: string, body: any, auth: boolean = false) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }, auth),
  patch: (endpoint: string, body: any, auth: boolean = false) => apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) }, auth),
  delete: (endpoint: string, auth: boolean = false) => apiFetch(endpoint, { method: 'DELETE' }, auth),
  getToken,
  triggerGlobalRefresh,
  onGlobalRefresh,
};