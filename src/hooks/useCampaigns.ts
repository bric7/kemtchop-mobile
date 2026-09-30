// hooks/useCampaigns.ts
// 🎯 Hook pour récupérer les campaigns Kickstarter
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../config/api';
import { CollectivePot, CollectivePotStatus } from "../../types/collective_pot";

export function useCampaigns(dateFilter: 'tomorrow' | 'today' = 'tomorrow') {
  const [campaigns, setCampaigns] = useState<CollectivePot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = dateFilter === 'tomorrow' 
        ? '/campaigns/tomorrow' 
        : '/campaigns/today';
      
      const response = await api.get(endpoint, true);
      setCampaigns(response || []);
    } catch (err: any) {
      setError(err?.message || 'Erreur chargement campaigns');
      console.error('[useCampaigns]', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const refresh = useCallback(async () => {
    await fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    refresh,
  };
}

export default useCampaigns;