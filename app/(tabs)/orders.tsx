import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const SERVER_IP = "127.0.0.1";

  // --- FONCTION DE RÉCUPÉRATION DES DONNÉES ---
  const fetchOrders = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const storedPhone = await AsyncStorage.getItem("user_phone");

      // AJOUTE CETTE LIGNE : Elle débloque l'affichage
      if (storedPhone) setUserPhone(storedPhone);

      if (storedPhone) {
        const response = await fetch(
          `http://${SERVER_IP}:8000/orders/my-orders/${storedPhone}`,
        );
        if (response.ok) {
          const data = await response.json();
          const sortedData = data.sort((a: any, b: any) => b.id - a.id);
          setOrders(sortedData);
        }
      }
    } catch (error) {
      console.error("Erreur fetch orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false); // N'oublie pas de stopper le rafraîchissement ici aussi
    }
  };
  // --- EFFET POUR LE CHARGEMENT INITIAL + MISE À JOUR AUTO ---
  useEffect(() => {
    // 1. Premier chargement
    fetchOrders(true);

    // 2. Mise à jour automatique toutes les 10 secondes (Polling)
    // Cela permet de voir le changement "Acompte -> Cuisine" sans rafraîchir manuellement
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 10000);

    // Nettoyage de l'intervalle si on quitte l'écran
    return () => clearInterval(interval);
  }, []);

  // --- RAFRAÎCHISSEMENT MANUEL (Tirer vers le bas) ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(false).then(() => setRefreshing(false));
  }, []);

  // --- LOGIQUE DE LA TIMELINE ---
  const getStatusStep = (status: string) => {
    switch (status) {
      case "en_attente":
        return 1;
      case "cuisine":
        return 2;
      case "livraison":
        return 3;
      case "termine":
        return 4;
      default:
        return 1;
    }
  };

  const renderOrderItem = ({ item }: any) => {
    const currentStep = getStatusStep(item.status);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.orderId}>#00{item.id}</Text>
        </View>

        {/* TIMELINE DE SUIVI DYNAMIQUE */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineLine} />
          <View style={styles.stepsRow}>
            {/* Étape 1 : Acompte / En attente */}
            <View
              style={[styles.stepDot, currentStep >= 1 && styles.activeDot]}
            >
              <Text
                style={[
                  styles.stepLabel,
                  currentStep >= 1 && styles.activeLabel,
                ]}
              >
                Acompte
              </Text>
            </View>
            {/* Étape 2 : Cuisine */}
            <View
              style={[styles.stepDot, currentStep >= 2 && styles.activeDot]}
            >
              <Text
                style={[
                  styles.stepLabel,
                  currentStep >= 2 && styles.activeLabel,
                ]}
              >
                Cuisine
              </Text>
            </View>
            {/* Étape 3 : Livraison */}
            <View
              style={[styles.stepDot, currentStep >= 3 && styles.activeDot]}
            >
              <Text
                style={[
                  styles.stepLabel,
                  currentStep >= 3 && styles.activeLabel,
                ]}
              >
                Livraison
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.row}>
            <Text style={styles.detailText}>💰 Reste à payer:</Text>
            <Text style={styles.priceHighlight}>
              {item.total_amount - (item.deposit_amount || 0)} FCFA
            </Text>
          </View>
          <Text style={styles.detailTextSmall}>
            📍 Destination: {item.zone}
          </Text>
          <Text
            style={[
              styles.statusBadge,
              { color: currentStep >= 2 ? "#E31C25" : "#666" },
            ]}
          >
            Statut actuel: {item.status.replace("_", " ").toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E31C25" />
      </View>
    );
  }

  if (!userPhone) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>KEMTCHOP</Text>
        <Text style={styles.emptyText}>
          Vous n'avez pas encore passé de commande.
        </Text>
        <Text style={styles.emptySubText}>
          Vos plats en préparation apparaîtront ici !
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suivi de mes plats</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            color="#E31C25"
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ color: "#999" }}>Aucune commande en cours...</Text>
          </View>
        }
        contentContainerStyle={styles.listPadding}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8", paddingHorizontal: 15 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginVertical: 20,
    color: "#000",
    letterSpacing: 1,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#E31C25",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
  listPadding: { paddingBottom: 20 },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  productName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  orderId: { color: "#E31C25", fontWeight: "bold" },
  timelineContainer: {
    marginVertical: 15,
    height: 60,
    justifyContent: "center",
  },
  timelineLine: {
    position: "absolute",
    top: 12,
    left: "10%",
    right: "10%",
    height: 2,
    backgroundColor: "#eee",
    zIndex: 0,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    zIndex: 1,
  },
  stepDot: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: "#eee",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  activeDot: { backgroundColor: "#E31C25" },
  stepLabel: {
    fontSize: 10,
    position: "absolute",
    top: 30,
    width: 70,
    textAlign: "center",
    color: "#bbb",
    fontWeight: "600",
  },
  activeLabel: { color: "#000", fontWeight: "bold" },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 15,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailText: { fontSize: 14, color: "#444" },
  detailTextSmall: { fontSize: 12, color: "#888", marginTop: 5 },
  priceHighlight: { fontSize: 16, fontWeight: "900", color: "#000" },
  statusBadge: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "right",
  },
});
