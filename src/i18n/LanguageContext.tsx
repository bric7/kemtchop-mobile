// src/i18n/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Language, TranslationDictionary } from './types';
import { fr } from './translations/fr';
import { en } from './translations/en';

const STORAGE_KEY = 'kemtchop_language';

const translations: Record<Language, TranslationDictionary> = {
  fr,
  en,
};

// Détection de la langue initiale du téléphone / navigateur
const detectDeviceLanguage = (): Language => {
  try {
    let deviceLang = 'fr';
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      deviceLang = navigator.language || (navigator as any).userLanguage || 'fr';
    } else {
      const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
      if (intlLocale) deviceLang = intlLocale;
    }
    return deviceLang.toLowerCase().startsWith('en') ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
};

export type TranslateFunction = ((path: string, params?: Record<string, string | number>) => string) & TranslationDictionary;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: TranslateFunction;
  dict: TranslationDictionary;
  isEnglish: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'fr' || saved === 'en') {
          setLanguageState(saved);
        } else {
          // Si premier lancement, détecter la langue de l'appareil
          const detected = detectDeviceLanguage();
          setLanguageState(detected);
          await AsyncStorage.setItem(STORAGE_KEY, detected);
        }
      } catch (e) {
        console.warn('⚠️ Erreur lecture langue:', e);
      } finally {
        setIsReady(true);
      }
    };

    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang: Language) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
      console.log(`🌐 [KemTchop i18n] Langue changée vers : ${newLang.toUpperCase()}`);
    } catch (e) {
      console.warn('⚠️ Erreur sauvegarde langue:', e);
    }
  };

  const toggleLanguage = async () => {
    const nextLang: Language = language === 'fr' ? 'en' : 'fr';
    await setLanguage(nextLang);
  };

  /**
   * Helper t("section.cle", { count: 3 }) ou accès direct t.common.close
   */
  const dict = translations[language] || translations.fr;

  const tFn = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    let fallback: any = translations['fr'];

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        current = undefined;
      }

      if (fallback && fallback[key] !== undefined) {
        fallback = fallback[key];
      } else {
        fallback = undefined;
      }
    }

    let result = (typeof current === 'string' ? current : (typeof fallback === 'string' ? fallback : path));

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }

    return result;
  };

  const t = useMemo(() => {
    return Object.assign(tFn, dict) as TranslateFunction;
  }, [language, dict]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      dict,
      isEnglish: language === 'en',
    }),
    [language, t, dict]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback gracieux si utilisé hors provider
    const fallbackDict = translations.fr;
    const fallbackFn = (path: string) => path;
    const fallbackT = Object.assign(fallbackFn, fallbackDict) as TranslateFunction;
    return {
      language: 'fr',
      setLanguage: async () => {},
      toggleLanguage: async () => {},
      t: fallbackT,
      dict: fallbackDict,
      isEnglish: false,
    };
  }
  return context;
};

export default LanguageContext;
