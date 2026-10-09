import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { safeFormatNumber } from "@/utils/format";
import { api } from "../../config/api";
import { useTranslation } from "@/i18n/LanguageContext";

export default function OrdersScreen() {
  const { t, isEnglish } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  // --- FONCTION DE RÉCUPÉRATION DES DONNÉES ---
  const fetchOrders = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const storedPhone = await AsyncStorage.getItem("user_phone");

      if (storedPhone) {
        setUserPhone(storedPhone);
        // Utilisation du service API centralisé avec authentification
        const data = await api.get('/orders/my-orders', true);

        if (data && Array.isArray(data)) {
          // Tri par date de création (nécessaire car les UUID ne sont pas séquentiels)
          const sortedData = data.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setOrders(sortedData);
        }
      }
    } catch (error) {
      console.error("Erreur fetch orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  // --- EFFET POUR LE CHARGEMENT INITIAL + MISE À JOUR AUTO ---
  useEffect(() => {
    // 1. Premier chargement
    fetchOrders(true);

    // 2. Écouteur global de rafraîchissement
    const unsubscribeRefresh = api.onGlobalRefresh(() => {
      fetchOrders(false);
    });

    // 3. Écouteur réseau (reconnexion automatique)
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        fetchOrders(false);
      }
    });

    // 4. Écouteur retour au premier plan
    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        fetchOrders(false);
      }
    });

    // 5. Polling automatique toutes les 10 secondes
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 10000);

    return () => {
      unsubscribeRefresh();
      unsubscribeNetInfo();
      appStateSub.remove();
      clearInterval(interval);
    };
  }, []);

  // --- RAFRAÎCHISSEMENT MANUEL (Tirer vers le bas) ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(false).then(() => setRefreshing(false));
  }, []);

  // --- LOGIQUE DE LA TIMELINE ---
  const getStatusStep = (status: string) => {
    const s = (status || "").toUpperCase().trim();

    // Étape 1 : En attente / Acompte
    if (["PENDING", "EN_ATTENTE", "PAID", "ACOMPTE"].includes(s)) return 1;

    // Étape 2 : Cuisine / Préparation
    if (["PREPARING", "CUISINE", "COOKING", "READY_TO_SHIP", "IN_PREPARATION"].includes(s)) return 2;

    // Étape 3 : Livraison / En route
    if (["SHIPPING", "LIVRAISON", "DELIVERING", "ON_THE_WAY"].includes(s)) return 3;

    // Étape 4 : Terminé / Livré
    if (["DELIVERED", "TERMINE", "TERMINÉ", "COMPLETED", "FINISHED", "CLOSED"].includes(s)) return 4;

    return 1;
  };

  const renderOrderItem = ({ item }: any) => {
    const currentStep = getStatusStep(item.status);
    const isFailed = (item.status || "").toUpperCase() === "DELIVERY_FAILED";
    const isCancelled = (item.status || "").toUpperCase() === "CANCELLED";
    const rawBalance = item.balance_due !== undefined ? item.balance_due : (item.total_amount * 0.6);
    const isFullyPaid = item.financial_status === 'FULLY_PAID' || rawBalance <= 0;
    const paidAmount = item.confirmed_paid_amount || (item.total_amount - rawBalance);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{item.product_name || (isEnglish ? "KemTchop Meal" : "Plat KemTchop")}</Text>
            <Text style={{ fontSize: 11, color: "#888", fontWeight: "600", marginTop: 2 }}>
              {item.portions || 1} {Number(item.portions) > 1 ? t.common.portions : t.common.portion} • {item.delivery_date ? new Date(item.delivery_date).toLocaleDateString(isEnglish ? 'en-US' : 'fr-FR', { timeZone: 'Africa/Douala' }) : (isEnglish ? "Today" : "Aujourd'hui")}
            </Text>
            {item.customization_note ? (
              <View style={styles.customizationBadge}>
                <Text style={styles.customizationBadgeTitle}>
                  {isEnglish ? "✨ Cooking preference:" : "✨ Préférence demandée :"}
                </Text>
                <Text style={styles.customizationBadgeContent}>« {item.customization_note} »</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.orderId}>#{item.id.substring(0, 8)}</Text>
        </View>

        {/* TIMELINE DE SUIVI DYNAMIQUE */}
        {!isFailed && !isCancelled ? (
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
                  {isEnglish ? "Deposit" : "Acompte"}
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
                  {isEnglish ? "Kitchen" : "Cuisine"}
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
                  {isEnglish ? "Delivery" : "Livraison"}
                </Text>
              </View>
              {/* Étape 4 : Terminé */}
              <View
                style={[styles.stepDot, currentStep >= 4 && styles.activeDot]}
              >
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep >= 4 && styles.activeLabel,
                  ]}
                >
                  {isEnglish ? "Delivered" : "Terminé"}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{
            backgroundColor: isFailed ? "#FFF5F5" : "#F8F9FA",
            padding: 12,
            borderRadius: 14,
            marginVertical: 10,
            borderWidth: 1,
            borderColor: isFailed ? "#FEB2B2" : "#E2E8F0"
          }}>
            <Text style={{
              fontWeight: "900",
              fontSize: 12,
              color: isFailed ? "#C53030" : "#4A5568",
              textTransform: "uppercase"
            }}>
              {isFailed 
                ? (isEnglish ? "⚠️ Delivery Incident Reported" : "⚠️ Incident de Livraison Signalé") 
                : (isEnglish ? "🚫 Order Cancelled" : "🚫 Commande Annulée")}
            </Text>
            {item.delivery_failure_reason && (
              <Text style={{ fontSize: 11, color: "#742A2A", marginTop: 2, fontWeight: "600" }}>
                {isEnglish ? "Reason :" : "Motif :"} {item.delivery_failure_reason}
              </Text>
            )}
            <Text style={{ fontSize: 10, color: "#A0AEC0", marginTop: 4 }}>
              {isFailed
                ? (isEnglish ? "Our logistics team will contact you to reschedule." : "L'équipe logistique vous recontacte pour réorganiser la remise.")
                : (isEnglish ? "This order was cancelled." : "Cette commande a été annulée.")}
            </Text>
          </View>
        )}

        <View style={styles.orderDetails}>
          <View style={styles.row}>
            <Text style={styles.detailText}>
              {isEnglish ? "Total order:" : "Total commande:"}
            </Text>
            <Text style={styles.priceHighlight}>
              {safeFormatNumber(item.total_amount)} FCFA
            </Text>
          </View>

          <View style={[styles.row, { marginTop: 4 }]}>
            <Text style={styles.detailTextSmall}>
              {isEnglish ? "💰 Deposit paid (40%):" : "💰 Acompte payé (40%):"} {safeFormatNumber(Math.round(paidAmount))} FCFA
            </Text>
            <Text style={{
              fontSize: 12,
              fontWeight: "bold",
              color: isFullyPaid ? "#38A169" : "#E53E3E"
            }}>
              {isFullyPaid
                ? (isEnglish ? "✅ Fully Paid" : "✅ Solde Réglé")
                : (isEnglish ? `Balance due: ${safeFormatNumber(Math.round(rawBalance))} F` : `Solde à payer: ${safeFormatNumber(Math.round(rawBalance))} F`)}
            </Text>
          </View>

          {item.assigned_driver_name && (
            <Text style={[styles.detailTextSmall, { color: "#2B6CB0", fontWeight: "700", marginTop: 6 }]}>
              🛵 {isEnglish ? "Driver:" : "Livreur:"} {item.assigned_driver_name}
            </Text>
          )}

          <Text style={styles.detailTextSmall}>
            📍 {isEnglish ? "Destination:" : "Destination :"} {item.zone || "Douala / Yaoundé"}
          </Text>

          <Text
            style={[
              styles.statusBadge,
              { color: isFailed ? "#E53E3E" : currentStep >= 2 ? "#E31C25" : "#666" },
            ]}
          >
            {isEnglish ? "Current status:" : "Statut actuel :"} {(() => {
              const s = (item.status || "").toLowerCase().trim();
              if (s.includes("confirmed")) return t.orderStatus.confirmed;
              if (s.includes("prepar") || s.includes("cook")) return t.orderStatus.preparing;
              if (s.includes("ready")) return t.orderStatus.ready;
              if (s.includes("ship") || s.includes("deliveri")) return t.orderStatus.shipping;
              if (s.includes("delivered") || s.includes("termine")) return t.orderStatus.delivered;
              if (s.includes("cancel")) return t.orderStatus.cancelled;
              if (s.includes("picked")) return t.orderStatus.pickedUp;
              return isEnglish ? "In progress" : "En cours";
            })()}
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
          {isEnglish ? "You haven't placed an order yet." : "Vous n'avez pas encore passé de commande."}
        </Text>
        <Text style={styles.emptySubText}>
          {isEnglish ? "Your meals in preparation will appear here!" : "Vos plats en préparation apparaîtront ici !"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {isEnglish ? "My Orders" : "Suivi de mes plats"}
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            setRefreshing(true);
            fetchOrders(false);
          }}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          <Ionicons name="reload" size={14} color="#E31C25" style={{ marginRight: 5 }} />
          <Text style={styles.refreshButtonText}>
            {isEnglish ? "Refresh" : "Actualiser"}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderOrderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E31C25"
            colors={["#E31C25"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ color: "#999" }}>
              {isEnglish ? "No active orders..." : "Aucune commande en cours..."}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listPadding}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8", paddingHorizontal: 15 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E31C25",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 0.5,
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
  customizationBadge: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
  },
  customizationBadgeTitle: {
    fontSize: 9,
    fontWeight: "900",
    color: "#92400e",
    textTransform: "uppercase",
  },
  customizationBadgeContent: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#78350f",
    marginTop: 1,
  },
});
