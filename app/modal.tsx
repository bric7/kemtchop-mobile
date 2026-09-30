// app/modal.tsx
// ============================================================
// 📱 KEMTCHOP MOBILE - Modal de Commande (Version Autonome)
// ============================================================

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from "react-native";

export default function OrderModalScreen() {
  const router = useRouter();
  
  // Récupération des données passées en paramètres depuis l'écran précédent
  const {
    product_name,
    price,
    price_duo,
    price_family,
    complements,
    image_url,
  } = useLocalSearchParams();

  // Conversion des prix reçus en paramètres (chaînes de caractères vers nombres)
  const pSolo = Number(price) || 0;
  const pDuo = Number(price_duo) || 0;
  const pFam = Number(price_family) || 0;

  const [selectedType, setSelectedType] = useState("solo"); // 'solo', 'duo' ou 'famille'
  const [currentPrice, setCurrentPrice] = useState(pSolo);

  const selectOption = (type: string, priceValue: number) => {
    setSelectedType(type);
    setCurrentPrice(priceValue);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* IMAGE DU PLAT */}
        <Image
          source={{ uri: image_url as string }}
          style={styles.productImage}
        />

        <View style={styles.detailsContainer}>
          <Text style={[styles.textBase, styles.title]}>
            {product_name}
          </Text>

          <Text style={[styles.textBase, styles.sectionTitle]}>
            Choisir la formule :
          </Text>

          {/* OPTIONS DE PRIX */}
          <View style={styles.optionsGrid}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedType === "solo" && styles.selectedCard,
              ]}
              onPress={() => selectOption("solo", pSolo)}
            >
              <Text
                style={[
                  styles.textBase,
                  selectedType === "solo" && styles.selectedText,
                ]}
              >
                Solo
              </Text>
              <Text style={[styles.textBase, styles.priceText]}>{pSolo} FCFA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedType === "duo" && styles.selectedCard,
              ]}
              onPress={() => selectOption("duo", pDuo)}
            >
              <Text style={[styles.textBase, selectedType === "duo" && styles.selectedText]}>
                Duo
              </Text>
              <Text style={[styles.textBase, styles.priceText]}>{pDuo} FCFA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedType === "famille" && styles.selectedCard,
              ]}
              onPress={() => selectOption("famille", pFam)}
            >
              <Text
                style={[
                  styles.textBase,
                  selectedType === "famille" && styles.selectedText,
                ]}
              >
                Famille
              </Text>
              <Text style={[styles.textBase, styles.priceText]}>{pFam} FCFA</Text>
            </TouchableOpacity>
          </View>

          {/* ACCOMPAGNEMENTS */}
          <Text style={[styles.textBase, styles.sectionTitle]}>Accompagnements :</Text>
          <View style={styles.complementsBox}>
            {complements ? (
              (complements as string).split(",").map((item, idx) => (
                <View key={idx} style={styles.badge}>
                  <Text style={[styles.textBase, styles.badgeText]}>
                    {item.trim()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.textBase}>Inclus selon arrivage</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* FOOTER AVEC PRIX TOTAL ET BOUTON */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.textBase}>Total à payer</Text>
          <Text style={[styles.textBase, styles.totalPrice]}>
            {currentPrice} FCFA
          </Text>
        </View>
        <TouchableOpacity style={styles.orderButton}>
          <Text style={[styles.textBase, styles.orderButtonText]}>Confirmer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff',
  },
  textBase: {
    color: '#111827', // Couleur globale du texte pour assurer la lisibilité
  },
  scrollContent: { paddingBottom: 100 },
  productImage: { width: "100%", height: 250 },
  detailsContainer: { padding: 20 },
  title: { 
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20, 
    color: "#E31C25" 
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  optionsGrid: { flexDirection: "row", justifyContent: "space-between" },
  optionCard: {
    width: "30%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
  },
  selectedCard: { borderColor: "#E31C25", backgroundColor: "#fff0f0" },
  selectedText: { color: "#E31C25", fontWeight: "bold" },
  priceText: { fontSize: 12, marginTop: 5, color: '#666' },
  complementsBox: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { fontSize: 13 },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalPrice: { 
    color: "#E31C25", 
    fontWeight: "bold",
    fontSize: 20,
  },
  orderButton: {
    backgroundColor: "#E31C25",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  orderButtonText: { color: "#fff", fontWeight: "bold" },
});