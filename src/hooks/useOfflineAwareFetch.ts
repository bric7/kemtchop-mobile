// app/hooks/useOfflineAwareFetch.ts
// ?? Hook pour fetch avec gestion offline automatique
import { useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { OfflineQueue } from "../services/offlineQueue";
import { log, formatPhoneForWhatsApp, getApiUrl } from "../utils/platform";

export const useOfflineAwareFetch = () => {
  const fetchWithOfflineSupport = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {},
      priority: 'high' | 'medium' | 'low' = 'medium'
    ) => {
      // Vérifier la connexion réseau
      const netState = await NetInfo.fetch();
      const isConnected = netState.isConnected;

      if (!isConnected) {
        // Mode offline : mettre en queue
        log('[useOfflineAwareFetch] ?? Mode offline, mise en queue:', endpoint);
        await OfflineQueue.getInstance().enqueue({
          endpoint,
          method: options.method || 'GET',
          payload: options.body ? JSON.parse(options.body as string) : undefined,
          priority,
        });
        
        throw new Error('OFFLINE_QUEUED');
      }

      // Mode online : fetch normal
      try {
        const response = await fetch(endpoint, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        log('[useOfflineAwareFetch] ? Erreur fetch:', error);
        throw error;
      }
    },
    []
  );

  return { fetchWithOfflineSupport };
};

export default useOfflineAwareFetch;