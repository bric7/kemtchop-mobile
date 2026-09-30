// app/(tabs)/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HomeHeader from "@/components/home/HomeHeader";
import ReelsSection from "@/components/home/ReelsSection";
import HeroOfferCard from "@/components/home/HeroDailyOffer";
import ProductionFilterSection, { OfferDimension } from "@/components/home/ProductionFilterSection";
import OfferGrid from "@/components/home/DailyOfferGrid";
import OrderModal from "@/components/OrderModal";
import CitySelector from "@/components/CitySelector";

import { api } from "../../config/api";
import { showAlert, isAuthenticated, navigate } from "@/utils/platform";

// Type pour un produit du catalogue
export type CatalogueProduct = {
  id: number;
  name: string;
  category: string;
  image_url: string;
  price: number;
  complements: string;
  description: string;
  // Champs neutralisés pour la compatibilité avec OfferGrid
  isCatalogueProduct: boolean;
  status: string;
  target_date: undefined; // ✅ FORCÉ À UNDEFINED
  is_threshold_reached: boolean;
  remaining_to_trigger: number;
  reserved_portions: number;
  price_per_unit: number;
  progress_percentage: number;
  remaining_capacity: number;
  product: {
    id: number;
    name: string;
    image_url: string;
    category: string;
    complements: string;
  };
};

export type MappedOffer = {
  id: string;
  product?: any;
  status: string;
  is_threshold_reached: boolean;
  remaining_to_trigger: number;
  reserved_portions: number;
  price_per_unit: number;
  target_date?: string;
  progress_percentage: number;
  remaining_capacity: number;
  [key: string]: any;
};

const getBusinessTodayString = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  return `${year}-${month}-${day}`;
};

export default function HomeScreen() {
  const router = useRouter();
  
  const [reels, setReels] = useState<any[]>([]);
  const [catalogueProducts, setCatalogueProducts] = useState<CatalogueProduct[]>([]);
  const [offers, setOffers] = useState<MappedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dimension, setDimension] = useState<OfferDimension>("🔥 À réserver");
  const [culinaryCategory, setCulinaryCategory] = useState<string>("Tout");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<{ id: number; name: string } | null>(null);
  const selectedCityRef = useRef<{ id: number; name: string } | null>(null);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const businessTodayStr = useMemo(() => getBusinessTodayString(), []);

  const refreshData = useCallback(async (forcedCity?: { id: number; name: string }) => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Récupérer la ville stockée ou passée en argument direct
      let currentCity = forcedCity || selectedCityRef.current;
      if (!currentCity) {
        const storedCity = await AsyncStorage.getItem('selected_city');
        if (storedCity) {
          try {
            currentCity = JSON.parse(storedCity);
            selectedCityRef.current = currentCity;
            setSelectedCity(currentCity);
          } catch (e) {
            console.error("Erreur lecture selected_city:", e);
          }
        }
      }

      // Si aucune ville n'est encore configurée, ouvrir le sélecteur
      if (!currentCity) {
        setCityModalVisible(true);
      }

      const cityId = currentCity ? currentCity.id : null;

      // ✅ Charger 3 sources de données en parallèle
      const [reelsData, catalogueData, rawOffers] = await Promise.all([
        api.get("/reels/").catch(() => []),
        api.get("/products/catalogue").catch(() => []),
        api.get(cityId ? `/offers/upcoming?days=7&city_id=${cityId}` : "/offers/upcoming?days=7").catch(() => []),
      ]);

      setReels(Array.isArray(reelsData) ? reelsData : []);

      // ✅ MAPPAGE STRICT DU CATALOGUE : Neutralisation totale des champs d'offre
      const safeCatalogue = Array.isArray(catalogueData) ? catalogueData : [];
      const mappedCatalogue: CatalogueProduct[] = safeCatalogue.map((p: any) => ({
        id: Number(p.id),
        name: String(p.name || ""),
        category: String(p.category || "Général"),
        image_url: String(p.image_url || "https://via.placeholder.com/150"),
        price: Number(p.price || 2500),
        complements: String(p.complements || "Standard"),
        description: String(p.description || ""),
        
        // Neutralisation explicite pour empêcher tout rendu de date ou de statut
        isCatalogueProduct: true,
        status: "catalogue",
        target_date: undefined, 
        is_threshold_reached: false,
        remaining_to_trigger: 0,
        reserved_portions: 0,
        price_per_unit: Number(p.price || 2500),
        progress_percentage: 0,
        remaining_capacity: 999,
        product: {
          id: Number(p.id),
          name: String(p.name || ""),
          image_url: String(p.image_url || "https://via.placeholder.com/150"),
          category: String(p.category || "Général"),
          complements: String(p.complements || "Standard"),
        }
      }));
      setCatalogueProducts(mappedCatalogue);

      // Mappage des offres (pour "Menu du Jour")
      const safeOffers = Array.isArray(rawOffers) ? rawOffers : [];
      const mappedOffers: MappedOffer[] = safeOffers.map((offer: any) => ({
        ...offer,
        is_threshold_reached: offer.is_threshold_reached || false,
        remaining_to_trigger: offer.remaining_to_trigger || 0,
        reserved_portions: offer.reserved_portions || 0,
        progress_percentage: offer.progress_percentage || 0,
        remaining_capacity: offer.remaining_capacity || 0,
      }));
      setOffers(mappedOffers);
    } catch (err: any) {
      console.error("❌ Erreur chargement:", err);
      setError("Impossible de charger le menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ✂️ LOGIQUE D'AFFICHAGE
  const displayedData = useMemo(() => {
    if (dimension === "🍲 Menu du Jour") {
      // Menu du Jour : DailyOffers confirmées pour AUJOURD'HUI
      return offers.filter((offer) => {
        const statusLower = offer.status?.toLowerCase();
        return offer.target_date === businessTodayStr &&
               ['confirmed', 'cooking', 'ready', 'delivering'].includes(statusLower) &&
               (culinaryCategory === "Tout" || offer.product?.category === culinaryCategory);
      });
    }

    // 🔥 À réserver : CATALOGUE DE PRODUITS (indépendant des dates)
    let filtered = catalogueProducts;
    if (culinaryCategory !== "Tout") {
      filtered = filtered.filter(p => p.category === culinaryCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(q));
    }
    return filtered;
  }, [catalogueProducts, offers, dimension, culinaryCategory, searchQuery, businessTodayStr]);

  // Nombre d'offres confirmées aujourd'hui vs recettes au catalogue
  const dailyOffersCount = useMemo(() => {
    return offers.filter((offer) => {
      const statusLower = offer.status?.toLowerCase();
      return offer.target_date === businessTodayStr &&
             ['confirmed', 'cooking', 'ready', 'delivering'].includes(statusLower);
    }).length;
  }, [offers, businessTodayStr]);

  const reservationOffersCount = useMemo(() => {
    return catalogueProducts.length;
  }, [catalogueProducts.length]);

  // Offre vedette pour "À réserver" : l'offre future la plus proche du seuil
  const heroOffer = useMemo(() => {
    if (dimension !== "🔥 À réserver") return null;
    const pendingOffers = offers.filter((o) => 
      !o.is_threshold_reached && 
      ['proposed', 'reservation'].includes(o.status?.toLowerCase()) &&
      o.target_date > businessTodayStr
    );
    if (pendingOffers.length === 0) return null;
    return [...pendingOffers].sort((a, b) => b.progress_percentage - a.progress_percentage)[0];
  }, [offers, dimension, businessTodayStr]);

  const checkAuthAndOpenOrder = useCallback(
    async (item: any) => {
      const isAuth = await isAuthenticated(AsyncStorage);
      if (!isAuth) {
        showAlert("KemTchop", "Connecte-toi pour réserver ton plat.", [
          { text: "Plus tard", style: "cancel" },
          { text: "Se connecter", onPress: () => navigate(router, "/login") },
        ]);
        return;
      }
      setSelectedItem(item);
      setModalVisible(true);
    },
    [router]
  );

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("user_name").then(setUserName);
    }, [])
  );

  const getSafeMediaUrl = useCallback((url: string | null | undefined) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://api.kemtchop.shop${url.startsWith("/") ? "" : "/"}${url}`;
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HomeHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userName={userName}
        selectedCity={selectedCity}
        onPressCity={() => setCityModalVisible(true)}
      />

      <OfferGrid
        offers={displayedData}
        loading={loading}
        error={error}
        onOrder={checkAuthAndOpenOrder}
        onRefresh={refreshData}
        searchQuery={searchQuery}
        getMediaUrl={getSafeMediaUrl}
        renderCustomHeader={
          <View style={styles.headerContainer}>
            <ReelsSection
              reels={reels}
              getMediaUrl={getSafeMediaUrl}
              onOrder={checkAuthAndOpenOrder}
            />
            
            {heroOffer && (
              <HeroOfferCard
                offer={heroOffer}
                onOrder={checkAuthAndOpenOrder}
                getMediaUrl={getSafeMediaUrl}
              />
            )}
            
            <ProductionFilterSection
              productionDimension={dimension}
              setProductionDimension={setDimension}
              culinaryCategory={culinaryCategory}
              setCulinaryCategory={setCulinaryCategory}
              dailyCount={dailyOffersCount}
              reservationCount={reservationOffersCount}
            />
            
            <Text style={styles.subSectionTitle}>
              {dimension === "🔥 À réserver"
                ? `🔥 Plats à Réserver (${displayedData.length})`
                : `🍲 Menu du Jour (${displayedData.length})`}
            </Text>
            
            {/* 👨‍🍳 État Vide Explicatif si Menu du Jour n'a aucun plat en cours */}
            {dimension === "🍲 Menu du Jour" && displayedData.length === 0 && !loading && (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateIconBadge}>
                  <Text style={{ fontSize: 32 }}>👨‍🍳</Text>
                </View>
                <Text style={styles.emptyStateTitle}>Nos chefs préparent les prochains services !</Text>
                <Text style={styles.emptyStateDesc}>
                  Aucun plat n'est en livraison immédiate aujourd'hui.{'\n'}
                  Réservez dès maintenant vos portions pour demain ou les jours suivants afin de garantir la production (seuil de 4 portions) !
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setDimension("🔥 À réserver")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyStateButtonText}>
                    🔥 Voir les plats à réserver ({catalogueProducts.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {dimension === "🔥 À réserver" && displayedData.length === 0 && !loading && (
              <Text style={styles.emptyHint}>
                Aucun plat disponible pour le moment dans cette catégorie.
              </Text>
            )}
          </View>
        }
      />

      {selectedItem && (
        <OrderModal
          visible={modalVisible}
          item={selectedItem}
          onClose={() => {
            setModalVisible(false);
            setSelectedItem(null);
          }}
          onConfirm={() => {
            setModalVisible(false);
            setSelectedItem(null);
            refreshData();
          }}
        />
      )}

      <CitySelector
        visible={cityModalVisible}
        onSelect={(city) => {
          selectedCityRef.current = city;
          setSelectedCity(city);
          setCityModalVisible(false);
          refreshData(city);
        }}
        onClose={selectedCity ? () => setCityModalVisible(false) : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerContainer: { paddingVertical: 10 },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    paddingHorizontal: 16,
    marginTop: 15,
    marginBottom: 8,
  },
  emptyHint: {
    paddingHorizontal: 16,
    color: "#94a3b8",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 8,
  },
  emptyStateCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyStateIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyStateDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emptyStateButton: {
    backgroundColor: '#E31C25',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyStateButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});