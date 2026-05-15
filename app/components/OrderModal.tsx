import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
} from "react-native";

// ✅ IMPORT API CONFIG (remplace les fetch locaux)
import { apiFetch } from "@/config/api";

const OrderModal = ({ visible, onClose, item, onConfirm }: any) => {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSize, setSelectedSize] = useState("solo");
  const [familyCount, setFamilyCount] = useState(3);
  const [selectedComplement, setSelectedComplement] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [userZoneInput, setUserZoneInput] = useState("");
  const [adminZones, setAdminZones] = useState<string[]>([]);
  const [baseDeliveryPrice, setBaseDeliveryPrice] = useState(1000);

  // ❌ SUPPRIMÉ : const SERVER_IP = "127.0.0.1";

  // --- LOGIQUE DE DATE AUTOMATIQUE ---
  const getFormattedDate = (daysToAdd: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  };

  const todayStr = getFormattedDate(0);
  const tomorrowStr = getFormattedDate(1);

  useEffect(() => {
    const loadData = async () => {
      const savedPhone = await AsyncStorage.getItem("user_phone");
      if (savedPhone) setPhone(savedPhone);

      try {
        // ✅ Utilise apiFetch au lieu de fetch local
        const data = await apiFetch("/admin/settings/delivery-zones");
        setAdminZones(data.zones || []);
        setBaseDeliveryPrice(data.price || 1000);
      } catch (err: any) {
        console.log("⚠️ Zones de livraison non chargées :", err.message);
        // Fallback silencieux pour ne pas bloquer l'UX
      }
    };
    if (visible) {
      loadData();
      setDeliveryDate(todayStr);
    }
  }, [visible]);

  const calculateDelivery = () => {
    if (!userZoneInput.trim()) return baseDeliveryPrice;
    const isKnown = adminZones.some(
      (z) => z.toLowerCase().trim() === userZoneInput.trim().toLowerCase(),
    );
    return isKnown ? baseDeliveryPrice : baseDeliveryPrice + 500;
  };

  const calculateFoodPrice = () => {
    if (!item) return 0;
    const soloPrice = item.price || 0;
    if (selectedSize === "duo") return item.price_duo || soloPrice * 2;
    if (selectedSize === "famille") return soloPrice * familyCount - 500;
    return soloPrice;
  };

  const formatTime = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length >= 3)
      return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    return cleaned;
  };

  const foodPrice = calculateFoodPrice();
  const currentDeliveryPrice = calculateDelivery();
  const totalPrice = foodPrice + currentDeliveryPrice;
  const deposit = Math.round(totalPrice * 0.4); // Arrondi pour Mobile Money
  const remaining = totalPrice - deposit;

  // ✅ FONCTION handleValidation CORRIGÉE
  const handleValidation = async () => {
    if (
      !customerName ||
      !phone ||
      !userZoneInput ||
      !selectedComplement ||
      !deliveryDate ||
      !deliveryTime
    ) {
      Alert.alert("Oups !", "Tous les champs sont obligatoires.");
      return;
    }

    const orderPayload = {
      product_name: item.product_name,
      customer_name: customerName,
      phone: phone.trim(),
      zone: userZoneInput.trim(),
      total_amount: totalPrice,
      deposit_amount: deposit,
      portion_size: selectedSize,
      delivery_date: deliveryDate,
      delivery_time: deliveryTime,
      complement: selectedComplement,
      affiliate_code: null,
    };

    try {
      // ÉTAPE 1 : Créer la commande via apiFetch
      const orderResult = await apiFetch("/orders/create", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      if (!orderResult.order_id) {
        throw new Error("Échec de la création de commande");
      }

      const orderId = orderResult.order_id;
      Alert.alert(
        "Commande créée ! 📦",
        `ID: #${orderId}\nInitialisation du paiement...`,
      );

      // ÉTAPE 2 : Initialiser le paiement Campay
      const campayResult = await apiFetch("/payments/campay/init", {
        method: "POST",
        body: JSON.stringify({
          order_id: orderId,
          amount: totalPrice,
          phone: phone.trim(),
          description: `Acompte 40% - Commande #${orderId} - ${item.product_name}`,
        }),
      });

      if (!campayResult.success) {
        throw new Error("Échec de l'initialisation du paiement");
      }

      // ÉTAPE 3 : Rediriger vers Campay
      Alert.alert(
        "Paiement requis 💳",
        `Veuillez payer l'acompte de ${campayResult.deposit_amount} FCFA pour confirmer votre commande.`,
        [
          {
            text: "Payer maintenant",
            onPress: async () => {
              const canOpen = await Linking.canOpenURL(
                campayResult.payment_url,
              );
              if (canOpen) {
                Linking.openURL(campayResult.payment_url);
                pollPaymentStatus(campayResult.reference, orderId);
              } else {
                Alert.alert(
                  "Erreur",
                  "Impossible d'ouvrir la page de paiement.",
                );
              }
            },
          },
          { text: "Plus tard", style: "cancel" },
        ],
      );

      onClose();
    } catch (error: any) {
      console.error("❌ Erreur commande/paiement:", error);
      Alert.alert(
        "Erreur",
        error.message || "Une erreur est survenue. Veuillez réessayer.",
      );
    }
  };

  // ✅ FONCTION pollPaymentStatus CORRIGÉE
  const pollPaymentStatus = (
    reference: string,
    orderId: number,
    maxAttempts = 20,
  ) => {
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await apiFetch(`/payments/campay/status/${reference}`);

        if (
          result.order_status === "acompte_paye" ||
          result.status === "SUCCESS"
        ) {
          clearInterval(interval);
          Alert.alert(
            "Paiement confirmé ! ✅",
            `Votre acompte est reçu. La préparation de votre ${item?.product_name} commence !`,
            [
              {
                text: "Suivre ma commande",
                onPress: () => {
                  /* Navigation vers suivi */
                },
              },
            ],
          );
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          Alert.alert(
            "En attente de confirmation",
            "Nous n'avons pas encore reçu la confirmation de Campay. Votre paiement sera vérifié automatiquement. Vous recevrez une notification dès que c'est bon !",
            [{ text: "OK" }],
          );
        }
      } catch (error) {
        console.error("Erreur polling:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.indicator} />
          <Text style={styles.modalTitle}>KEMTCHOP EXPRESS</Text>
          <Text style={styles.itemTitle}>{item?.product_name}</Text>

          <ScrollView
            style={{ width: "100%" }}
            showsVerticalScrollIndicator={false}
          >
            {/* DATE DE LIVRAISON AMÉLIORÉE */}
            <Text style={styles.label}>Quand livrer ?</Text>
            <View style={[styles.row, { marginBottom: 10 }]}>
              <TouchableOpacity
                style={[
                  styles.dateBtn,
                  deliveryDate === todayStr && styles.activeDateBtn,
                ]}
                onPress={() => setDeliveryDate(todayStr)}
              >
                <Text
                  style={[
                    styles.dateBtnText,
                    deliveryDate === todayStr && styles.activeText,
                  ]}
                >
                  AUJOURD'HUI
                </Text>
                <Text
                  style={[
                    styles.dateSubText,
                    deliveryDate === todayStr && styles.activeText,
                  ]}
                >
                  {todayStr}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateBtn,
                  deliveryDate === tomorrowStr && styles.activeDateBtn,
                ]}
                onPress={() => setDeliveryDate(tomorrowStr)}
              >
                <Text
                  style={[
                    styles.dateBtnText,
                    deliveryDate === tomorrowStr && styles.activeText,
                  ]}
                >
                  DEMAIN
                </Text>
                <Text
                  style={[
                    styles.dateSubText,
                    deliveryDate === tomorrowStr && styles.activeText,
                  ]}
                >
                  {tomorrowStr}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TextInput
                placeholder="Autre (JJ/MM)"
                style={[styles.input, { flex: 1, marginRight: 10 }]}
                value={
                  deliveryDate !== todayStr && deliveryDate !== tomorrowStr
                    ? deliveryDate
                    : ""
                }
                onChangeText={setDeliveryDate}
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                placeholder="Heure (Ex: 12:30)"
                style={[styles.input, { flex: 1 }]}
                value={deliveryTime}
                keyboardType="number-pad"
                maxLength={5}
                onChangeText={(t) => setDeliveryTime(formatTime(t))}
              />
            </View>

            <Text style={styles.label}>Ton quartier / Zone :</Text>
            <TextInput
              placeholder="Ex: Bastos, Bonapriso..."
              style={styles.input}
              value={userZoneInput}
              onChangeText={setUserZoneInput}
            />

            {/* PORTIONS */}
            <Text style={styles.label}>Choix de la portion :</Text>
            <View style={styles.row}>
              {["solo", "duo", "famille"].map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  style={[
                    styles.chip,
                    selectedSize === size && styles.activeChip,
                  ]}
                >
                  <Text
                    style={
                      selectedSize === size
                        ? styles.activeText
                        : styles.chipText
                    }
                  >
                    {size.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* COMPTEUR FAMILLE */}
            {selectedSize === "famille" && (
              <View style={styles.familyPicker}>
                <Text style={styles.familyLabel}>Nombre de personnes :</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() =>
                      familyCount > 3 && setFamilyCount(familyCount - 1)
                    }
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.countNumber}>{familyCount}</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setFamilyCount(familyCount + 1)}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.promoHint}>
                  -500 FCFA de remise appliquée !
                </Text>
              </View>
            )}

            {/* ACCOMPAGNEMENT */}
            <Text style={styles.label}>Accompagnement :</Text>
            <View style={styles.wrapRow}>
              {(
                item?.complements?.split(",") || ["Bâton", "Manioc", "Plantain"]
              ).map((comp: string) => (
                <TouchableOpacity
                  key={comp}
                  onPress={() => setSelectedComplement(comp.trim())}
                  style={[
                    styles.chip,
                    { marginBottom: 10 },
                    selectedComplement === comp.trim() && styles.activeChip,
                  ]}
                >
                  <Text
                    style={
                      selectedComplement === comp.trim()
                        ? styles.activeText
                        : styles.chipText
                    }
                  >
                    {comp.trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* COORDONNÉES */}
            <Text style={styles.label}>Tes coordonnées :</Text>
            <TextInput
              placeholder="Nom complet"
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              placeholder="Numéro WhatsApp"
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {/* RÉCAPITULATIF */}
            <View style={styles.priceContainer}>
              <View style={styles.priceLine}>
                <Text style={styles.priceLabel}>Repas ({selectedSize})</Text>
                <Text style={styles.priceValue}>{foodPrice} F</Text>
              </View>
              <View style={styles.priceLine}>
                <Text style={styles.priceLabel}>Livraison</Text>
                <Text style={styles.priceValue}>{currentDeliveryPrice} F</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>TOTAL À PAYER</Text>
                <Text style={styles.totalValue}>{totalPrice} FCFA</Text>
              </View>
            </View>

            <View style={styles.depositBox}>
              <Text style={styles.depositText}>ACOMPTE 40% REQUIS :</Text>
              <Text style={styles.depositAmount}>{deposit} FCFA</Text>
              <Text style={styles.remainingText}>
                Reste au livreur : {remaining} FCFA
              </Text>
            </View>

            <TouchableOpacity
              style={styles.payButton}
              onPress={handleValidation}
            >
              <Text style={styles.payButtonText}>VALIDER LA COMMANDE</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    alignItems: "center",
    maxHeight: "95%",
  },
  indicator: {
    width: 50,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#E31C25",
    letterSpacing: 2,
  },
  itemTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666",
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
    fontWeight: "bold",
  },
  row: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  activeChip: { backgroundColor: "#E31C25" },
  chipText: { color: "#333", fontWeight: "600" },
  activeText: { color: "white", fontWeight: "bold" },
  dateBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    alignItems: "center",
    marginRight: 5,
  },
  activeDateBtn: { backgroundColor: "#000" },
  dateBtnText: { fontSize: 10, fontWeight: "900", color: "#333" },
  dateSubText: { fontSize: 14, fontWeight: "bold", color: "#666" },
  familyPicker: {
    width: "100%",
    backgroundColor: "#fff5f5",
    padding: 15,
    borderRadius: 15,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#ffdfdf",
  },
  familyLabel: {
    fontWeight: "bold",
    color: "#E31C25",
    marginBottom: 10,
    textAlign: "center",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtn: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  counterBtnText: { fontSize: 20, fontWeight: "bold", color: "#E31C25" },
  countNumber: { fontSize: 22, fontWeight: "bold", marginHorizontal: 25 },
  promoHint: {
    textAlign: "center",
    fontSize: 10,
    color: "#2D6A4F",
    marginTop: 8,
    fontWeight: "bold",
  },
  priceContainer: {
    width: "100%",
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 10,
  },
  priceLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  priceLabel: { color: "#777" },
  priceValue: { fontWeight: "bold" },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: { fontWeight: "bold", fontSize: 16 },
  totalValue: { fontWeight: "bold", fontSize: 18, color: "#000" },
  depositBox: {
    width: "100%",
    backgroundColor: "#fff5f5",
    padding: 15,
    borderRadius: 15,
    marginVertical: 15,
    alignItems: "center",
  },
  depositText: { fontSize: 12, color: "#E31C25", fontWeight: "bold" },
  depositAmount: { fontSize: 26, fontWeight: "bold", color: "#E31C25" },
  remainingText: { fontSize: 12, color: "#666", marginTop: 5 },
  payButton: {
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
  },
  payButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  cancelButton: { marginTop: 15, marginBottom: 30 },
  cancelButtonText: { color: "#999", fontWeight: "bold" },
});

export default OrderModal;
