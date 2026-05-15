import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams } from "expo-router"; // AJOUT de useLocalSearchParams
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchBar } from "../../components/SearchBar";
import { useHomeData } from "../../hooks/useHomeData";
import OrderModal from "../components/OrderModal";
import { ProductCard } from "../components/ProductCard";
import HeroCard from "../component/HeroCard";

const CATEGORIES = [
  "Tout",
  "Grillades",
  "Plats Locaux",
  "Boissons",
  "Accompagnements",
  "rôti",
];

export default function HomeScreen() {
  const {
    reels,
    products,
    filteredProducts,
    setFilteredProducts,
    loading,
    handleConfirmOrder,
    router,
  } = useHomeData();

  // --- 1. RÉCUPÉRATION DES PARAMÈTRES (LA LIGNE QUI MANQUAIT) ---
  const { ref, productId } = useLocalSearchParams();

  // --- 2. ÉTATS ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isRefLoaded, setIsRefLoaded] = useState(false); // Pour forcer la mise à jour des badges

  // --- 3. GESTION DE L'AFFILIATION ---
  useEffect(() => {
    if (ref) {
      const saveRef = async () => {
        try {
          await AsyncStorage.setItem("active_affiliate_code", ref.toString());
          console.log("✅ Code ambassadeur enregistré :", ref);
          setIsRefLoaded((prev) => !prev); // Déclenche le rafraîchissement
        } catch (e) {
          console.error("Erreur storage ref:", e);
        }
      };
      saveRef();
    }
  }, [ref]);

  // --- 4. OUVERTURE AUTOMATIQUE DU PRODUIT ---
  useEffect(() => {
    if (productId && products && products.length > 0) {
      const targetProduct = products.find(
        (p: any) => p.id.toString() === productId,
      );
      if (targetProduct) {
        setSelectedItem(targetProduct);
        setModalVisible(true);
      }
    }
  }, [productId, products]);

  // --- 5. RAFRAÎCHISSEMENT AU FOCUS (RETOUR SUR L'ÉCRAN) ---
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const name = await AsyncStorage.getItem("user_name");
        setUserName(name);

        // On vérifie si un code existe pour activer les badges ProductCard
        const stored = await AsyncStorage.getItem("active_affiliate_code");
        if (stored) setIsRefLoaded(true);
      };
      loadData();
    }, []),
  );

  // --- LOGIQUE DE FILTRAGE ---
  const filterItems = (query: string, category: string) => {
    let temp = products;
    if (query) {
      temp = temp.filter((item: any) =>
        item.product_name.toLowerCase().includes(query.toLowerCase()),
      );
    }
    if (category !== "Tout") {
      temp = temp.filter((item: any) => item.category === category);
    }
    setFilteredProducts(temp);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterItems(text, activeCategory);
  };

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    filterItems(searchQuery, category);
  };

  const checkAuthAndOrder = async (item: any) => {
    const savedPhone = await AsyncStorage.getItem("user_phone");
    if (!savedPhone || savedPhone.length < 8) {
      Alert.alert(
        "Identification requise",
        "Tu dois être connecté pour commander.",
        [
          { text: "Plus tard", style: "cancel" },
          { text: "Se connecter", onPress: () => router.push("/login") },
        ],
      );
    } else {
      setSelectedItem(item);
      setModalVisible(true);
    }
  };

  const onFinalConfirm = async (orderData: any) => {
    const storedRef = await AsyncStorage.getItem("active_affiliate_code");
    const finalData = { ...orderData, affiliate_code: storedRef || null };

    handleConfirmOrder(finalData, setModalVisible);

    // OPTIONNEL : On vide le parrain après l'achat pour repartir à zéro
    // await AsyncStorage.removeItem("active_affiliate_code");
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {searchQuery === "" ? (
        <>
          {userName && (
            <Text style={styles.welcomeText}>Salut, {userName} ! 👋</Text>
          )}
          <Text style={styles.sectionTitle}>À la une (Vidéos)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.reelsScroll}
          >
            {reels.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={styles.reelThumbContainer}
                onPress={() =>
                  router.push({
                    pathname: "/reels",
                    params: { startId: item.id },
                  })
                }
              >
                <View style={styles.storyCircle}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.reelThumb}
                  />
                </View>
                <Text numberOfLines={1} style={styles.reelName}>
                  {item.product_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {searchQuery === "" && products.length > 0 && (() => {
  // 1. On cherche le produit que l'admin a coché "is_hero"
  // 2. Si aucun n'est coché, on prend le premier de la liste par défaut
  const featuredProduct = products.find((p: any) => p.is_hero === true) || products[0];

  return (
    <>
      <Text style={styles.sectionTitle}>Suggestion du Chef</Text>
      <HeroCard 
        item={featuredProduct} 
        onOrder={() => checkAuthAndOrder(featuredProduct)} 
      />
    </>
  );
})()}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => handleCategoryPress(cat)}
                style={[
                  styles.categoryChip,
                  activeCategory === cat && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.sectionTitle}>Menu du jour</Text>
        </>
      ) : (
        <Text style={styles.sectionTitle}>Résultats pour "{searchQuery}"</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>KEMTCHOP</Text>
        <SearchBar value={searchQuery} onChange={handleSearch} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E31C25" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onOrder={() => checkAuthAndOrder(item)}
              key={isRefLoaded ? "loaded" : "notloaded"} // Force le re-rendu quand le code change
            />
          )}
          ListHeaderComponent={renderHeader}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {selectedItem && (
        <OrderModal
          visible={modalVisible}
          item={selectedItem}
          onClose={() => setModalVisible(false)}
          onConfirm={onFinalConfirm}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  logo: {
    fontSize: 26,
    fontWeight: "900",
    color: "#E31C25",
    textAlign: "center",
    marginVertical: 10,
  },
  welcomeText: {
    marginLeft: 20,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 5,
  },
  headerContainer: { paddingVertical: 10 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 20,
    marginBottom: 15,
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reelsScroll: { paddingLeft: 20, marginBottom: 15 },
  reelThumbContainer: { marginRight: 15, alignItems: "center", width: 75 },
  storyCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2.5,
    borderColor: "#E31C25",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  reelThumb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#eee",
  },
  reelName: {
    fontSize: 10,
    marginTop: 6,
    textAlign: "center",
    color: "#333",
    fontWeight: "600",
  },
  categoriesScroll: { marginBottom: 20, paddingHorizontal: 20 },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
  },
  categoryChipActive: { backgroundColor: "#000" },
  categoryText: { color: "#666", fontWeight: "700" },
  categoryTextActive: { color: "#fff" },
  columnWrapper: { justifyContent: "space-between", paddingHorizontal: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  loadingText: { marginTop: 10, color: "#666", fontWeight: "500" },
});
