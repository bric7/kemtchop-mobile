import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Audio } from 'expo-av';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  View,
  Platform,
} from "react-native";
import { ChevronUp, ChevronDown } from "lucide-react-native";
import OrderModal from "@/components/OrderModal";
import ReelItem from "@/components/ReelItem";
import { api } from "../config/api";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ... (interfaces)

export default function ReelsScreen() {
  const { startId } = useLocalSearchParams();
  const router = useRouter();

  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reelHeight, setReelHeight] = useState(SCREEN_HEIGHT);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });
  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveId(viewableItems[0].item.id);
    }
  });

  const onContainerLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0) {
      setReelHeight(height);
    }
  };

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.error("Erreur config Audio:", e);
      }
    };
    setupAudio();
  }, []);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await api.get("/reels/", true);
        const reelsList: Reel[] = data || [];

        setReels(reelsList);

        if (startId && reelsList.length > 0) {
          const startIdStr = String(startId);
          const index = reelsList.findIndex(
            (r) => String(r.id) === startIdStr
          );
          if (index !== -1) {
            setActiveId(reelsList[index].id);
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index, animated: false });
            }, 100);
          }
        } else if (reelsList.length > 0) {
          setActiveId(reelsList[0].id);
        }
      } catch (err: any) {
        console.error("[Reels] Erreur chargement:", err);
        setError("Impossible de charger les reels");
        setReels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, [startId]);

  const currentIndex = Math.max(0, reels.findIndex((r) => r.id === activeId));

  const goToNext = useCallback(() => {
    if (reels.length <= 1) return;
    const currentIdx = reels.findIndex((r) => r.id === activeId);
    const nextIdx = currentIdx < reels.length - 1 ? currentIdx + 1 : 0;
    const nextItem = reels[nextIdx];
    if (nextItem) {
      setActiveId(nextItem.id);
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
    }
  }, [activeId, reels]);

  const goToPrev = useCallback(() => {
    if (reels.length <= 1) return;
    const currentIdx = reels.findIndex((r) => r.id === activeId);
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : reels.length - 1;
    const prevItem = reels[prevIdx];
    if (prevItem) {
      setActiveId(prevItem.id);
      flatListRef.current?.scrollToIndex({ index: prevIdx, animated: true });
    }
  }, [activeId, reels]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: any) => {
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') {
          e.preventDefault();
          goToNext();
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
          e.preventDefault();
          goToPrev();
        }
      };

      let lastWheelTime = 0;
      const handleWheel = (e: any) => {
        const now = Date.now();
        if (now - lastWheelTime < 450) return;
        if (e.deltaY > 25) {
          lastWheelTime = now;
          goToNext();
        } else if (e.deltaY < -25) {
          lastWheelTime = now;
          goToPrev();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('wheel', handleWheel, { passive: true });
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('wheel', handleWheel);
      };
    }
  }, [goToNext, goToPrev]);

  // Mode sombre global sur le Web pendant l'affichage des Reels (style cinéma / TikTok)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const prevBg = document.body.style.backgroundColor;
      document.body.style.backgroundColor = '#000';
      return () => {
        document.body.style.backgroundColor = prevBg;
      };
    }
  }, []);

  // ✅ LOGIQUE MÉTIER BASÉE SUR reel_category
  const onPressOrder = useCallback((item: Reel | any) => {
    const rawSides = item.sides || item.product?.complements || ["Riz", "Plantain", "Bâton de manioc"];
    const sidesStr = Array.isArray(rawSides) ? rawSides.join(", ") : String(rawSides);
    const category = item.reel_category || (item.is_catalogue ? "CATALOG_PRODUCT" : "DAILY_MENU");

    if (category === "CATALOG_PRODUCT") {
      // 3. PRODUIT CATALOGUE -> Modal de commande simple
      setSelectedItem({
        id: item.product?.id || item.id,
        isCatalogueProduct: true,
        sides: sidesStr,
        name: item.product?.name || item.title || "Plat KemTchop",
        image_url: item.product?.image_url || item.image_url,
        price: item.price_per_unit || 2500,
        complements: sidesStr
      });
      setModalVisible(true);
      return;
    }

    if (category === "DAILY_MENU") {
      // 1. MENU DU JOUR -> Modal avec créneaux horaires, sans sélecteur de date
      setSelectedItem({
        id: item.daily_offer_id || item.id,
        isCatalogueProduct: false, // Masque le sélecteur de date
        sides: sidesStr,
        offerDate: item.target_date || item.offer_date,
        target_date: item.target_date || item.offer_date,
        product: {
          id: item.product?.id,
          name: item.product?.name || item.title || "Plat KemTchop",
          image_url: item.product?.image_url || item.image_url,
          complements: sidesStr
        },
        status: item.status,
        is_threshold_reached: item.is_threshold_reached,
        price_per_unit: item.price_per_unit || 2500,
        reserved_portions: item.reserved_portions || 0,
        minimum_threshold: item.minimum_threshold || 4
      });
      setModalVisible(true);
      return;
    }

    if (category === "FUTURE_RESERVATION") {
      // 2. RÉSERVATION FUTURE -> Modal avec sélecteur de date future
      setSelectedItem({
        id: item.product?.id || item.daily_offer_id || item.id,
        isCatalogueProduct: true, // Permet le choix de la date
        sides: sidesStr,
        name: item.product?.name || item.title || "Plat KemTchop",
        image_url: item.product?.image_url || item.image_url,
        price: item.price_per_unit || 2500,
        complements: sidesStr,
        target_date: item.target_date || item.offer_date
      });
      setModalVisible(true);
      return;
    }

    // Fallback par défaut
    setSelectedItem({
      id: item.id,
      isCatalogueProduct: true,
      sides: sidesStr,
      name: item.product?.name || item.title || "Plat KemTchop",
      price_per_unit: item.price_per_unit || 2500
    });
    setModalVisible(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedItem(null);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#E31C25" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            api.get("/reels/", true).then((data) => {
              setReels(data || []);
              setLoading(false);
            }).catch(() => {
              setError("Impossible de charger les reels");
              setLoading(false);
            });
          }}
        >
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.backTextSmall}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>🎬 Aucun reel disponible</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.backTextSmall}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer} onLayout={onContainerLayout}>
      <StatusBar hidden />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden={!activeId}
      >
        <Text style={styles.backText}>✕</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        style={styles.flatList}
        data={reels}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled={true}
        snapToInterval={reelHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        onMomentumScrollEnd={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const index = Math.round(y / (reelHeight || 1));
          if (reels[index] && reels[index].id !== activeId) {
            setActiveId(reels[index].id);
          }
        }}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.index * (reelHeight || SCREEN_HEIGHT),
            animated: true,
          });
        }}
        getItemLayout={(_, index) => ({
          length: reelHeight,
          offset: reelHeight * index,
          index,
        })}
        renderItem={({ item, index }) => {
          const activeIndex = reels.findIndex((r) => r.id === activeId);
          const isNext = index === activeIndex + 1;
          return (
            <ReelItem
              item={item}
              isActive={activeId === item.id}
              isNext={isNext}
              containerHeight={reelHeight}
              onPressOrder={() => onPressOrder(item)}
            />
          );
        }}
      />

      {/* 🧭 Contrôles de navigation Suivant / Précédent */}
      {reels.length > 1 && (
        <View style={styles.navControls}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={goToPrev}
            activeOpacity={0.7}
          >
            <ChevronUp size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.navIndicatorBadge}>
            <Text style={styles.navIndicatorText}>
              {currentIndex + 1}/{reels.length}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navButton}
            onPress={goToNext}
            activeOpacity={0.7}
          >
            <ChevronDown size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      {selectedItem && (
        <OrderModal
          visible={modalVisible}
          item={selectedItem}
          onClose={onCloseModal}
          onConfirm={() => {
            onCloseModal();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#000",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  flatList: {
    width: "100%",
    height: "100%",
  },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#E31C25",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  backTextSmall: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  backText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  navControls: {
    position: "absolute",
    right: 15,
    top: "40%",
    zIndex: 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 8,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  navIndicatorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  navIndicatorText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
});