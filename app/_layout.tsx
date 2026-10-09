import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { CartProvider } from "@/context/CartContext";
import OfflineBanner from "@/components/OfflineBanner";
import NotificationService from "@/services/notifications";
import { LanguageProvider } from "@/i18n/LanguageContext";

// Empêche la fermeture auto du splash pour charger les ressources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // 1. Splash
    SplashScreen.hideAsync().catch(() => {});

    // 2. Initialisation PWA sur Web (Manifest, icônes iOS, Service Worker)
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        if (!document.querySelector('link[rel="manifest"]')) {
          const link = document.createElement('link');
          link.rel = 'manifest';
          link.href = '/manifest.json';
          document.head.appendChild(link);
        }

        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
          const appleIcon = document.createElement('link');
          appleIcon.rel = 'apple-touch-icon';
          appleIcon.href = '/icon-192.png';
          document.head.appendChild(appleIcon);
        }

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js').then(
            (reg) => console.log('[PWA] Service Worker actif:', reg.scope),
            (err) => console.warn('[PWA] Service Worker erreur:', err)
          );
        }
      } catch (e) {
        console.warn('[PWA] Erreur setup PWA web:', e);
      }
    }

    // 3. Initialisation Push Notifications & écouteurs de statut de commandes
    let cleanupListeners: (() => void) | undefined;
    NotificationService.registerForPushNotifications().catch(() => {});
    NotificationService.initNotificationListeners()
      .then((cleanup) => {
        cleanupListeners = cleanup;
      })
      .catch(() => {});

    return () => {
      if (cleanupListeners) cleanupListeners();
    };
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <LanguageProvider>
        <CartProvider>
          <View style={styles.webContainer}>
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f8fafc" } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="reels"
                options={{
                  presentation: "modal",
                  headerShown: false,
                  contentStyle: { backgroundColor: "#000" },
                }}
              />
            </Stack>
          </View>
        </CartProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    backgroundColor: "#f8fafc",
  },
});
