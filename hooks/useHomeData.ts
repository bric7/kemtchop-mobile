import { apiFetch } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export function useHomeData() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Logique Deep Link (Capture du code parrain au clic sur le lien)
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      let data = Linking.parse(event.url);
      if (data.queryParams && data.queryParams.ref) {
        // ON UTILISE LA MÊME CLÉ QUE DANS INDEX.TS
        await AsyncStorage.setItem(
          "active_affiliate_code",
          data.queryParams.ref as string,
        );
        console.log(
          "🎯 Système : Parrainage détecté via lien ->",
          data.queryParams.ref,
        );
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((url) => url && handleDeepLink({ url }));
    return () => subscription.remove();
  }, []);

  // 2. Chargement des données (Vidéos et Produits)
  const fetchData = async () => {
  setLoading(true);
  try {
    // Ajoute un petit délai ou vérifie si l'API répond
    const data = await apiFetch("/reels/");
    
    if (!data) throw new Error("Données vides");

    setReels(data);
    setProducts(data);
    setFilteredProducts(data);
  } catch (err: any) {
    // Si l'erreur est liée au réseau lors du basculement 4G
    console.error("❌ Erreur réseau détectée :", err.message);
    // Optionnel : ne pas afficher d'alerte si c'est juste un micro-coupure
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  // 3. Envoi de la Commande vers FastAPI
  // ✅ Remplace TOUTE la fonction par celle-ci :
  const handleConfirmOrder = async (orderData: any, setModalVisible: any) => {
    try {
      const savedPhone = await AsyncStorage.getItem("user_phone");
      const savedName = await AsyncStorage.getItem("user_name");
      const affiliateCode = await AsyncStorage.getItem("active_affiliate_code");

      const payload = {
        product_name: orderData.product_name || "Plat KEMTCHOP",
        customer_name: savedName || orderData.customerName || "Client",
        phone: savedPhone || orderData.phone,
        zone: orderData.zone || "Non spécifiée",
        total_amount: orderData.total_amount || 0,
        deposit_amount: orderData.deposit_amount || 0,
        status: "en_attente",
        affiliate_code: affiliateCode || null,
        portion_size: orderData.portion_size || "Standard",
        complement: orderData.complement || "Aucun",
        delivery_date: orderData.delivery_date || "",
        delivery_time: orderData.delivery_time || "",
      };

      // ✅ Utilise apiFetch au lieu de fetch
      const result = await apiFetch("/orders/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result.status === "success") {
        Alert.alert(
          "Succès ! 🎉",
          "Ta commande a été reçue. On te contacte sur WhatsApp !",
        );
        if (setModalVisible) setModalVisible(false);
      }
    } catch (error: any) {
      console.error("❌ Erreur commande:", error);
      Alert.alert("Erreur", error.message || "Échec de la commande");
    }
  };

  return {
    reels,
    products,
    filteredProducts,
    setFilteredProducts,
    loading,
    handleConfirmOrder,
    router,
  };
}
