// app/components/OrderModal.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { apiFetch } from "../../config/api";
import ErrorBoundary from "./ErrorBoundary";
import { showAlert } from "../utils/platform";
import { safeFormatNumber } from "../utils/format";

// ✅ GÉNÉRATEUR DE DATES BLINDÉ (Fuseau horaire Afrique/Douala)
const generateNext7Days = (): { date: string; label: string }[] => {
  const dates = [];
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
  
  const businessToday = new Date(`${year}-${month}-${day}T12:00:00`);
  
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(businessToday);
    nextDate.setDate(businessToday.getDate() + i);
    
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    const nextDay = String(nextDate.getDate()).padStart(2, '0');
    const dateStr = `${nextYear}-${nextMonth}-${nextDay}`;
    
    const label = nextDate.toLocaleDateString('fr-FR', {
      timeZone: 'Africa/Douala',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    
    dates.push({ date: dateStr, label });
  }
  return dates;
};

// ✅ LOGIQUE MARKETING EXACTE
const getMarketingMessage = (offer: any, threshold: number = 4) => {
  if (!offer) return { text: "Soyez le premier à réserver !", color: "#64748b" };
  if (offer.status === 'confirmed' || offer.is_threshold_reached) {
    return { text: "✅ Production garantie", color: "#10B981" };
  }
  const reserved = offer.reserved_portions || 0;
  const remaining = threshold - reserved;
  if (remaining === 3) return { text: "1/4 portions réservées — encore 3", color: "#64748b" };
  if (remaining === 2) return { text: "2/4 — encore 2 pour lancer la production", color: "#F59E0B" };
  if (remaining === 1) return { text: "🔥 Plus qu'1 portion pour lancer la production !", color: "#EF4444" };
  if (remaining <= 0) return { text: "🎉 Production confirmée !", color: "#10B981" };
  return { text: "Soyez le premier à réserver !", color: "#64748b" };
};

const OrderModal = ({ visible, onClose, item, onConfirm }: any) => {
  const isCatalogueProduct = item?.isCatalogueProduct ?? (item?.reel_category === 'CATALOG_PRODUCT' || !item?.daily_offer_id);
  const availableDates = generateNext7Days();
  
  const [existingOffers, setExistingOffers] = useState<any[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [loadingOffers, setLoadingOffers] = useState(false);

  const [portions, setPortions] = useState(1);
  const [complement, setComplement] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("12:00");
  const [userZone, setUserZone] = useState("");
  const [adminZones, setAdminZones] = useState<string[]>([]);
  const [baseDeliveryPrice, setBaseDeliveryPrice] = useState(1000);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);

  const productName = isCatalogueProduct ? item?.name : item?.product?.name;
  const pricePerUnit = isCatalogueProduct ? (item?.price || 2500) : (item?.price_per_unit || 0);
  const productId = isCatalogueProduct ? item?.id : item?.product?.id;

  // ✅ CORRECTION INFAILLIBLE DES ACCOMPAGNEMENTS (SIDES)
  const rawComplements = item?.sides || (isCatalogueProduct
    ? (item?.complements || item?.product?.complements) 
    : (item?.product?.complements || item?.complements));

  let finalComplements = "Riz, Plantain, Bâton de manioc";
  if (Array.isArray(rawComplements) && rawComplements.length > 0) {
    finalComplements = rawComplements.join(", ");
  } else if (typeof rawComplements === "string" && rawComplements.trim() !== "") {
    finalComplements = rawComplements;
  }

  const lockedOfferDate = item?.offerDate || item?.target_date;

  const selectedDateStr = availableDates[selectedDateIndex]?.date;
  const currentOffer = existingOffers.find((o: any) => o.target_date === selectedDateStr && Number(o.product?.id) === Number(productId));
  const marketingState = getMarketingMessage(currentOffer, 4);

  useEffect(() => {
    if (visible) {
      try {
        AsyncStorage.getItem("user_phone").then((p) => p && setPhone(p)).catch(() => {});
        AsyncStorage.getItem("selected_city").then((c) => {
          if (c) {
            try {
              setSelectedCity(JSON.parse(c));
            } catch (e) {
              console.warn("⚠️ selected_city invalide dans AsyncStorage:", e);
              setSelectedCity(null);
            }
          }
        }).catch(() => {});
        loadDeliveryZones();
        setComplement("");
        setPortions(1);
        setSelectedDateIndex(0);
        if (isCatalogueProduct) loadExistingOffers();
      } catch (e) {
        console.error("🔴 Erreur initialisation OrderModal:", e);
      }
    }
  }, [visible, item?.id]);

  const loadExistingOffers = async () => {
    setLoadingOffers(true);
    try {
      const allOffers = await apiFetch("/offers/upcoming?days=7", { method: "GET" }, false);
      const productIdNum = Number(productId);
      const filtered = (allOffers || []).filter((o: any) => Number(o.product?.id) === productIdNum);
      setExistingOffers(filtered);
    } catch (err: any) {
      console.error("❌ Erreur chargement offres:", err);
      setExistingOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  const loadDeliveryZones = async () => {
    try {
      const data = await apiFetch("/admin/settings/delivery-zones", {
        method: "GET",
        headers: { Authorization: `Bearer ${await AsyncStorage.getItem("access_token") || ""}` },
      });
      setAdminZones(data.zones || []);
      setBaseDeliveryPrice(data.price || 1000);
    } catch {
      setAdminZones(["Bastos", "Bonapriso", "Centre-ville", "Biymassi", "Mendong"]);
      setBaseDeliveryPrice(1000);
    }
  };

  const calculateDeliveryPrice = () => {
    if (!userZone.trim()) return baseDeliveryPrice;
    const isKnownZone = adminZones.some((z) => z.toLowerCase().trim() === userZone.trim().toLowerCase());
    return isKnownZone ? baseDeliveryPrice : baseDeliveryPrice + 500;
  };

  const totalPrice = pricePerUnit * portions;
  const deliveryPrice = calculateDeliveryPrice();
  const finalTotal = totalPrice + deliveryPrice;
  const deposit = Math.round(finalTotal * 0.4);

  const handleValidation = async () => {
    if (loading) return;

    if (!complement) {
      showAlert("Choix obligatoire", "Veuillez sélectionner un accompagnement.");
      return;
    }
    if (!userZone || !phone) {
      showAlert("Oups !", "Veuillez remplir votre quartier et votre numéro de téléphone.");
      return;
    }

    setLoading(true);
    try {
      const orderResult = await apiFetch("/orders/create", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          target_date: selectedDateStr || lockedOfferDate,
          portions,
          delivery_zone: userZone.trim(),
          complement,
          delivery_time: deliveryTime,
          phone: phone.trim(),
          affiliate_code: null,
          city_id: selectedCity?.id || null, // ✅ PASSAGE DE LA VILLE
        }),
      }, true);

      if (!orderResult.order_id) throw new Error("Échec création commande");

      const campayResult = await apiFetch("/payments/campay/init", {
        method: "POST",
        body: JSON.stringify({
          order_id: orderResult.order_id,
          amount: deposit,
          phone: phone.trim(),
          description: `Acompte 40% - ${productName} (${portions} portions)`,
        }),
      }, true);

      if (campayResult.payment_url && campayResult.payment_url.includes("mock")) {
        showAlert("💳 Simulation de Paiement", `Commande créée !\n\nAcompte simulé : ${deposit} FCFA`, [
          { text: "Annuler", style: "cancel", onPress: onClose },
          {
            text: "✅ Confirmer le paiement",
            onPress: async () => {
              try {
                await apiFetch("/payments/simulate-success", { method: "POST", body: JSON.stringify({ order_id: orderResult.order_id }) }, true);
                showAlert("Succès", "Paiement simulé réussi !");
                onConfirm();
                onClose();
              } catch (error: any) {
                showAlert("Erreur", "Échec simulation : " + error.message);
              }
            },
          },
        ]);
      } else {
        showAlert("Paiement requis 💳", `Veuillez payer l'acompte de ${campayResult.deposit_amount || deposit} FCFA.`, [
          { text: "Payer maintenant", onPress: () => { Linking.openURL(campayResult.payment_url); onConfirm(); } },
          { text: "Annuler", style: "cancel", onPress: onClose },
        ]);
      }
    } catch (error: any) {
      console.error("❌ Erreur:", error);
      showAlert("Erreur", error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <ErrorBoundary fallbackMessage="Erreur lors du chargement de la commande" onReset={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.indicator} />
          <Text style={styles.title}>{productName || "Plat"}</Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* ✅ Masque complètement le sélecteur de date si isCatalogueProduct === false */}
            {isCatalogueProduct ? (
              <View style={styles.dateSelectorContainer}>
                <Text style={styles.label}>📅 Choisissez votre date de réservation :</Text>
                {loadingOffers ? (
                  <ActivityIndicator size="small" color="#E31C25" style={{ marginVertical: 15 }} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateSelector}>
                    {availableDates.map((dateOption, index) => {
                      const isSelected = selectedDateIndex === index;
                      return (
                        <TouchableOpacity key={dateOption.date} onPress={() => setSelectedDateIndex(index)} style={[styles.dateOption, isSelected && styles.dateOptionSelected]}>
                          <Text style={[styles.dateOptionText, isSelected && styles.dateOptionTextSelected]}>{dateOption.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
                <View style={[styles.marketingBanner, { borderLeftColor: marketingState.color }]}>
                  <Text style={[styles.marketingText, { color: marketingState.color }]}>{marketingState.text}</Text>
                </View>
              </View>
            ) : lockedOfferDate ? (
              <View style={styles.lockedDateContainer}>
                <Text style={styles.lockedDateText}>📅 Date fixe Menu du Jour : <Text style={{fontWeight: "900", color: "#E31C25"}}>{lockedOfferDate}</Text></Text>
              </View>
            ) : null}

            <Text style={styles.label}>🍽️ Nombre de portions ({pricePerUnit} FCFA/portion) :</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity style={[styles.counterBtn, portions <= 1 && styles.counterBtnDisabled]} onPress={() => portions > 1 && setPortions(portions - 1)} disabled={portions <= 1}>
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{portions}</Text>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setPortions(portions + 1)}>
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>⏰ Heure de livraison :</Text>
            <View style={styles.timeRow}>
              {["12:00", "13:00", "18:00", "19:00"].map((time) => (
                <TouchableOpacity key={time} onPress={() => setDeliveryTime(time)} style={[styles.timeChip, deliveryTime === time && styles.timeChipActive]}>
                  <Text style={[styles.timeChipText, deliveryTime === time && styles.timeChipTextActive]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>📍 Votre quartier :</Text>
            <TextInput placeholder="Ex: Bastos, Bonapriso..." style={styles.input} value={userZone} onChangeText={setUserZone} />
            <View style={styles.deliveryPriceInfo}>
              <Text style={styles.deliveryPriceText}>🚚 Livraison : {deliveryPrice} FCFA</Text>
            </View>

            <Text style={styles.label}>🥘 Accompagnement <Text style={styles.requiredText}>*</Text> :</Text>
            <View style={styles.wrapRow}>
              {/* ✅ CORRECTION INFAILLIBLE DE L'AFFICHAGE DES CHIPS */}
              {finalComplements.split(",").map((comp: string) => {
                const cleanComp = comp.trim();
                if (!cleanComp) return null;
                const isSelected = complement === cleanComp;
                return (
                  <TouchableOpacity key={cleanComp} onPress={() => setComplement(cleanComp)} style={[styles.chip, isSelected ? styles.activeChip : styles.inactiveChip]}>
                    <Text style={isSelected ? styles.activeText : styles.chipText}>{cleanComp}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!complement && <Text style={styles.errorHint}>⚠️ Veuillez choisir un accompagnement.</Text>}

            <Text style={styles.label}>📱 Numéro WhatsApp :</Text>
            <TextInput placeholder="Ex: 670040405" style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

            <View style={styles.priceContainer}>
              <View style={styles.priceLine}><Text style={styles.priceLabel}>Repas ({portions} portion{portions > 1 ? "s" : ""})</Text><Text style={styles.priceValue}>{totalPrice} FCFA</Text></View>
              <View style={styles.priceLine}><Text style={styles.priceLabel}>Livraison</Text><Text style={styles.priceValue}>{deliveryPrice} FCFA</Text></View>
              <View style={styles.totalLine}><Text style={styles.totalLabel}>TOTAL</Text><Text style={styles.totalValue}>{finalTotal} FCFA</Text></View>
              <View style={styles.depositBox}>
                <Text style={styles.depositText}>ACOMPTE 40% À PAYER</Text>
                <Text style={styles.depositAmount}>{deposit} FCFA</Text>
                <Text style={styles.remainingText}>Solde à la livraison : {finalTotal - deposit} FCFA</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.payButton, loading && { opacity: 0.6 }]}
              onPress={handleValidation}
              disabled={loading}
            >
              <Text style={styles.payButtonText}>{loading ? "Traitement..." : `🔥 RÉSERVER (${safeFormatNumber(deposit)} F)`}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      </ErrorBoundary>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  content: { backgroundColor: "white", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: "90%" },
  indicator: { width: 50, height: 5, backgroundColor: "#ccc", borderRadius: 10, marginBottom: 15, alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#333", textAlign: "center", marginBottom: 5 },
  scroll: { width: "100%" },
  label: { fontSize: 13, fontWeight: "bold", color: "#666", marginTop: 15, marginBottom: 8 },
  dateSelectorContainer: { marginBottom: 10 },
  dateSelector: { flexDirection: "row", marginTop: 5 },
  dateOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: "#f1f5f9", marginRight: 8, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  dateOptionSelected: { backgroundColor: "#E31C25", borderColor: "#E31C25" },
  dateOptionText: { fontSize: 11, fontWeight: "700", color: "#64748b", textAlign: "center" },
  dateOptionTextSelected: { color: "white" },
  marketingBanner: { backgroundColor: "#F8FAFC", padding: 12, borderRadius: 8, marginTop: 12, borderLeftWidth: 4 },
  marketingText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  counterContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  counterBtn: { width: 50, height: 50, backgroundColor: "#E31C25", borderRadius: 25, justifyContent: "center", alignItems: "center" },
  counterBtnDisabled: { backgroundColor: "#ccc" },
  counterBtnText: { fontSize: 24, fontWeight: "bold", color: "white" },
  counterValue: { fontSize: 32, fontWeight: "900", marginHorizontal: 30, color: "#0f172a" },
  timeRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  timeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f1f5f9", marginRight: 8, marginBottom: 8 },
  timeChipActive: { backgroundColor: "#E31C25" },
  timeChipText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  timeChipTextActive: { color: "white" },
  input: { width: "100%", backgroundColor: "#f9f9f9", borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: "#eee", fontWeight: "bold", fontSize: 16 },
  deliveryPriceInfo: { backgroundColor: "#f0fdf4", padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: "#bbf7d0" },
  deliveryPriceText: { fontSize: 12, fontWeight: "600", color: "#166534" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  inactiveChip: { backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#cbd5e1" },
  activeChip: { backgroundColor: "#E31C25", borderWidth: 1, borderColor: "#E31C25" },
  chipText: { color: "#333", fontWeight: "600" },
  activeText: { color: "white", fontWeight: "bold" },
  requiredText: { color: "#E31C25", fontWeight: "900" },
  errorHint: { color: "#E31C25", fontSize: 11, fontWeight: "600", marginTop: -4, marginBottom: 8, fontStyle: "italic" },
  priceContainer: { width: "100%", marginTop: 15, borderTopWidth: 1, borderColor: "#eee", paddingTop: 10 },
  priceLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  priceLabel: { color: "#777" },
  priceValue: { fontWeight: "bold" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: "#eee", paddingTop: 10, marginTop: 5 },
  totalLabel: { fontWeight: "bold", fontSize: 16 },
  totalValue: { fontWeight: "bold", fontSize: 18, color: "#000" },
  depositBox: { width: "100%", backgroundColor: "#fff5f5", padding: 15, borderRadius: 15, marginVertical: 15, alignItems: "center", borderWidth: 1, borderColor: "#fecaca" },
  depositText: { fontSize: 12, color: "#E31C25", fontWeight: "bold" },
  depositAmount: { fontSize: 26, fontWeight: "bold", color: "#E31C25" },
  remainingText: { fontSize: 12, color: "#666", marginTop: 5 },
  payButton: { backgroundColor: "#000", paddingVertical: 18, borderRadius: 15, width: "100%", alignItems: "center", marginTop: 10 },
  payButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  cancelButton: { marginTop: 15, marginBottom: 30, alignItems: "center" },
  cancelButtonText: { color: "#999", fontWeight: "bold" },
  lockedDateContainer: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: "#fecaca" },
  lockedDateText: { fontSize: 13, fontWeight: "600", color: "#991b1b", textAlign: "center" },
});

export default OrderModal;