import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { triggerGlobalRefresh } from '../../config/api';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showRestored, setShowRestored] = useState<boolean>(false);

  useEffect(() => {
    // 1. Écouteur NetInfo universel (iOS / Android / Web)
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline((prev) => {
        if (!prev && online) {
          // Reconnexion !
          setShowRestored(true);
          triggerGlobalRefresh();
          setTimeout(() => setShowRestored(false), 3500);
        }
        return online;
      });
    });

    // 2. Écouteurs natifs pour le Web / PWA (Safari, Chrome, Firefox)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebOnline = () => {
        setIsOnline(true);
        setShowRestored(true);
        triggerGlobalRefresh();
        setTimeout(() => setShowRestored(false), 3500);
      };

      const handleWebOffline = () => {
        setIsOnline(false);
        setShowRestored(false);
      };

      window.addEventListener('online', handleWebOnline);
      window.addEventListener('offline', handleWebOffline);

      return () => {
        unsubscribeNetInfo();
        window.removeEventListener('online', handleWebOnline);
        window.removeEventListener('offline', handleWebOffline);
      };
    }

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  if (!isOnline) {
    return (
      <View style={styles.offlineBanner}>
        <Text style={styles.offlineText}>
          ⚠️ Connexion interrompue • Mode hors-ligne actif (données en mémoire)
        </Text>
      </View>
    );
  }

  if (showRestored) {
    return (
      <View style={styles.restoredBanner}>
        <Text style={styles.restoredText}>
          ✅ Connexion rétablie • Données synchronisées
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#d97706',
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  offlineText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  restoredBanner: {
    backgroundColor: '#059669',
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  restoredText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
});
