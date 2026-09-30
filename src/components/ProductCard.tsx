import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const ProductCard = ({
  item,
  onOrder,
}: {
  item: any;
  onOrder: () => void;
}) => {
  const [myOwnAffiliateCode, setMyOwnAffiliateCode] = useState<string | null>(
    null,
  );

  // Vérification du code ambassadeur
  useEffect(() => {
    const getMyCode = async () => {
      const code = await AsyncStorage.getItem("active_affiliate_code");
      console.log("--- DEBUG CARTE --- Valeur trouvée :", code);
      setMyOwnAffiliateCode(code);
    };
    getMyCode();
  }, []);

  const handleShareProduct = () => {
    // 1. On prépare la base du lien (toujours nécessaire)
    let shareLink = `exp://192.168.100.125:8081/--/home?productId=${item.id}`;

    // 2. On ajoute la "ref" UNIQUEMENT si l'utilisateur a un code ambassadeur
    // S'il n'en a pas, on ne met rien (le lien reste propre)
    if (myOwnAffiliateCode) {
      shareLink += `&ref=${myOwnAffiliateCode}`;
    }

    // 3. Construction du message (Dynamique selon le produit)
    const message =
      `Salut ! Regarde ce que je viens de trouver chez KEMTCHOP : \n\n` +
      `🔥 *${item.product_name}* (${item.category})\n` +
      `C'est une tuerie ! Commande ici : \n${shareLink}`;

    // 4. Envoi vers WhatsApp
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      // Solution de secours si l'app WhatsApp n'est pas installée (ouvre le web)
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    });
  };

  return (
    <View style={styles.card}>
      {/* 1. IMAGE DU PRODUIT */}
      <Image source={{ uri: item.image_url }} style={styles.image} />

      {/* 2. BADGE PARTAGER (Toujours visible pour le test) */}
      <TouchableOpacity
        style={styles.shareBadge}
        onPress={handleShareProduct}
        activeOpacity={0.7}
      >
        <Ionicons name="share-social" size={14} color="#fff" />
        <Text style={styles.shareBadgeText}>Partager</Text>
      </TouchableOpacity>

      {/* 3. INFORMATIONS DU PRODUIT (Réinstallées ici) */}
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {item.product_name}
        </Text>

        <Text style={styles.price}>{item.price} FCFA</Text>

        <TouchableOpacity style={styles.orderButton} onPress={onOrder}>
          <Text style={styles.orderButtonText}>Commander</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 0.5,
    margin: 8,
    backgroundColor: "#fff", // Retour au blanc pour voir les textes noirs
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 120,
    backgroundColor: "#f9f9f9",
    zIndex: 1,
  },
  shareBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 999,
    elevation: 5,
    backgroundColor: "#E31C25", // Rouge Kemtchop
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shareBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  price: {
    fontSize: 13,
    color: "#E31C25",
    fontWeight: "900",
    marginVertical: 5,
  },
  orderButton: {
    backgroundColor: "#000",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  orderButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});
export default ProductCard;