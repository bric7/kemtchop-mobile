// app/hooks/useHomeData.ts
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../config/api';
import { CollectivePot, CollectivePotStatus } from "../../types/collective_pot";

export function useHomeData() {
  const [collectivePots, setCollectivePots] = useState<CollectivePot[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [potsResponse, reelsResponse] = await Promise.allSettled([
        api.get('/campaigns/tomorrow', true),
        api.get('/reels/', true),
      ]);

      // ✅ Transformation des pots pour garantir la structure CollectivePot
      if (potsResponse.status === 'fulfilled') {
        const rawPots = potsResponse.value || [];
        const transformed: CollectivePot[] = rawPots.map((c: any) => ({
          ...c,
          // Mapping recipe → product si l'API retourne encore "recipe"
          product: c.product || c.recipe || {
            id: c.id,
            name: c.product_name || 'Plat inconnu',
            category: c.category || null,
            image_url: c.image_url || null,
          },
          is_funded: c.is_funded ?? false,
          status: c.status ?? CollectivePotStatus.ACTIVE,
          current_orders: c.current_orders ?? 0,
          minimum_orders: c.minimum_orders ?? 3,
          max_orders: c.max_orders ?? null,
          progress_percentage: c.progress_percentage ?? 0,
          remaining_to_fund: c.remaining_to_fund ?? (c.minimum_orders ?? 3),
          remaining_capacity: c.remaining_capacity ?? 0,
          remaining_amount: c.remaining_amount ?? 0,
          preorder_price: c.preorder_price ?? c.price ?? 0,
          live_price: c.live_price ?? c.price ?? 0,
          sponsor_pack_price: c.sponsor_pack_price ?? 0,
          discount_percentage: c.discount_percentage ?? 0,
          display_price: c.display_price ?? c.price ?? 0,
          target_date: c.target_date ?? '',
          bonus_description: c.bonus_description ?? null,
          is_active: c.is_active ?? true,
          funded_at: c.funded_at ?? null,
          created_at: c.created_at ?? new Date().toISOString(),
          updated_at: c.updated_at ?? null,
        }));
        setCollectivePots(transformed);
      }

      // Reels
      if (reelsResponse.status === 'fulfilled') {
        setReels(reelsResponse.value || []);
      } else {
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
    return url.startsWith('http') ? url : `${(api as any).BASE_URL || ''}${url}`;
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
    collectivePots,  // ✅ Renommé : campaigns → collectivePots
    loading,
    error,
    handleConfirmOrder,
    getMediaUrl,
    refreshData,
  };
}