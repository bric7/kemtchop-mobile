// app/hooks/useOfflineAwareFetch.ts
import { useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { OfflineQueue } from "../services/offlineQueue";
import { log } from "../utils/platform";

export const useOfflineAwareFetch = () => {
  const fetchWithOfflineSupport = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {},
      priority: 'high' | 'normal' | 'low' = 'normal'
    ) => {
      const netState = await NetInfo.fetch();
      const isConnected = netState.isConnected;

      if (!isConnected) {
        log('[useOfflineAwareFetch] Mode offline, mise en queue:', endpoint);
        await OfflineQueue.getInstance().enqueue({
          endpoint,
          method: (options.method as any) || 'POST',
          payload: options.body ? JSON.parse(options.body as string) : undefined,
          priority,
        });
        
        throw new Error('OFFLINE_QUEUED');
      }

      try {
        const response = await fetch(endpoint, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        log('[useOfflineAwareFetch] Erreur fetch:', error);
        throw error;
      }
    },
    []
  );

  return { fetchWithOfflineSupport };
};

export default useOfflineAwareFetch;
