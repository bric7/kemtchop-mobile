// types/collective_pot.ts
// 🏛️ Types pour l'architecture définitive KemTchop
// Product → Suggestion → CollectivePot → Production → Order

export interface RecipeSummary {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
}

// ============================================================
// 💡 SUGGESTION = Plat visible mais sans marmite active
// ============================================================
export interface Suggestion {
  id: string;
  product: RecipeSummary;
  suggested_date: string | null;
  interest_count: number;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// 🍲 COLLECTIVE POT = Marmite collective en financement
// ============================================================
export interface CollectivePot {
  id: string;
  product: RecipeSummary;
  recipe?: RecipeSummary;
  target_date: string;
  status: CollectivePotStatusType;

  // 🎯 Objectifs
  minimum_orders: number;
  max_orders: number | null;
  current_orders: number;
  current_revenue: number;

  // 💰 Pricing business
  preorder_price: number;       // Prix avant seuil (ex: 1500F)
  live_price: number;           // Prix après seuil (ex: 1200F)
  sponsor_pack_price: number;   // Prix pour financer toute la marmite
  discount_percentage: number;

  // 📊 Affichage dynamique
  display_price: number;
  progress_percentage: number;
  remaining_to_fund: number;    // Portions restantes avant lancement
  remaining_capacity: number;   // Places avant saturation
  remaining_amount: number;     // Montant restant (FCFA)

  // 🎁 Bonus
  bonus_description: string | null;

  // 🔄 État
  is_funded: boolean;
  is_active: boolean;
  funded_at: string | null;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// ✅ ENUM & HELPERS
// ============================================================
export const CollectivePotStatus = {
  ACTIVE: 'active',
  FUNDED: 'funded',
  COOKING: 'cooking',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type CollectivePotStatusType = typeof CollectivePotStatus[keyof typeof CollectivePotStatus];

// 🧠 Labels par statut
export const getCollectivePotStatusLabel = (status: CollectivePotStatusType): string => {
  const labels: Record<string, string> = {
    active: '🚀 À financer',
    funded: '✅ Production confirmée',
    cooking: '🔥 Cuisson en cours',
    delivering: '📦 En livraison',
    delivered: '✔ Livré',
    cancelled: '❌ Annulée',
    expired: '⏰ Expirée',
  };
  return labels[status] || status;
};

// 🎨 Couleurs par statut
export const getCollectivePotStatusColor = (status: CollectivePotStatusType): string => {
  const colors: Record<string, string> = {
    active: '#F39C12',
    funded: '#27AE60',
    cooking: '#E67E22',
    delivering: '#3498DB',
    delivered: '#64748b',
    cancelled: '#E74C3C',
    expired: '#95A5A6',
  };
  return colors[status] || '#64748b';
};

// 🔤 Icônes par statut
export const getCollectivePotStatusIcon = (status: CollectivePotStatusType): string => {
  const icons: Record<string, string> = {
    active: '🚀',
    funded: '✅',
    cooking: '🔥',
    delivering: '📦',
    delivered: '✔',
    cancelled: '🔴',
    expired: '⏰',
  };
  return icons[status] || '🍲';
};

// ⚡ Alias de compatibilité (pour migration progressive)
/** @deprecated Utiliser CollectivePot à la place */
export type Campaign = CollectivePot;
/** @deprecated Utiliser CollectivePotStatus à la place */
export const CampaignStatus = CollectivePotStatus;
/** @deprecated Utiliser CollectivePotStatusType à la place */
export type CampaignStatusType = CollectivePotStatusType;