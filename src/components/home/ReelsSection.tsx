// app/components/home/ReelsSection.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar, ShoppingBag } from 'lucide-react-native';

export interface Reel {
  id: string | number;
  title?: string;
  image_url?: string;
  video_url?: string;
  button_label: string;
  urgency_message?: string;
  is_threshold_reached: boolean;
  product?: { id?: number; name: string; image_url: string; complements?: string };
  product_id?: number;
  daily_offer_id?: string | null;
  reel_category?: 'DAILY_MENU' | 'FUTURE_RESERVATION' | 'CATALOG_PRODUCT';
  offer_date?: string | null;
  target_date?: string | null;
  status?: string | null;
  price_per_unit?: number;
  price?: number;
  sides?: string[];
  is_catalogue?: boolean;
}

interface ReelsSectionProps {
  reels: Reel[];
  getMediaUrl: (url: string | null | undefined) => string;
  onOrder?: (offer: any) => void;
}

export default function ReelsSection({ reels, getMediaUrl, onOrder }: ReelsSectionProps) {
  const router = useRouter();
  const scrollRef = useRef<any>(null);
  const scrollContainerRef = useRef<any>(null);
  const [scrollX, setScrollX] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ORDER' | 'RESERVE'>('ALL');

  // Détection date d'aujourd'hui (format YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Déterminer avec rigueur si un reel est une commande du jour ou une réservation
  const isItemDailyToday = useCallback((item: Reel) => {
    const isCategoryDaily = item.reel_category === "DAILY_MENU";
    const isTargetToday = (item.target_date === todayStr || item.offer_date === todayStr);
    const hasDailyOffer = !!item.daily_offer_id;
    const isConfirmedStatus = ['confirmed', 'cooking', 'ready', 'delivering'].includes(String(item.status || '').toLowerCase());
    
    return (isCategoryDaily || isTargetToday || (hasDailyOffer && isConfirmedStatus)) && !item.is_catalogue;
  }, [todayStr]);

  // Plats classés
  const dailyReels = useMemo(() => reels.filter(isItemDailyToday), [reels, isItemDailyToday]);
  const reserveReels = useMemo(() => reels.filter(r => !isItemDailyToday(r)), [reels, isItemDailyToday]);

  const filteredReels = useMemo(() => {
    if (activeFilter === 'ORDER') return dailyReels;
    if (activeFilter === 'RESERVE') return reserveReels;
    return reels;
  }, [activeFilter, dailyReels, reserveReels, reels]);

  // Support molette horizontale fluide sur Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const containerNode = scrollContainerRef.current;
      if (!containerNode) return;

      const handleWheel = (e: any) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          containerNode.scrollLeft += e.deltaY * 1.2;
        }
      };

      containerNode.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        containerNode.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  if (!reels || reels.length === 0) return null;

  // Défilement par boutons chevrons
  const scrollByAmount = (direction: 'left' | 'right') => {
    const step = 260;
    const targetX = direction === 'left' ? Math.max(0, scrollX - step) : scrollX + step;
    scrollRef.current?.scrollTo({ x: targetX, animated: true });
    setScrollX(targetX);
  };

  // Clic sur la vignette pour ouvrir le Reel plein écran
  const handleOpenReel = (item: Reel) => {
    router.push({ pathname: "/reels", params: { startId: item.id } } as any);
  };

  // Clic direct sur le bouton "RÉSERVER" ou "COMMANDER"
  const handleActionPress = (e: any, item: Reel) => {
    e?.stopPropagation?.();
    if (!onOrder) {
      handleOpenReel(item);
      return;
    }

    const isToday = isItemDailyToday(item);
    const rawSides = item.sides || item.product?.complements || ["Riz", "Plantain", "Bâton de manioc"];
    const sidesStr = Array.isArray(rawSides) ? rawSides.join(", ") : String(rawSides);

    const formattedItem = {
      id: item.product?.id || item.product_id || item.id,
      isCatalogueProduct: !isToday,
      sides: sidesStr,
      complements: sidesStr,
      name: item.product?.name || item.title || "Plat KemTchop",
      price: item.price_per_unit || item.price || 2500,
      price_per_unit: item.price_per_unit || item.price || 2500,
      image_url: item.product?.image_url || item.image_url,
      product: {
        id: item.product?.id || item.product_id || item.id,
        name: item.product?.name || item.title || "Plat KemTchop",
        image_url: item.product?.image_url || item.image_url,
        complements: sidesStr,
      },
      offerDate: item.target_date || item.offer_date,
      target_date: item.target_date || item.offer_date,
      status: item.status,
      is_threshold_reached: item.is_threshold_reached,
    };

    onOrder(formattedItem);
  };

  return (
    <View style={styles.container}>
      {/* En-tête avec Titre et Flèches de navigation */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.sectionTitle}>🔥 suggestion des plats</Text>
          <Text style={styles.sectionSubtitle}>Faites défiler pour choisir votre plat</Text>
        </View>

        {/* Flèches de défilement horizontal (pratiques sur desktop et mobile) */}
        <View style={styles.arrowsWrapper}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => scrollByAmount('left')}
            activeOpacity={0.7}
            accessibilityLabel="Défiler vers la gauche"
          >
            <ChevronLeft size={18} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => scrollByAmount('right')}
            activeOpacity={0.7}
            accessibilityLabel="Défiler vers la droite"
          >
            <ChevronRight size={18} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtres de sélection rapide (Tout / À commander / À réserver) */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setActiveFilter('ALL')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}>
            🔥 Tout ({reels.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'ORDER' && styles.filterChipActive]}
          onPress={() => setActiveFilter('ORDER')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, activeFilter === 'ORDER' && styles.filterChipTextActive]}>
            🍲 À commander {dailyReels.length > 0 ? `(${dailyReels.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'RESERVE' && styles.filterChipActive]}
          onPress={() => setActiveFilter('RESERVE')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, activeFilter === 'RESERVE' && styles.filterChipTextActive]}>
            📅 À réserver ({reserveReels.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu : Liste de cartes ou état vide */}
      {filteredReels.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🍲</Text>
          <Text style={styles.emptyTitle}>Aucun plat en commande immédiate aujourd'hui</Text>
          <Text style={styles.emptyDesc}>
            Tous nos plats sont actuellement disponibles à la réservation pour les prochains jours !
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setActiveFilter('RESERVE')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>Voir les plats à réserver ({reserveReels.length})</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          ref={(ref: any) => {
            scrollRef.current = ref;
            if (ref && Platform.OS === 'web') {
              try {
                // @ts-ignore
                const node = ref.getScrollableNode ? ref.getScrollableNode() : (ref._subView || ref);
                scrollContainerRef.current = node;
              } catch {}
            }
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.reelsScroll}
          contentContainerStyle={{ paddingRight: 20 }}
          onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
        >
          {filteredReels.map((item) => {
            const isToday = isItemDailyToday(item);
            const coverUrl = getMediaUrl(item.image_url || item.product?.image_url);
            const hasVideo = !!item.video_url;
            const price = item.price_per_unit || item.price || 2500;
            const actionLabel = isToday ? "COMMANDER" : "RÉSERVER";

            return (
              <TouchableOpacity
                key={`reel-${item.id}`}
                style={styles.reelCard}
                onPress={() => handleOpenReel(item)}
                activeOpacity={0.92}
              >
                <Image
                  source={{ uri: coverUrl || "https://via.placeholder.com/150" }}
                  style={styles.reelMedia}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />

                {/* Badge Prix en haut à gauche */}
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>{price.toLocaleString('fr-FR')} F</Text>
                </View>

                {/* Badge Statut en haut à droite : À RÉSERVER ou MENU DU JOUR */}
                <View style={[styles.statusBadge, isToday ? styles.badgeConfirmed : styles.badgePending]}>
                  <Text style={[styles.badgeText, isToday && { color: '#fff' }]}>
                    {isToday ? "🍲 AUJOURD'HUI" : "🔥 À RÉSERVER"}
                  </Text>
                </View>

                {/* Icône Play centrale */}
                {hasVideo && (
                  <View style={styles.playIconOverlay} pointerEvents="none">
                    <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.95)" />
                  </View>
                )}

                {/* Overlay d'information en bas */}
                <View style={styles.overlay}>
                  <Text numberOfLines={1} style={styles.productName}>
                    {item.product?.name || item.title || "Plat KemTchop"}
                  </Text>

                  <Text numberOfLines={1} style={styles.urgencyText}>
                    {isToday
                      ? "✅ Production garantie aujourd'hui"
                      : "🔥 Disponible à la réservation"}
                  </Text>

                  {/* Bouton d'action directe : Réserver ou Commander */}
                  <TouchableOpacity
                    style={[styles.actionBtn, isToday ? styles.btnConfirmed : styles.btnPending]}
                    onPress={(e) => handleActionPress(e, item)}
                    activeOpacity={0.8}
                  >
                    {isToday ? (
                      <ShoppingBag size={14} color="#fff" />
                    ) : (
                      <Calendar size={14} color="#0f172a" />
                    )}
                    <Text
                      style={[
                        styles.actionBtnText,
                        isToday && { color: '#fff' }
                      ]}
                    >
                      {actionLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  titleWrapper: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  arrowsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  emptyCard: {
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  reelsScroll: {
    paddingLeft: 20,
  },
  reelCard: {
    width: 160,
    height: 240,
    marginRight: 14,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  reelMedia: {
    width: '100%',
    height: '100%',
  },
  priceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 3,
  },
  priceBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgePending: {
    backgroundColor: '#F59E0B',
  },
  badgeConfirmed: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0f172a',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  productName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  urgencyText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 10,
  },
  btnPending: {
    backgroundColor: '#F59E0B',
  },
  btnConfirmed: {
    backgroundColor: '#10B981',
  },
  actionBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900',
  },
});