// utils/platform.ts
import { Platform, Alert as NativeAlert, Linking } from 'react-native';

// ⚙️ CONFIG - À adapter selon votre environnement
export const LOCAL_PC_IP = '192.168.1.100'; // ← Remplacez par VOTRE IP locale réelle

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS !== 'web';

// 🪵 Logging utilitaire (désactivable en production)
const DEBUG = __DEV__;
export const log = (...args: any[]): void => {
  if (DEBUG) {
    console.log('[KemTchop]', ...args);
  }
};

// 🚨 Alertes cross-platform
export const showAlert = (
  title: string,
  message: string,
  buttons: Array<{ 
    text: string; 
    onPress?: () => void; 
    style?: 'default' | 'cancel' | 'destructive' 
  }> = []
): void => {
  if (isWeb) {
    if (buttons.length >= 2) {
      const result = window.confirm(`${title}\n\n${message}`);
      if (result && buttons[1]?.onPress) {
        setTimeout(() => buttons[1].onPress?.(), 10);
      } else if (!result && buttons[0]?.onPress) {
        setTimeout(() => buttons[0]?.onPress?.(), 10);
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      setTimeout(() => buttons[0]?.onPress?.(), 10);
    }
  } else {
    NativeAlert.alert(title, message, buttons);
  }
};

// 🔐 Vérification d'authentification
export const isAuthenticated = async (storage: any): Promise<boolean> => {
  try {
    const phone = await storage.getItem('user_phone');
    return !!(phone && typeof phone === 'string' && phone.length >= 8);
  } catch (error) {
    log('❌ Error checking authentication:', error);
    return false;
  }
};

// 🧭 Navigation helper avec gestion d'erreur
export const navigate = (
  router: any, 
  path: string, 
  params?: Record<string, any>
): void => {
  log('🧭 Navigate:', path, params);
  try {
    if (isWeb && params && Object.keys(params).length > 0) {
      router.push({ pathname: path, params });
    } else {
      router.push(path);
    }
  } catch (error) {
    log('❌ Navigation error:', error);
    if (isWeb && typeof window !== 'undefined') {
      window.location.href = path;
    }
  }
};

// 📱 Formatage numéro pour Campay (Cameroun - prefixe 237)
export const formatPhoneForCampay = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  
  const clean = phone.replace(/\D/g, '');
  
  // Déjà au format international
  if (clean.startsWith('237')) return clean;
  
  // Numéro local camerounais valide = 9 chiffres
  if (clean.length === 9) return `237${clean}`;
  
  // Fallback : retourner tel quel
  return clean;
};

// ✅ Validation helpers
export const isValidDate = (date: string): boolean => /^\d{2}\/\d{2}$/.test(date);
export const isValidTime = (time: string): boolean => /^\d{2}:\d{2}$/.test(time);

// ============================================================
// 🎯 URL & MEDIA HELPERS (CORRIGÉS ET SÉCURISÉS)
// ============================================================

export const isCloudinaryUrl = (url: any): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('res.cloudinary.com');
};

export const extractFilename = (url: any): string | null => {
  if (!url || typeof url !== 'string') return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename && filename.length > 0 ? filename : null;
};

export const isVideoFile = (path: any): boolean => {
  if (!path || typeof path !== 'string') return false;
  const lower = path.toLowerCase();
  return (
    lower.endsWith('.mp4') || 
    lower.endsWith('.webm') || 
    lower.endsWith('.mov') || 
    lower.includes('/video/') ||
    lower.includes('video/upload')
  );
};

// 🔄 Génère une URL média valide (Zéro crash garanti)
export const getMediaUrl = (path: any): string => {
  // 🔒 PROTECTION CRITIQUE : Rejeter toute valeur non-string ou vide
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return '';
  }

  // Cas 1: URL déjà sur Cloudinary
  if (isCloudinaryUrl(path)) {
    // ✅ Optimisation image QUE si ce n'est PAS une vidéo
    if (!isVideoFile(path) && !path.includes('?') && !path.includes('&')) {
      return `${path}?f_auto&q_auto`;
    }
    return path;
  }

  // Cas 2: URL absolue HTTP/HTTPS
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path.replace('http://', 'https://');
  }

  // Cas 3: Chemin relatif → construire l'URL complète du backend
  const cleanPath = path
    .replace(/^\/+/, '')                    
    .replace(/\/videos\/videos\//gi, '/videos/'); 

  const isProd = process.env.EXPO_PUBLIC_ENV === 'production';
  
  let baseUrl: string;
  if (isProd) {
    baseUrl = 'https://kemtchop-backend-production.up.railway.app';
  } else if (isWeb) {
    baseUrl = 'http://localhost:8000';
  } else if (Platform.OS === 'android' && !__DEV__) {
    // Émulateur Android pur en production (rare)
    baseUrl = 'http://10.0.2.2:8000';
  } else {
    // ✅ FIX: Utiliser LOCAL_PC_IP pour iOS/Android physiques en dev
    // Évite que l'app cherche localhost sur l'appareil lui-même
    baseUrl = __DEV__ ? `http://${LOCAL_PC_IP}:8000` : 'http://localhost:8000';
  }

  return `${baseUrl}/${cleanPath}`;
};

// 🔄 Helper pratique pour le dev local
export const getDevBackendUrl = (): string => {
  if (isWeb) return 'http://localhost:8000';
  if (Platform.OS === 'android') return `http://${LOCAL_PC_IP}:8000`;
  return `http://${LOCAL_PC_IP}:8000`;
};

// 🌐 Ouvre un lien externe de manière sécurisée
export const openLink = async (url: string): Promise<void> => {
  try {
    if (!url || typeof url !== 'string') return;
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else if (isWeb && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    log('❌ Error opening link:', error);
  }
};