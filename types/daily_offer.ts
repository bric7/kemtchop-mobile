// types/daily_offer.ts

export interface ProductSummary {
  id: number;
  name: string;
  image_url: string | null;
  category?: string;
}

export interface DailyOffer {
  id: string;
  product_id: number;
  product?: ProductSummary;
  target_date: string;
  minimum_threshold: number;
  max_capacity: number | null;
  price_per_unit: number;
  reserved_portions: number;
  current_revenue: number;
  status: string; // ex: "PROPOSED", "CONFIRMED", "PREPARING"
  bonus_description: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  triggered_at: string | null;
  
  // Propriétés calculées côté backend (très utile pour le frontend)
  is_threshold_reached: boolean;
  remaining_to_trigger: number;
  remaining_capacity: number;
  progress_percentage: number;
}