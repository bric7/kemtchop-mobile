import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function OrderModalScreen() {
  const router = useRouter();
  // On récupère toutes les données passées en paramètres depuis l'écran précédent
  const {
    product_name,
    price,
    price_duo,
    price_family,
    complements,
    image_url,
  } = useLocalSearchParams();

  // On convertit les prix en nombres (ils arrivent souvent en string via params)
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
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* IMAGE DU PLAT */}
        <Image
          source={{ uri: image_url as string }}
          style={styles.productImage}
        />

        <View style={styles.detailsContainer}>
          <ThemedText type="title" style={styles.title}>
            {product_name}
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>
            Choisir la formule :
          </ThemedText>

          {/* OPTIONS DE PRIX */}
          <View style={styles.optionsGrid}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedType === "solo" && styles.selectedCard,
              ]}
              onPress={() => selectOption("solo", pSolo)}
            >
              <ThemedText
                style={selectedType === "solo" && styles.selectedText}
              >
                Solo
              </ThemedText>
              <ThemedText style={styles.priceText}>{pSolo} FCFA</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedType === "duo" && styles.selectedCard,
              ]}
              onPress={() => selectOption("duo", pDuo)}
            >
              <ThemedText style={selectedType === "duo" && styles.selectedText}>
                Duo
              </ThemedText>
              <ThemedText style={styles.priceText}>{pDuo} FCFA</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedType === "famille" && styles.selectedCard,
              ]}
              onPress={() => selectOption("famille", pFam)}
            >
              <ThemedText
                style={selectedType === "famille" && styles.selectedText}
              >
                Famille
              </ThemedText>
              <ThemedText style={styles.priceText}>{pFam} FCFA</ThemedText>
            </TouchableOpacity>
          </View>

          {/* ACCOMPAGNEMENTS */}
          <ThemedText style={styles.sectionTitle}>Accompagnements :</ThemedText>
          <View style={styles.complementsBox}>
            {complements ? (
              (complements as string).split(",").map((item, idx) => (
                <View key={idx} style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {item.trim()}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText>Inclus selon arrivage</ThemedText>
            )}
          </View>
        </View>
      </ScrollView>

      {/* FOOTER AVEC PRIX TOTAL ET BOUTON */}
      <View style={styles.footer}>
        <View>
          <ThemedText>Total à payer</ThemedText>
          <ThemedText type="subtitle" style={styles.totalPrice}>
            {currentPrice} FCFA
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.orderButton}>
          <ThemedText style={styles.orderButtonText}>Confirmer</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  productImage: { width: "100%", height: 250 },
  detailsContainer: { padding: 20 },
  title: { marginBottom: 20, color: "#E31C25" },
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
  priceText: { fontSize: 12, marginTop: 5 },
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
  totalPrice: { color: "#E31C25", fontWeight: "bold" },
  orderButton: {
    backgroundColor: "#E31C25",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  orderButtonText: { color: "#fff", fontWeight: "bold" },
});
