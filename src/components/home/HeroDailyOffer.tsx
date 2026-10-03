import React from 'react';
import { safeFormatNumber } from '@/utils/format';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface HeroOffer {
  id: string;
  product?: {
    name: string;
    image_url?: string;
  };
  image_url?: string;
  target_date: string;
  status: string;
  reserved_portions: number;
  minimum_threshold: number;
  max_capacity: number;
  price_per_unit: number;
  is_threshold_reached: boolean;
  remaining_to_trigger: number;
  progress_percentage: number;
}

interface HeroOfferCardProps {
  offer: HeroOffer;
  onOrder: (offer: HeroOffer) => void;
  getMediaUrl: (url: string | null | undefined) => string;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + "T00:00:00");
    if (isNaN(date.getTime())) {
      const d2 = new Date(dateString);
      if (isNaN(d2.getTime())) return String(dateString);
      return d2.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  } catch (e) {
    return String(dateString || '');
  }
};

export default function HeroOfferCard({ offer, onOrder, getMediaUrl }: HeroOfferCardProps) {
  if (!offer) return null;

  const confirmed = ['confirmed', 'cooking', 'ready', 'delivering', 'delivered'].includes(
    offer.status?.toLowerCase()
  );
  const rawImage = offer.product?.image_url || offer.image_url;
  const imageUrl = getMediaUrl(rawImage);
  const price = Number(offer.price_per_unit) || 2500;
  const progress = Number(offer.progress_percentage) || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onOrder(offer)}
      activeOpacity={0.9}
    >
      {/* Image de fond */}
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.backgroundImage} 
        contentFit="cover" 
        transition={200}
        cachePolicy="memory-disk"
      />
      
      {/* Overlay gradient */}
      <View style={styles.overlay} />

      {/* Contenu */}
      <View style={styles.content}>
        {/* Badge statut */}
        <View style={[styles.badge, confirmed ? styles.badgeConfirmed : styles.badgePending]}>
          <Text style={styles.badgeText}>
            {confirmed ? '✅ Production garantie' : '🔥 En réservation'}
          </Text>
        </View>

        {/* Nom du plat */}
        <Text style={styles.productName}>
          {offer.product?.name || 'Plat du jour'}
        </Text>

        {/* ✅ DATE EXPLICITE */}
        {offer.target_date && (
          <Text style={styles.targetDate}>
            📅 {formatDate(offer.target_date)}
          </Text>
        )}

        {/* Progression ou disponibilité */}
        {confirmed ? (
          <Text style={styles.confirmedInfo}>
            {offer.reserved_portions || 0}/{offer.max_capacity || 20} portions disponibles
          </Text>
        ) : (
          <>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(progress, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.thresholdInfo}>
              {offer.reserved_portions || 0}/{offer.minimum_threshold || 4} portions
            </Text>
            <Text style={styles.remainingInfo}>
              Encore {offer.remaining_to_trigger || 0} pour déclencher la production
            </Text>
          </>
        )}

        {/* Prix et bouton */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Prix par portion</Text>
            <Text style={styles.price}>
              {safeFormatNumber(price)} F
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.actionButton, confirmed ? styles.buttonConfirmed : styles.buttonPending]}
            onPress={() => onOrder(offer)}
            activeOpacity={0.85}
          >
            <Ionicons 
              name={confirmed ? "cart" : "flame"} 
              size={18} 
              color="#ffffff" 
              style={{ marginRight: 6 }} 
            />
            <Text style={styles.actionButtonText}>
              {confirmed ? 'COMMANDER' : 'RÉSERVER'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgePending: {
    backgroundColor: '#F59E0B',
  },
  badgeConfirmed: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  productName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  targetDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    opacity: 0.9,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  thresholdInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  remainingInfo: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 12,
  },
  confirmedInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonPending: {
    backgroundColor: '#E31C25',
  },
  buttonConfirmed: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});