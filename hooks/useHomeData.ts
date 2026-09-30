// app/hooks/useHomeData.ts
import { useState, useCallback, useEffect } from 'react';
import { api } from '../config/api';
import { Campaign } from '../types/collective_pot';

export function useHomeData() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Appeler /campaigns/tomorrow au lieu de /daily-menu/tomorrow
      const campaignsResponse = await api.get('/campaigns/tomorrow', true);
      setCampaigns(campaignsResponse || []);
      
      // Garder les reels
      try {
        const reelsResponse = await api.get('/reels/', true);
        setReels(reelsResponse || []);
      } catch {
        setReels([]);
      }
    } catch (err: any) {
      console.error('[useHomeData]', err);
      setError(err?.message || 'Impossible de charger les marmites');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const getMediaUrl = useCallback((url: string | null) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${api.BASE_URL}${url}`;
  }, []);

  const handleConfirmOrder = useCallback(async (orderData: any, setModalVisible: (v: boolean) => void) => {
    setModalVisible(false);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    reels,
    campaigns,  // ✅ Retourne campaigns (pas dailyMenus)
    loading,
    error,
    handleConfirmOrder,
    getMediaUrl,
    refreshData,
  };
}