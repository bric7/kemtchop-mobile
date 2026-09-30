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
// 🌐 FETCH CENTRALISÉ
// ============================================================
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  auth: boolean = false
): Promise<any> => {
  const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${cleanBaseUrl}/${cleanEndpoint}`;

  let token: string | null = null;
  if (auth) {
    token = await getToken();
  }

  log(`📡 ${options.method || 'GET'} ${url}${auth ? ' 🔐' : ''}`);

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
        // On tente de parser le texte en JSON pour extraire le message d'erreur du backend
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Si ce n'est pas du JSON, on garde le texte brut
        errorMessage = responseText || errorMessage;
      }
      log(`❌ Erreur API: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Si la requête est réussie, on tente de retourner un objet JSON, sinon le texte brut
    try {
      return responseText ? JSON.parse(responseText) : null;
    } catch {
      return responseText;
    }

  } catch (error: any) {
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('Load failed')) {
      const networkError = new Error(`Impossible de contacter le serveur (${cleanBaseUrl}). Vérifie ta connexion internet.`);
      log(`❌ Erreur réseau: ${networkError.message}`);
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
};