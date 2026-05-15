import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Interface pour typer tes commandes venant de FastAPI
interface Order {
  id: number;
  product_name: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function AmbassadorDashboard() {
  const router = useRouter();
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCommission, setTotalCommission] = useState(0);

  const SERVER_IP = "127.0.0.1"; // N'oublie pas de mettre ton IP locale pour les tests sur téléphone

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const myCode = await AsyncStorage.getItem("active_affiliate_code");
      if (!myCode) return;

      const response = await fetch(
        `http://${SERVER_IP}:8000/orders/ambassador/${myCode}`,
      );
      const data = await response.json();

      setSales(data);

      // Calcul des gains (Exemple : 15% de commission sur les ventes terminées)
      const earned = data
        .filter((order: Order) => order.status === "termine")
        .reduce(
          (sum: number, order: Order) => sum + order.total_amount * 0.15,
          0,
        );

      setTotalCommission(earned);
    } catch (error) {
      console.error("Erreur fetch sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "termine":
        return { label: "Livré", color: "#28A745", icon: "checkmark-circle" };
      case "annule":
        return { label: "Annulé", color: "#DC3545", icon: "close-circle" };
      default:
        return { label: "En cours", color: "#FFA500", icon: "time" };
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const status = getStatusStyle(item.status);
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderInfo}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.customerName}>Par: {item.customer_name}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.orderStatus}>
          <Text style={styles.orderPrice}>{item.total_amount} F</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.color + "20" },
            ]}
          >
            <Ionicons
              name={status.icon as any}
              size={12}
              color={status.color}
            />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER AVEC BOUTON RETOUR */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performances</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* CARTE DE LA CAGNOTTE */}
      <View style={styles.statsContainer}>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Ma Commission Totale</Text>
          <Text style={styles.earningsValue}>
            {totalCommission.toLocaleString()} FCFA
          </Text>
          <View style={styles.badgePromo}>
            <Text style={styles.badgeText}>Taux : 15%</Text>
          </View>
        </View>
      </View>

      {/* LISTE DES VENTES */}
      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Mes Ventes Directes</Text>
          <TouchableOpacity onPress={fetchSales}>
            <Ionicons name="refresh" size={20} color="#E31C25" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#E31C25" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={sales}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderOrderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>
                  Aucune vente enregistrée pour le moment.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#000",
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  backButton: { padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  statsContainer: {
    padding: 20,
    marginTop: -30,
  },
  earningsCard: {
    backgroundColor: "#E31C25",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  earningsLabel: { color: "#fff", opacity: 0.8, fontSize: 14 },
  earningsValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    marginVertical: 8,
  },
  badgePromo: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  listSection: { flex: 1, paddingHorizontal: 20 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  listTitle: { fontSize: 18, fontWeight: "800", color: "#333" },
  orderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  orderInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "bold", color: "#333" },
  customerName: { fontSize: 13, color: "#666", marginTop: 2 },
  orderDate: { fontSize: 11, color: "#999", marginTop: 5 },
  orderStatus: { alignItems: "flex-end" },
  orderPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    marginBottom: 5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: { fontSize: 10, fontWeight: "bold" },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#999", marginTop: 10, textAlign: "center" },
});
