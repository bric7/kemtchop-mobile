// app/components/CampaignCard.tsx
// 🍲 Carte Vivante KemTchop - Cycle complet de la marmite
import React, { memo } from 'react';
import { safeFormatNumber } from '@/utils/format';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Campaign } from '../../types/collective_pot';

interface CampaignCardProps {
  campaign: Campaign;
  onPress?: () => void;
}

// 🎯 États visuels dynamiques de la marmite
type MarmiteState = 'to_fund' | 'funded' | 'cooking' | 'delivering' | 'delivered';

const getMarmiteState = (campaign: Campaign): MarmiteState => {
  // Ordre de priorité : livré > en livraison > cuisson > financé > à financer
  if ((campaign as any).status === 'delivered') return 'delivered';
  if ((campaign as any).status === 'delivering') return 'delivering';
  if ((campaign as any).status === 'cooking') return 'cooking';
  if (campaign.is_funded) return 'funded';
  return 'to_fund';
};

// 🎨 Configuration visuelle par état
const stateConfig = {
  to_fund: {
    badge: '🚀 À financer',
    badgeColor: '#F39C12',
    buttonLabel: 'Financer cette marmite',
    buttonColor: '#F39C12',
    buttonBg: '#fef3c7',
    iconName: 'flash-outline' as const,
    priceLabel: 'Prix précommande',
  },
  funded: {
    badge: '✅ Production confirmée',
    badgeColor: '#27AE60',
    buttonLabel: 'Réserver ma portion',
    buttonColor: '#27AE60',
    buttonBg: '#f0fdf4',
    iconName: 'restaurant-outline' as const,
    priceLabel: 'Prix collectif débloqué',
  },
  cooking: {
    badge: '🔥 Cuisson en cours',
    badgeColor: '#E67E22',
    buttonLabel: 'Suivre la préparation',
    buttonColor: '#E67E22',
    buttonBg: '#fff7ed',
    iconName: 'flame-outline' as const,
    priceLabel: 'Prix collectif',
  },
  delivering: {
    badge: '📦 En livraison',
    badgeColor: '#3498DB',
    buttonLabel: 'Suivre la livraison',
    buttonColor: '#3498DB',
    buttonBg: '#eff6ff',
    iconName: 'bicycle-outline' as const,
    priceLabel: 'Prix collectif',
  },
  delivered: {
    badge: '✔ Livré',
    badgeColor: '#64748b',
    buttonLabel: 'Voir les détails',
    buttonColor: '#64748b',
    buttonBg: '#f8fafc',
    iconName: 'checkmark-circle-outline' as const,
    priceLabel: 'Prix collectif',
  },
};

export const CampaignCard = memo(function CampaignCard({ campaign, onPress }: CampaignCardProps) {
  const state = getMarmiteState(campaign);
  const config = stateConfig[state];
  const item = campaign.recipe || campaign.product;
  const imageUrl = item?.image_url?.replace('http://', 'https://') || '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* 🖼️ Image + Badge d'état */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.fallback}>
            <Ionicons name="restaurant-outline" size={40} color="#cbd5e1" />
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: config.badgeColor }]}>
          <Text style={styles.badgeText}>{config.badge}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* 🍲 Nom du plat */}
        <Text style={styles.name} numberOfLines={2}>
          🍲 {item?.name || ''}
        </Text>

        {/* 📊 Barre de progression (masquée si livrée) */}
        {state !== 'delivered' && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {campaign.current_orders} / {campaign.minimum_orders} réservations
              </Text>
              <Text style={styles.progressPercent}>
                {Math.min(campaign.progress_percentage, 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                {
                  width: `${Math.min(campaign.progress_percentage, 100)}%`,
                  backgroundColor: config.badgeColor,
                },
              ]} />
            </View>

            {/* 💡 Message psychologique dynamique selon l'état */}
            {state === 'to_fund' && campaign.remaining_to_fund > 0 && (
              <Text style={styles.psychologicalText}>
                {campaign.remaining_to_fund === 1
                  ? '🔥 Plus qu\'une personne pour lancer !'
                  : `🔥 Encore ${campaign.remaining_to_fund} personnes`}
              </Text>
            )}
            {state === 'to_fund' && campaign.remaining_amount > 0 && (
              <Text style={styles.remainingAmountText}>
                Ou financez directement : <Text style={styles.remainingBold}>{safeFormatNumber(campaign.remaining_amount)} FCFA</Text>
              </Text>
            )}
            {state === 'funded' && (
              <Text style={styles.fundedText}>
                ✅ Prix collectif débloqué ! Réservez maintenant
              </Text>
            )}
            {state === 'cooking' && (
              <Text style={styles.cookingText}>
                👨‍🍳 Nos chefs préparent votre marmite avec amour
              </Text>
            )}
            {state === 'delivering' && (
              <Text style={styles.deliveringText}>
                🛵 Votre marmite est en route vers vous
              </Text>
            )}
          </View>
        )}

        {/* 💰 Prix + Date */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>{config.priceLabel}</Text>
            <Text style={styles.price}>
              {safeFormatNumber(campaign.display_price)} FCFA
            </Text>
          </View>
          <Text style={styles.date}>
            📅 {new Date(campaign.target_date).toLocaleDateString('fr-FR', {
              weekday: 'short', day: 'numeric', month: 'short',
            })}
          </Text>
        </View>

        {/* 🎁 Bonus */}
        {campaign.bonus_description && (
          <View style={styles.bonusBanner}>
            <Text style={styles.bonusText}>🎁 {campaign.bonus_description}</Text>
          </View>
        )}
      </View>

      {/* 🎯 Bouton d'action dynamique */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: config.buttonBg }]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Ionicons name={config.iconName} size={18} color={config.buttonColor} />
          <Text style={[styles.buttonText, { color: config.buttonColor }]}>
            {config.buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default CampaignCard;

// ============================================================
// 🎨 STYLES
// ============================================================
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    margin: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    }),
  },
  imageContainer: { height: 160, backgroundColor: '#f1f5f9', position: 'relative' },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, zIndex: 2,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { padding: 14 },
  name: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 },

  // Progression
  progressSection: { marginBottom: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  progressPercent: { fontSize: 12, fontWeight: '800', color: '#1e293b' },
  progressBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Messages psychologiques par état
  psychologicalText: { fontSize: 12, fontWeight: '700', color: '#F39C12', marginTop: 6 },
  remainingAmountText: { fontSize: 11, color: '#64748b', marginTop: 2 },
  remainingBold: { fontWeight: '700', color: '#F39C12' },
  fundedText: { fontSize: 12, fontWeight: '700', color: '#27AE60', marginTop: 6 },
  cookingText: { fontSize: 12, fontWeight: '600', color: '#E67E22', marginTop: 6 },
  deliveringText: { fontSize: 12, fontWeight: '600', color: '#3498DB', marginTop: 6 },

  // Prix
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  priceLabel: { fontSize: 10, color: '#64748b', marginBottom: 2 },
  price: { fontSize: 20, fontWeight: '800', color: '#27AE60' },
  date: { fontSize: 11, color: '#3498DB', fontWeight: '500' },

  // Bonus
  bonusBanner: { backgroundColor: '#fef3c7', padding: 6, borderRadius: 8, marginTop: 6 },
  bonusText: { fontSize: 11, color: '#92400e', fontWeight: '600' },

  // Footer & Bouton
  footer: { padding: 14, paddingTop: 0 },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 8,
  },
  buttonText: { fontSize: 14, fontWeight: '700' },
});