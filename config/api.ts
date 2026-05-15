// config/api.ts
import { Platform } from "react-native";

export const API_CONFIG = {
  // ✅ Switch automatique : 127.0.0.1 pour l'USB, l'IP fixe pour le WiFi/Hotspot
  baseURL: __DEV__ 
    ? (Platform.OS === 'android' ? "http://10.250.73.113:8000" : "http://localhost:8000")
    : "https://tchopiol.fly.dev", 
  
  timeout: 15000, // Réduit à 15s (30s c'est trop long pour un utilisateur mobile)
  headers: {
    "Content-Type": "application/json",
  },
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Sécurité pour éviter les doubles slashes (ex: //reels)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_CONFIG.baseURL}${cleanEndpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur serveur (${response.status})`);
    }
    
    return await response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Délai d'attente dépassé. Vérifie ta connexion 4G.");
    }
    
    // Message dynamique pour t'aider au debug sans modifier le code à chaque fois
    if (error.message.includes("Network request failed")) {
      throw new Error(`Serveur injoignable sur ${API_CONFIG.baseURL}. Vérifie que FastAPI tourne !`);
    }
    throw error;
  }
};