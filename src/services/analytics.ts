// src/services/analytics.ts
import { Platform } from 'react-native';

// ✅ API_BASE : 10.0.2.2 pour Android emulator, localhost pour Web/iOS
const API_BASE = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8000'  // Android emulator → localhost du PC
  : 'http://localhost:8000'; // Web/iOS → localhost direct

export type EventType = 
  | 'video_view'        // 👁️ Utilisateur a cliqué sur une vidéo
  | 'product_view'      // 👀 Utilisateur a vu un produit
  | 'add_to_cart'       // 🛒 Ajout au panier
  | 'checkout_start'    // 💳 Début du processus de commande
  | 'checkout_abandon'  // ❌ Abandon de panier (avant paiement)
  | 'order_completed'   // ✅ Commande finalisée
  | 'affiliate_click'   // 🔗 Clic sur lien affilié
  | 'search';           // 🔍 Recherche effectuée

export interface AnalyticsEvent {
  phone: string;                    // Identifiant unique de l'utilisateur
  event_type: EventType;           // Type d'événement
  product_id?: number;             // ID du produit concerné (optionnel)
  product_name?: string;           // Nom du produit (pour logs)
  video_id?: number;               // ID de la vidéo (optionnel)
  cart_value?: number;             // Valeur du panier (pour abandon)
  affiliate_code?: string;         // Code affilié source (optionnel)
  // ✅ RENOMMÉ : metadata → event_metadata (car 'metadata' est réservé dans SQLAlchemy)
  event_metadata?: Record<string, any>;  // Données supplémentaires (ex: durée de vue)
}

export const trackEvent = async (event: AnalyticsEvent): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        // ✅ S'assurer que event_metadata est bien envoyé (même si vide)
        event_metadata: event.event_metadata || {}
      }),
    });
    return response.ok;
  } catch (error) {
    console.log('⚠️ Analytics non envoyé (offline ou erreur):', error);
    // Optionnel : stocker en local pour retry plus tard
    return false;
  }
};

// ✅ Helpers pratiques pour simplifier l'usage
// Tous utilisent event_metadata (pas metadata)
export const Analytics = {
  videoView: (phone: string, videoId: number, videoTitle: string) =>
    trackEvent({ 
      phone, 
      event_type: 'video_view', 
      video_id: videoId, 
      event_metadata: { title: videoTitle }  // ✅ event_metadata
    }),
    
  productView: (phone: string, productId: number, productName: string, price: number) =>
    trackEvent({ 
      phone, 
      event_type: 'product_view', 
      product_id: productId, 
      product_name: productName, 
      event_metadata: { price }  // ✅ event_metadata
    }),
    
  addToCart: (phone: string, productId: number, productName: string, price: number, quantity: number) =>
    trackEvent({ 
      phone, 
      event_type: 'add_to_cart', 
      product_id: productId, 
      product_name: productName, 
      event_metadata: { price, quantity }  // ✅ event_metadata
    }),
    
  checkoutStart: (phone: string, cartValue: number, itemsCount: number) =>
    trackEvent({ 
      phone, 
      event_type: 'checkout_start', 
      event_metadata: { cart_value: cartValue, items_count: itemsCount }  // ✅ event_metadata
    }),
    
  checkoutAbandon: (phone: string, cartValue: number, lastProduct?: string) =>
    trackEvent({ 
      phone, 
      event_type: 'checkout_abandon', 
      event_metadata: { cart_value: cartValue, last_product: lastProduct }  // ✅ event_metadata
    }),
    
  orderCompleted: (phone: string, orderId: number, total: number) =>
    trackEvent({ 
      phone, 
      event_type: 'order_completed', 
      event_metadata: { order_id: orderId, total }  // ✅ event_metadata
    }),
    
  affiliateClick: (phone: string, affiliateCode: string, targetProduct?: string) =>
    trackEvent({
      phone,
      event_type: 'affiliate_click',
      affiliate_code: affiliateCode,
      event_metadata: { target_product: targetProduct }  // ✅ event_metadata
    }),
    
  search: (phone: string, query: string, resultsCount?: number) =>
    trackEvent({
      phone,
      event_type: 'search',
      event_metadata: { query, results_count: resultsCount }  // ✅ event_metadata
    }),
};

// ============================================================
// 👁️ HELPERS MICROSOFT CLARITY (SÉCURITÉ & DONNÉES ANONYMISÉES)
// ============================================================

/**
 * Identifie l'utilisateur de manière opaque dans Clarity.
 * N'envoie JAMAIS le numéro de téléphone direct en clair.
 * Utilise un identifiant opaque `user_<id>` ou `anon_<id>`.
 */
export const identifyUserClarity = (userId?: number | string, anonId?: string): void => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).clarity) {
    try {
      const customId = userId ? `user_${userId}` : (anonId ? `anon_${anonId}` : undefined);
      if (customId) {
        (window as any).clarity('identify', customId);
      }
    } catch (err) {
      console.warn('⚠️ [Clarity] Erreur identify:', err);
    }
  }
};

/**
 * Associe des tags personnalisés (ex: page, catégorie) sans données sensibles.
 */
export const tagClarityEvent = (key: string, value: string): void => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).clarity) {
    try {
      (window as any).clarity('set', key, value);
    } catch (err) {
      console.warn('⚠️ [Clarity] Erreur tag:', err);
    }
  }
};