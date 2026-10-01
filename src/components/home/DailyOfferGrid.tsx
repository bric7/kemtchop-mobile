import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// ✅ Interface élargie pour accepter à la fois les offres et les produits du catalogue
interface DailyOfferItem {
  id: string | number;
  name?: string; // Pour le catalogue
  product?: {
    name: string;
    image_url?: string;
    category?: string;
    complements?: string;
  };
  target_date?: string; // ✅ RENDU OPTIONNEL
  status: string;
  reserved_portions?: number;
  minimum_threshold?: number;
  max_capacity?: number;
  price_per_unit?: number;
  price?: number; // Pour le catalogue
  is_threshold_reached?: boolean;
  remaining_to_trigger?: number;
  remaining_capacity?: number;
  progress_percentage?: number;
  isCatalogueProduct?: boolean; // ✅ NOUVEAU FLAG
}

interface DailyOfferGridProps {
  offers: DailyOfferItem[];
  loading: boolean;
  error: string | null;
  onOrder: (offer: DailyOfferItem) => void;
  onRefresh: () => void;
  searchQuery?: string;
  getMediaUrl: (url: string | null | undefined) => string;
  renderCustomHeader?: React.ReactElement | null;
}

// ✅ Fonction utilitaire pour formater la date de manière sécurisée
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString + "T00:00:00"); // Force l'heure locale pour éviter les décalages UTC
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  } catch (e) {
    return "Date invalide";
  }
};

// ✅ Déterminer si c'est le Menu du Jour (production confirmée)
const isMenuDuJour = (item: DailyOfferItem) => {
  return ['confirmed', 'cooking', 'ready', 'delivering', 'delivered', 'completed'].includes(
    item.status?.toLowerCase()
  );
};

export default function DailyOfferGrid({
  offers,
  loading,
  error,
  onOrder,
  onRefresh,
  searchQuery = '',
  getMediaUrl,
  renderCustomHeader,
}: DailyOfferGridProps) {
  
  // Filtrer par recherche
  const filteredOffers = offers.filter((item) => {
    if (!searchQuery) return true;
    const productName = (item.product?.name || item.name || '').toLowerCase();
    return productName.includes(searchQuery.toLowerCase());
  });

  const renderOfferCard = ({ item, index }: { item: DailyOfferItem; index: number }) => {
    const confirmed = isMenuDuJour(item);
    const rawImage = item.product?.image_url || (item as any).image_url;
    const imageUrl = getMediaUrl(rawImage);
    
    // Valeurs par défaut sécurisées pour le catalogue
    const price = Number(item.price_per_unit || item.price) || 2500;
    const portions = Number(item.reserved_portions) || 0;
    const threshold = Number(item.minimum_threshold) || 4;
    const capacity = Number(item.max_capacity) || 20;
    const isSoldOut = confirmed && portions >= capacity;
    const remaining = item.remaining_to_trigger !== undefined 
      ? Number(item.remaining_to_trigger) 
      : Math.max(0, threshold - portions);
    const progress = Number(item.progress_percentage) || 0;

    return (
      <TouchableOpacity
        style={[styles.card, isSoldOut && { opacity: 0.75 }]}
        onPress={() => !isSoldOut && onOrder(item)}
        activeOpacity={isSoldOut ? 1 : 0.92}
      >
        {/* Image du plat */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image} 
            contentFit="cover" 
            transition={150}
            cachePolicy="memory-disk"
            priority={index < 2 ? "high" : "low"}
          />
          
          {/* Badge statut flottant */}
          <View style={[
            styles.floatingBadge, 
            isSoldOut ? { backgroundColor: '#64748b' } : (confirmed ? styles.badgeConfirmed : styles.badgePending)
          ]}>
            <Text style={styles.floatingBadgeText}>
              {isSoldOut ? '⛔ COMPLET' : (confirmed ? '🟢 CONFIRMÉ' : '🔥 RÉSERVATION')}
            </Text>
          </View>

          {/* Tag de portion en haut à droite */}
          <View style={styles.portionBadge}>
            <Text style={styles.portionBadgeText}>
              {confirmed ? `${portions}/${capacity} vendues` : `${portions}/${threshold} portions`}
            </Text>
          </View>
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          {/* Nom du plat */}
          <Text style={styles.productName} numberOfLines={1}>
            {item.product?.name || item.name || 'Plat du jour'}
          </Text>

          {/* Date de livraison prévue si réservation */}
          {!item.isCatalogueProduct && item.target_date && (
            <Text style={styles.targetDate}>
              📅 {formatDate(item.target_date)}
            </Text>
          )}

          {/* Statut et progression */}
          <View style={styles.progressContainer}>
            {confirmed ? (
              // ✅ PRODUCTION CONFIRMÉE : Afficher disponibilité
              <View style={[styles.confirmedBox, isSoldOut && { backgroundColor: '#fef2f2' }]}>
                <Ionicons 
                  name={isSoldOut ? "close-circle" : "checkmark-circle"} 
                  size={14} 
                  color={isSoldOut ? "#ef4444" : "#10B981"} 
                />
                <Text style={[styles.confirmedLabel, isSoldOut && { color: "#dc2626" }]}>
                  {isSoldOut ? 'Vente fermée (Capacité atteinte)' : `Garanti • Reste ${capacity - portions} portions`}
                </Text>
              </View>
            ) : (
              // ✅ EN RÉSERVATION : Afficher progression vers le seuil
              <View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(progress, 100)}%` }
                    ]} 
                  />
                </View>
                <View style={styles.progressRow}>
                  <Text style={styles.thresholdText}>
                    Seuil : {threshold} portions
                  </Text>
                  <Text style={styles.remainingText}>
                    {remaining <= 0 ? '🎉 Seuil garanti !' : `Encore ${remaining} pour valider`}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Ligne de Prix */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix portion</Text>
            <Text style={styles.price}>
              {price.toLocaleString('fr-FR')} F
            </Text>
          </View>
          
          {/* 🔘 VRAI GRAND BOUTON D'ACTION VISIBLE & TACTILE */}
          <TouchableOpacity 
            style={[
              styles.bigActionButton, 
              isSoldOut 
                ? { backgroundColor: '#94a3b8' } 
                : (confirmed ? styles.bigButtonConfirmed : styles.bigButtonPending)
            ]}
            onPress={() => !isSoldOut && onOrder(item)}
            activeOpacity={isSoldOut ? 1 : 0.8}
            disabled={isSoldOut}
          >
            <Ionicons 
              name={isSoldOut ? "ban" : (confirmed ? "cart" : "flame")} 
              size={15} 
              color="#ffffff" 
              style={{ marginRight: 6 }} 
            />
            <Text style={styles.bigActionButtonText}>
              {isSoldOut ? 'COMPLET' : (confirmed ? 'COMMANDER' : 'RÉSERVER')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredOffers}
      keyExtractor={(item, index) => String(item.id) + index}
      renderItem={renderOfferCard}
      numColumns={2}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={renderCustomHeader}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#F59E0B" />
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#E31C25" style={{ marginVertical: 30 }} />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Aucun plat disponible</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#f8fafc',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  floatingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  floatingBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  badgePending: {
    backgroundColor: '#E31C25',
  },
  badgeConfirmed: {
    backgroundColor: '#10B981',
  },
  portionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  portionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  targetDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  progressContainer: {
    marginVertical: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  remainingText: {
    fontSize: 10,
    color: '#E31C25',
    fontWeight: '700',
  },
  confirmedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confirmedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  bigActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  bigButtonPending: {
    backgroundColor: '#E31C25',
  },
  bigButtonConfirmed: {
    backgroundColor: '#059669',
  },
  bigActionButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
  },
});