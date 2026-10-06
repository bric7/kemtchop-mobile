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
  const fallbackDates = generateNext7Days();
  
  const [existingOffers, setExistingOffers] = useState<any[]>([]);
  const [availabilityDates, setAvailabilityDates] = useState<any[]>([]);
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
  const [customizationNote, setCustomizationNote] = useState("");
  const [showCustomization, setShowCustomization] = useState(false);

  const productName = isCatalogueProduct ? item?.name : item?.product?.name;
  const productId = isCatalogueProduct ? item?.id : item?.product?.id;

  // 🥩 Variantes de préparation du plat (ex: Viande, Poisson, Crevettes)
  const initialVariants = (item?.variants || item?.product?.variants || []).filter((v: any) => v.is_active !== false);
  const [variantsList, setVariantsList] = useState<any[]>(initialVariants);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(() => {
    return initialVariants.length > 0 ? initialVariants[0].id : null;
  });

  const selectedVariant = variantsList.find((v: any) => v.id === selectedVariantId) || null;
  const basePrice = isCatalogueProduct ? (item?.price || 2500) : (item?.price_per_unit || 0);
  const pricePerUnit = selectedVariant ? Number(selectedVariant.price) : basePrice;

  // Liste effective des dates (dynamique depuis le backend ou fallback généré)
  const datesList = availabilityDates.length > 0 ? availabilityDates : fallbackDates.map(d => ({ ...d, is_open: true }));

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

  const selectedDateStr = datesList[selectedDateIndex]?.date;
  const currentOffer = existingOffers.find((o: any) => o.target_date === selectedDateStr && Number(o.product?.id) === Number(productId));
  const marketingState = getMarketingMessage(currentOffer, 4);

  useEffect(() => {
    if (visible) {
      try {
        const itemVars = (item?.variants || item?.product?.variants || []).filter((v: any) => v.is_active !== false);
        setVariantsList(itemVars);
        setSelectedVariantId(itemVars.length > 0 ? itemVars[0].id : null);

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
        loadExistingOffers();
      } catch (e) {
        console.error("🔴 Erreur initialisation OrderModal:", e);
      }
    }
  }, [visible, item?.id]);

  const loadExistingOffers = async () => {
    setLoadingOffers(true);
    try {
      if (productId) {
        const cityParam = selectedCity?.id ? `?city_id=${selectedCity.id}` : "";
        const availability = await apiFetch(`/products/${productId}/availability${cityParam}`, { method: "GET" }, false).catch(() => null);
        if (availability?.reservations?.dates?.length > 0) {
          setAvailabilityDates(availability.reservations.dates);
          const firstOpenIdx = availability.reservations.dates.findIndex((d: any) => d.is_open);
          if (firstOpenIdx !== -1) {
            setSelectedDateIndex(firstOpenIdx);
          }
        }
        if (availability?.variants && availability.variants.length > 0) {
          const activeVars = availability.variants.filter((v: any) => v.is_active !== false);
          setVariantsList(activeVars);
          setSelectedVariantId((prev) => (prev ? prev : (activeVars.length > 0 ? activeVars[0].id : null)));
        }
      }
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
          variant_id: selectedVariantId || null,
          target_date: selectedDateStr || lockedOfferDate,
          portions,
          delivery_zone: userZone.trim(),
          complement,
          customization_note: customizationNote.trim() ? customizationNote.trim() : null,
          delivery_time: deliveryTime,
          phone: phone.trim(),
          affiliate_code: null,
          city_id: selectedCity?.id || null, // ✅ PASSAGE DE LA VILLE
        }),
      }, true);

      if (!orderResult.order_id) throw new Error("Échec création commande");

      // ✅ SebPay : le backend calcule lui-même l'acompte de 40 % à partir du TOTAL
      const variantSuffix = selectedVariant ? ` (${selectedVariant.name})` : "";
      const paymentResult = await apiFetch("/payments/sebpay/init", {
        method: "POST",
        body: JSON.stringify({
          order_id: orderResult.order_id,
          amount: finalTotal,
          phone: phone.trim(),
          description: `Acompte 40% - ${productName}${variantSuffix} (${portions} portions)`,
        }),
      }, true);

      const paidDeposit = paymentResult.deposit_amount || deposit;

      if (paymentResult.payment_url) {
        showAlert("Paiement requis 💳", `Veuillez payer l'acompte de ${paidDeposit} FCFA.`, [
          { text: "Annuler", style: "cancel", onPress: onClose },
          { text: "Payer maintenant", onPress: () => { Linking.openURL(paymentResult.payment_url); onConfirm(); } },
        ]);
      } else {
        showAlert(
          "Validez le paiement 📱",
          `${paymentResult.message || `Une demande de ${paidDeposit} FCFA a été envoyée sur votre téléphone.`}\n\n⚠️ Important : Votre solde Mobile Money doit être supérieur à ${paidDeposit} FCFA.\n\nValidez avec votre code PIN secret sur votre téléphone.`,
          [{ text: "J'ai validé", onPress: () => { onConfirm(); onClose(); } }]
        );
      }
    } catch (error: any) {
      console.error("❌ Erreur:", error);
      const errorMsg = error?.data?.detail || error?.message || "Une erreur est survenue.";
      showAlert(
        "Information commande",
        `${errorMsg}\n\n💡 Conseil : Assurez-vous que votre compte Orange Money ou MTN MoMo est actif et que votre solde est supérieur au montant de l'acompte.`
      );
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
                    {datesList.map((dateOption: any, index: number) => {
                      const isSelected = selectedDateIndex === index;
                      const isOpen = dateOption.is_open ?? true;
                      return (
                        <TouchableOpacity
                          key={dateOption.date}
                          onPress={() => {
                            if (!isOpen) {
                              showAlert("Réservation non disponible", dateOption.status_message || "Les réservations pour cette date sont closes.");
                              return;
                            }
                            setSelectedDateIndex(index);
                          }}
                          style={[
                            styles.dateOption,
                            isSelected && styles.dateOptionSelected,
                            !isOpen && styles.dateOptionDisabled
                          ]}
                          activeOpacity={isOpen ? 0.7 : 0.9}
                        >
                          <Text style={[
                            styles.dateOptionText,
                            isSelected && styles.dateOptionTextSelected,
                            !isOpen && styles.dateOptionTextDisabled
                          ]}>
                            {dateOption.label}
                          </Text>
                          {!isOpen && (
                            <Text style={styles.closedTag}>Clôturé</Text>
                          )}
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

            {/* 🥩 SÉLECTEUR DE VARIANTE (ex: Viande, Poisson, Crevettes) */}
            {variantsList.length > 0 && (
              <View style={styles.variantSection}>
                <Text style={styles.label}>🥩 Choisissez votre préparation :</Text>
                <View style={styles.variantList}>
                  {variantsList.map((v: any) => {
                    const isSelected = selectedVariantId === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        onPress={() => setSelectedVariantId(v.id)}
                        style={[
                          styles.variantOption,
                          isSelected && styles.variantOptionSelected
                        ]}
                        activeOpacity={0.8}
                      >
                        <View style={styles.variantOptionLeft}>
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                            {isSelected && <View style={styles.radioInnerCircle} />}
                          </View>
                          <Text style={[styles.variantNameText, isSelected && styles.variantNameTextSelected]}>
                            {v.name}
                          </Text>
                        </View>
                        <Text style={[styles.variantPriceText, isSelected && styles.variantPriceTextSelected]}>
                          {safeFormatNumber(v.price)} FCFA
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <Text style={styles.label}>{`🍽️ Nombre de portions (${pricePerUnit} FCFA/portion) :`}</Text>
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
              <Text style={styles.deliveryPriceText}>{`🚚 Livraison : ${deliveryPrice} FCFA`}</Text>
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

            {/* ✨ PRÉFÉRENCE DE PRÉPARATION (OPTIONNEL & PLIABLE) */}
            <View style={styles.customizationSection}>
              <TouchableOpacity
                style={styles.customizationToggleBtn}
                onPress={() => setShowCustomization(!showCustomization)}
                activeOpacity={0.7}
              >
                <Text style={styles.customizationToggleText}>
                  {showCustomization ? "▼ ✨ Préférence de préparation" : "▶ ✨ Ajouter une préférence de préparation (optionnel)"}
                </Text>
              </TouchableOpacity>

              {showCustomization && (
                <View style={styles.customizationBox}>
                  <Text style={styles.customizationTitle}>Comment souhaitez-vous votre plat ?</Text>
                  <Text style={styles.customizationDisclaimer}>
                    ✨ Nous ferons notre possible pour respecter votre demande.
                  </Text>
                  <TextInput
                    placeholder="Ex: un peu de sel, peu de cube, pas trop d'huile..."
                    placeholderTextColor="#94a3b8"
                    style={styles.customizationInput}
                    value={customizationNote}
                    onChangeText={setCustomizationNote}
                    maxLength={300}
                    multiline
                    numberOfLines={2}
                  />
                  <View style={styles.charCounterRow}>
                    <Text style={styles.charCounterText}>{customizationNote.length}/300 caractères</Text>
                    {customizationNote.trim().length > 0 && (
                      <TouchableOpacity onPress={() => setCustomizationNote("")}>
                        <Text style={styles.clearNoteText}>Effacer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.label}>📱 Numéro Mobile Money (Orange ou MTN) :</Text>
            <TextInput placeholder="Ex: 697000000 ou 670000000" style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <Text style={styles.phoneHint}>Ce numéro recevra la demande de débit Mobile Money.</Text>

            <View style={styles.priceContainer}>
              <View style={styles.priceLine}>
                <Text style={styles.priceLabel}>
                  {selectedVariant
                    ? `Repas — ${selectedVariant.name} (${portions} portion${portions > 1 ? "s" : ""})`
                    : `Repas (${portions} portion${portions > 1 ? "s" : ""})`}
                </Text>
                <Text style={styles.priceValue}>{`${totalPrice} FCFA`}</Text>
              </View>
              <View style={styles.priceLine}><Text style={styles.priceLabel}>Livraison</Text><Text style={styles.priceValue}>{`${deliveryPrice} FCFA`}</Text></View>
              {customizationNote.trim().length > 0 && (
                <View style={styles.recapCustomizationLine}>
                  <Text style={styles.recapCustomizationLabel}>✨ Préférence :</Text>
                  <Text style={styles.recapCustomizationValue} numberOfLines={2}>« {customizationNote.trim()} »</Text>
                </View>
              )}
              <View style={styles.totalLine}><Text style={styles.totalLabel}>TOTAL</Text><Text style={styles.totalValue}>{`${finalTotal} FCFA`}</Text></View>
              <View style={styles.depositBox}>
                <Text style={styles.depositText}>ACOMPTE 40% À PAYER</Text>
                <Text style={styles.depositAmount}>{`${deposit} FCFA`}</Text>
                <Text style={styles.remainingText}>{`Solde à la livraison : ${finalTotal - deposit} FCFA`}</Text>
                <View style={styles.balanceNotice}>
                  <Text style={styles.balanceNoticeText}>
                    {`⚠️ Solde requis : Votre compte Orange Money ou MTN MoMo doit avoir au moins ${safeFormatNumber(deposit)} FCFA pour valider ce paiement.`}
                  </Text>
                </View>
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
  dateOptionDisabled: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", opacity: 0.6 },
  dateOptionText: { fontSize: 11, fontWeight: "700", color: "#64748b", textAlign: "center" },
  dateOptionTextSelected: { color: "white" },
  dateOptionTextDisabled: { color: "#94a3b8" },
  closedTag: { fontSize: 8, fontWeight: "900", color: "#dc2626", marginTop: 2, textTransform: "uppercase" },
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
  phoneHint: { fontSize: 11, color: "#64748b", marginTop: -6, marginBottom: 12, fontStyle: "italic" },
  balanceNotice: { marginTop: 10, width: "100%", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fffbeb", borderRadius: 10, borderWidth: 1, borderColor: "#fef3c7" },
  balanceNoticeText: { fontSize: 11, color: "#92400e", fontWeight: "600", textAlign: "center", lineHeight: 16 },
  customizationSection: { width: "100%", marginVertical: 8 },
  customizationToggleBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  customizationToggleText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  customizationBox: { marginTop: 8, padding: 12, backgroundColor: "#fffbeb", borderRadius: 12, borderWidth: 1, borderColor: "#fef3c7" },
  customizationTitle: { fontSize: 13, fontWeight: "800", color: "#92400e", marginBottom: 2 },
  customizationDisclaimer: { fontSize: 11, color: "#b45309", marginBottom: 8, fontStyle: "italic" },
  customizationInput: { backgroundColor: "#ffffff", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#fde68a", fontSize: 13, color: "#1e293b", minHeight: 48, textAlignVertical: "top" },
  charCounterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  charCounterText: { fontSize: 10, color: "#94a3b8" },
  clearNoteText: { fontSize: 11, color: "#ef4444", fontWeight: "700" },
  recapCustomizationLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "#fffbeb", borderRadius: 6 },
  recapCustomizationLabel: { fontSize: 11, fontWeight: "800", color: "#92400e" },
  recapCustomizationValue: { fontSize: 11, fontStyle: "italic", color: "#78350f", flex: 1, textAlign: "right", marginLeft: 8 },
  variantSection: { width: "100%", marginTop: 8, marginBottom: 4 },
  variantList: { flexDirection: "column", marginTop: 4 },
  variantOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  variantOptionSelected: {
    backgroundColor: "#fef2f2",
    borderColor: "#E31C25",
  },
  variantOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: "#E31C25",
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E31C25",
  },
  variantNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  variantNameTextSelected: {
    color: "#991b1b",
    fontWeight: "800",
  },
  variantPriceText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748b",
  },
  variantPriceTextSelected: {
    color: "#E31C25",
    fontWeight: "900",
  },
});

export default OrderModal;