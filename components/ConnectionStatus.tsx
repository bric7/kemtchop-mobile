// app/components/ConnectionStatus.tsx
import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { OfflineQueue } from '../../services/offlineQueue';
import { log } from '../../utils/platform';

// ============================================================
// 📋 TYPES
// ============================================================
interface ConnectionStatusProps {
  /** Délai de polling pour vérifier la queue offline (ms) */
  pollInterval?: number;
  /** Callback optionnel quand l'état de connexion change */
  onConnectionChange?: (isOnline: boolean) => void;
}

// ============================================================
// 📡 COMPOSANT CONNECTION STATUS (mémoïsé pour performance)
// ============================================================
export const ConnectionStatus = memo(function ConnectionStatus({
  pollInterval = 5000,
  onConnectionChange,
}: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // ✅ Mise à jour optimisée du compteur de queue (évite les re-renders inutiles)
  const updatePendingCount = useCallback(() => {
    const count = OfflineQueue.getInstance().getQueueLength();
    // Ne mettre à jour que si la valeur a changé
    setPendingCount(prev => prev !== count ? count : prev);
  }, []);

  // ============================================================
  // 🔄 GESTION DE LA CONNEXION RÉSEAU
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    const handleConnectionChange = async (state: NetInfoState) => {
      const connected = state.isConnected ?? state.isInternetReachable ?? true;
      
      if (isMounted) {
        setIsOnline(connected);
        log(`📡 Connexion: ${connected ? 'ONLINE' : 'OFFLINE'}`);
        
        // Callback optionnel pour le parent
        onConnectionChange?.(connected);
        
        // Accessibilité : annoncer le changement d'état
        if (Platform.OS !== 'web') {
          AccessibilityInfo.announceForAccessibility(
            connected ? 'Connexion rétablie' : 'Connexion perdue'
          );
        }
        
        // Si on repasse en ligne → tenter une synchronisation immédiate
        if (connected) {
          try {
            const synced = await OfflineQueue.getInstance().sync();
            if (synced > 0) {
              setLastSyncTime(new Date());
              log(`✅ ${synced} actions synchronisées`);
            }
            updatePendingCount();
          } catch (e) {
            log("⚠️ Erreur sync offline:", e);
          }
        }
      }
    };

    // État initial
    NetInfo.fetch().then(handleConnectionChange).catch(e => {
      log("⚠️ Erreur fetch NetInfo:", e);
      setIsOnline(true); // Fallback optimiste
    });

    // Listener pour changements futurs
    const unsubscribe = NetInfo.addEventListener(handleConnectionChange);

    // Polling pour la queue offline (seulement si offline ou items en attente)
    const interval = setInterval(() => {
      if (!isOnline || pendingCount > 0) {
        updatePendingCount();
      }
    }, pollInterval);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [isOnline, pendingCount, pollInterval, onConnectionChange, updatePendingCount]);

  // ============================================================
  // 🎨 RENDU CONDITIONNEL (null si tout va bien)
  // ============================================================
  // Ne rien afficher si en ligne ET aucune action en attente
  if (isOnline && pendingCount === 0) {
    return null;
  }

  // Message dynamique selon l'état
  const getStatusMessage = () => {
    if (!isOnline) {
      return '📴 Hors ligne - Actions enregistrées localement';
    }
    if (pendingCount > 0) {
      const timeStr = lastSyncTime 
        ? ` (dernière sync: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
        : '';
      return `📡 Synchronisation... ${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente${timeStr}`;
    }
    return null;
  };

  const message = getStatusMessage();
  if (!message) return null;

  return (
    <View 
      style={[
        styles.container,
        { backgroundColor: isOnline ? styles.colors.successBg : styles.colors.errorBg }
      ]}
      accessibilityRole="status"
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
    >
      <Text style={[
        styles.text,
        { color: isOnline ? styles.colors.successText : styles.colors.errorText }
      ]}>
        {message}
      </Text>
    </View>
  );
});

// ============================================================
// 🎨 STYLES (avec variables de couleurs centralisées)
// ============================================================
const styles = StyleSheet.create({
  colors: {
    successBg: '#dcfce7',    // vert clair
    successText: '#166534',  // vert foncé
    errorBg: '#fef2f2',      // rouge clair
    errorText: '#991b1b',    // rouge foncé
  },
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 0 : 40, // Évite la notch sur mobile
    left: 0,
    right: 0,
    padding: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

export default ConnectionStatus;