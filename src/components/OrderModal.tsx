// app/components/OrderModal.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useMemo } from "react";
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
import { trackEvent, tagClarityEvent } from "../services/analytics";
import { useTranslation } from "../i18n/LanguageContext";

// ✅ GÉNÉRATEUR DE DATES BLINDÉ (Fuseau horaire Afrique/Douala)
const generateNext7Days = (isEnglish: boolean = false): { date: string; label: string }[] => {
  const dates = [];
  const now = new Date();
  const locale = isEnglish ? 'en-US' : 'fr-FR';
  const formatter = new Intl.DateTimeFormat(locale, {
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
    
    const label = nextDate.toLocaleDateString(locale, {
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
const getMarketingMessage = (offer: any, threshold: number = 4, isEnglish: boolean = false) => {
  if (!offer) {
    return {
      text: isEnglish ? "Be the first to reserve!" : "Soyez le premier à réserver !",
      color: "#64748b"
    };
  }
  if (offer.status === 'confirmed' || offer.is_threshold_reached) {
    return {
      text: isEnglish ? "✅ Production guaranteed" : "✅ Production garantie",
      color: "#10B981"
    };
  }
  const reserved = offer.reserved_portions || 0;
  const remaining = threshold - reserved;
  if (remaining === 3) {
    return {
      text: isEnglish ? "1/4 portions reserved — 3 to go" : "1/4 portions réservées — encore 3",
      color: "#64748b"
    };
  }
  if (remaining === 2) {
    return {
      text: isEnglish ? "2/4 — 2 more to launch cooking" : "2/4 — encore 2 pour lancer la production",
      color: "#F59E0B"
    };
  }
  if (remaining === 1) {
    return {
      text: isEnglish ? "🔥 Only 1 portion left to launch cooking!" : "🔥 Plus qu'1 portion pour lancer la production !",
      color: "#EF4444"
    };
  }
  if (remaining <= 0) {
    return {
      text: isEnglish ? "🎉 Production confirmed!" : "🎉 Production confirmée !",
      color: "#10B981"
    };
  }
  return {
    text: isEnglish ? "Be the first to reserve!" : "Soyez le premier à réserver !",
    color: "#64748b"
  };
};

const OrderModal = ({ visible, onClose, item, onConfirm }: any) => {
  const { t, isEnglish } = useTranslation();
  const isCatalogueProduct = item?.isCatalogueProduct ?? (item?.reel_category === 'CATALOG_PRODUCT' || !item?.daily_offer_id);
  const fallbackDates = useMemo(() => generateNext7Days(isEnglish), [isEnglish]);
  
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

  // 📍 Ville active et filtrage dynamique des quartiers
  const activeCityName = selectedCity?.name || "Yaoundé";

  const getCleanZoneName = (zone: string): string => {
    return zone.replace(/\s*\(.*?\)\s*/g, '').trim();
  };

  const getZoneCityName = (zone: string): string => {
    const match = zone.match(/\((.*?)\)/);
    if (match && match[1]) return match[1].trim();
    const zLower = zone.toLowerCase();
    const doualaList = ['akwa', 'bonapriso', 'bonamoussadi', 'makepe', 'deido', 'bali', 'denver', 'kotto', 'logpom', 'new bell'];
    if (doualaList.some(d => zLower.includes(d))) return "Douala";
    return "Yaoundé";
  };

  const availableCityZones = useMemo(() => {
    const currentCity = activeCityName.toLowerCase();
    const filtered = adminZones.filter((z) => {
      const zCity = getZoneCityName(z).toLowerCase();
      return zCity.includes(currentCity) || currentCity.includes(zCity);
    });
    const cleanNames = filtered.map(z => getCleanZoneName(z)).filter(Boolean);
    return Array.from(new Set(cleanNames));
  }, [adminZones, activeCityName]);

  const zonePlaceholder = activeCityName.toLowerCase().includes("douala")
    ? "Ex: Akwa, Bonapriso, Makepe..."
    : "Ex: Bastos, Odza, Mimboman...";

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

  // 🥗 Options & Accompagnements configurables (ex: Crudités 0F, Plantain frit +500F)
  const initialOptions = (item?.options || item?.product?.options || []).filter((o: any) => o.is_active !== false);
  const [optionsList, setOptionsList] = useState<any[]>(initialOptions);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(() => {
    const def = initialOptions.find((o: any) => o.is_default);
    return def ? def.id : (initialOptions.length > 0 ? initialOptions[0].id : null);
  });
  const selectedOption = optionsList.find((o: any) => o.id === selectedOptionId) || null;
  const optionUnitFee = selectedOption ? Number(selectedOption.price || 0) : 0;

  // Liste effective des dates (dynamique depuis le backend ou fallback généré)
  const datesList = availabilityDates.length > 0 ? availabilityDates : fallbackDates.map(d => ({ ...d, is_open: true }));

  // ✅ CORRECTION INFAILLIBLE DES ACCOMPAGNEMENTS (SIDES)
  const rawComplements = item?.sides || (isCatalogueProduct
    ? (item?.complements || item?.product?.complements) 
    : (item?.product?.complements || item?.complements));

  let finalComplements = isEnglish ? "Rice, Fried plantains, Cassava sticks" : "Riz, Plantain, Bâton de manioc";
  if (Array.isArray(rawComplements) && rawComplements.length > 0) {
    finalComplements = rawComplements.join(", ");
  } else if (typeof rawComplements === "string" && rawComplements.trim() !== "") {
    finalComplements = rawComplements;
  }

  const lockedOfferDate = item?.offerDate || item?.target_date;

  const selectedDateStr = datesList[selectedDateIndex]?.date;
  const currentOffer = existingOffers.find((o: any) => o.target_date === selectedDateStr && Number(o.product?.id) === Number(productId));
  const marketingState = getMarketingMessage(currentOffer, 4, isEnglish);

  useEffect(() => {
    if (visible) {
      try {
        const itemVars = (item?.variants || item?.product?.variants || []).filter((v: any) => v.is_active !== false);
        setVariantsList(itemVars);
        setSelectedVariantId(itemVars.length > 0 ? itemVars[0].id : null);

        // 📊 Analytics & Clarity : Étape 4 Entonnoir
        trackEvent({
          event_type: 'MODAL_OPEN',
          event_name: 'MODAL_OPEN',
          product_id: Number(productId) || undefined,
          product_name: productName,
        }).catch(() => {});
        tagClarityEvent('funnel_step', 'modal_open');

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

        // 🥗 Réinitialisation / Détection des options
        const itemOpts = (item?.options || item?.product?.options || []).filter((o: any) => o.is_active !== false);
        setOptionsList(itemOpts);
        const defaultOpt = itemOpts.find((o: any) => o.is_default);
        setSelectedOptionId(defaultOpt ? defaultOpt.id : (itemOpts.length > 0 ? itemOpts[0].id : null));

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
        if (availability?.options && availability.options.length > 0) {
          const activeOpts = availability.options.filter((o: any) => o.is_active !== false);
          setOptionsList(activeOpts);
          setSelectedOptionId((prev) => (prev ? prev : (activeOpts.length > 0 ? activeOpts[0].id : null)));
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
      const data = await apiFetch("/orders/delivery-zones", { method: "GET" }, false)
        .catch(() => apiFetch("/admin/settings/delivery-zones", { method: "GET" }, false));
      if (data && data.zones) {
        setAdminZones(data.zones || []);
        setBaseDeliveryPrice(data.price || 1000);
      }
    } catch {
      setAdminZones(["Bastos (Yaoundé)", "Odza (Yaoundé)", "Mimboman (Yaoundé)", "Akwa (Douala)", "Bonapriso (Douala)"]);
      setBaseDeliveryPrice(1000);
    }
  };

  const calculateDeliveryPrice = () => {
    if (!userZone.trim()) return baseDeliveryPrice;
    const inputZone = userZone.toLowerCase().trim();
    const isKnownZone = adminZones.some((z) => {
      const cleanZone = getCleanZoneName(z).toLowerCase().trim();
      return cleanZone === inputZone || z.toLowerCase().trim() === inputZone || cleanZone.includes(inputZone) || inputZone.includes(cleanZone);
    });
    return isKnownZone ? baseDeliveryPrice : baseDeliveryPrice + 500;
  };

  const totalPrice = (pricePerUnit + optionUnitFee) * portions;
  const deliveryPrice = calculateDeliveryPrice();
  const finalTotal = totalPrice + deliveryPrice;
  const deposit = Math.round(finalTotal * 0.4);

  const handleValidation = async () => {
    if (loading) return;

    const chosenComplement = optionsList.length > 0
      ? (selectedOption ? selectedOption.name : (optionsList[0]?.name || "Standard"))
      : complement;

    if (!chosenComplement) {
      showAlert(
        isEnglish ? "Choice required" : "Choix obligatoire",
        isEnglish ? "Please select a side dish." : "Veuillez sélectionner un accompagnement."
      );
      return;
    }
    if (!userZone || !phone) {
      showAlert(
        isEnglish ? "Oops!" : "Oups !",
        isEnglish ? "Please provide your delivery area and phone number." : "Veuillez remplir votre quartier et votre numéro de téléphone."
      );
      return;
    }

    setLoading(true);
    try {
      const orderResult = await apiFetch("/orders/create", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          variant_id: selectedVariantId || null,
          selected_options: selectedOption ? [{ name: selectedOption.name, price: optionUnitFee }] : null,
          target_date: selectedDateStr || lockedOfferDate,
          portions,
          delivery_zone: userZone.trim(),
          complement: chosenComplement,
          customization_note: customizationNote.trim() ? customizationNote.trim() : null,
          delivery_time: deliveryTime,
          phone: phone.trim(),
          affiliate_code: null,
          city_id: selectedCity?.id || null, // ✅ PASSAGE DE LA VILLE
          delivery_fee: deliveryPrice, // ✅ FRAIS DE LIVRAISON TRANSMIS AU SERVEUR
        }),
      }, true);

      if (!orderResult.order_id) throw new Error(isEnglish ? "Order creation failed" : "Échec création commande");

      // ✅ SebPay : le backend calcule lui-même l'acompte de 40 % à partir du TOTAL
      const variantSuffix = selectedVariant ? ` (${selectedVariant.name})` : "";
      const paymentDescription = isEnglish
        ? `Deposit 40% - ${productName}${variantSuffix} (${portions} portion${portions > 1 ? "s" : ""})`
        : `Acompte 40% - ${productName}${variantSuffix} (${portions} portions)`;

      const paymentResult = await apiFetch("/payments/sebpay/init", {
        method: "POST",
        body: JSON.stringify({
          order_id: orderResult.order_id,
          amount: orderResult.total_amount || finalTotal,
          phone: phone.trim(),
          description: paymentDescription,
        }),
      }, true);

      const paidDeposit = paymentResult.deposit_amount || deposit;

      // 📊 Analytics & Clarity : Étape 5 Entonnoir
      trackEvent({
        phone: phone.trim(),
        event_type: 'PAYMENT_INITIATED',
        event_name: 'PAYMENT_INITIATED',
        product_id: Number(productId) || undefined,
        product_name: productName,
        cart_value: paidDeposit,
      }).catch(() => {});
      tagClarityEvent('funnel_step', 'payment_initiated');

      if (paymentResult.payment_url) {
        showAlert(
          isEnglish ? "Payment required 💳" : "Paiement requis 💳",
          isEnglish ? `Please pay the deposit of ${safeFormatNumber(paidDeposit)} FCFA.` : `Veuillez payer l'acompte de ${paidDeposit} FCFA.`,
          [
            { text: isEnglish ? "Cancel" : "Annuler", style: "cancel", onPress: onClose },
            { text: isEnglish ? "Pay now" : "Payer maintenant", onPress: () => { Linking.openURL(paymentResult.payment_url); onConfirm(); } },
          ]
        );
      } else {
        showAlert(
          isEnglish ? "Confirm payment 📱" : "Validez le paiement 📱",
          paymentResult.message || (isEnglish
            ? `A payment prompt of ${safeFormatNumber(paidDeposit)} FCFA has been sent to your phone.\n\n⚠️ Important: Your Mobile Money balance must be higher than ${safeFormatNumber(paidDeposit)} FCFA.\n\nConfirm with your secret PIN on your phone.`
            : `Une demande de ${paidDeposit} FCFA a été envoyée sur votre téléphone.\n\n⚠️ Important : Votre solde Mobile Money doit être supérieur à ${paidDeposit} FCFA.\n\nValidez avec votre code PIN secret sur votre téléphone.`),
          [{ text: isEnglish ? "I confirmed" : "J'ai validé", onPress: () => { onConfirm(); onClose(); } }]
        );
      }
    } catch (error: any) {
      console.error("❌ Erreur:", error);
      const errorMsg = error?.data?.detail || error?.message || (isEnglish ? "An error occurred." : "Une erreur est survenue.");
      showAlert(
        isEnglish ? "Order Information" : "Information commande",
        isEnglish
          ? `${errorMsg}\n\n💡 Tip: Make sure your Orange Money or MTN MoMo account is active and has sufficient balance.`
          : `${errorMsg}\n\n💡 Conseil : Assurez-vous que votre compte Orange Money ou MTN MoMo est actif et que votre solde est supérieur au montant de l'acompte.`
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
          {/* En-tête : Nom du plat & Prix d'appel */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>{productName || (isEnglish ? "Dish" : "Plat")}</Text>
            <Text style={styles.headerPriceSubtitle}>
              {variantsList.length > 1 ? (isEnglish ? "Starting from " : "À partir de ") : ""}
              <Text style={styles.headerPriceHighlight}>{safeFormatNumber(pricePerUnit)} FCFA</Text>
              {` / ${t.common.portion}`}
            </Text>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* 🍽️ CHOISISSEZ VOTRE PRÉPARATION (Cartes tactiles épurées - Uniquement si > 1 variante) */}
            {variantsList.length > 1 && (
              <View style={styles.variantSection}>
                <Text style={styles.sectionHeading}>{isEnglish ? "🍽️ Choose your preparation:" : "🍽️ Choisissez votre préparation :"}</Text>
                <View style={styles.variantList}>
                  {variantsList.map((v: any) => {
                    const isSelected = selectedVariantId === v.id;
                    const emoji = v.name.toLowerCase().includes('viande') ? '🥩 ' :
                                  v.name.toLowerCase().includes('poisson') ? '🐟 ' :
                                  v.name.toLowerCase().includes('crevette') ? '🍤 ' :
                                  v.name.toLowerCase().includes('poulet') ? '🍗 ' : '';
                    return (
                      <TouchableOpacity
                        key={v.id}
                        onPress={() => setSelectedVariantId(v.id)}
                        style={[
                          styles.variantCard,
                          isSelected && styles.variantCardSelected
                        ]}
                        activeOpacity={0.8}
                      >
                        <View style={styles.variantCardLeft}>
                          <Text style={[styles.variantCardName, isSelected && styles.variantCardNameSelected]}>
                            {emoji}{v.name}
                          </Text>
                          <Text style={[styles.variantCardPrice, isSelected && styles.variantCardPriceSelected]}>
                            {safeFormatNumber(v.price)} FCFA / {t.common.portion}
                          </Text>
                        </View>
                        <View style={[styles.variantCheckBadge, isSelected && styles.variantCheckBadgeSelected]}>
                          <Text style={[styles.variantCheckText, isSelected && styles.variantCheckTextSelected]}>
                            {isSelected ? "✓" : ""}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ✅ Masque complètement le sélecteur de date si isCatalogueProduct === false */}
            {isCatalogueProduct ? (
              <View style={styles.dateSelectorContainer}>
                <Text style={styles.label}>{isEnglish ? "📅 Choose your reservation date:" : "📅 Choisissez votre date de réservation :"}</Text>
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
                              showAlert(
                                isEnglish ? "Reservation unavailable" : "Réservation non disponible",
                                dateOption.status_message || (isEnglish ? "Reservations for this date are closed." : "Les réservations pour cette date sont closes.")
                              );
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
                            <Text style={styles.closedTag}>{isEnglish ? "Closed" : "Clôturé"}</Text>
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
                <Text style={styles.lockedDateText}>
                  {isEnglish ? "📅 Fixed Daily Special Date: " : "📅 Date fixe Menu du Jour : "}
                  <Text style={{fontWeight: "900", color: "#E31C25"}}>{lockedOfferDate}</Text>
                </Text>
              </View>
            ) : null}

            {/* 🔢 NOMBRE DE PORTIONS & RÉSUMÉ INSTANTANÉ */}
            <Text style={styles.label}>{`🔢 ${t.orderModal.portionsCount} (${pricePerUnit} FCFA/${t.common.portion}) :`}</Text>
            {selectedVariant && (
              <Text style={styles.selectedVariantSummary}>
                {`${isEnglish ? "Selection" : "Sélection"} : `}<Text style={{ fontWeight: "800", color: "#E31C25" }}>{selectedVariant.name}</Text>{` · ${portions} ${portions > 1 ? t.common.portions : t.common.portion} = `}<Text style={{ fontWeight: "900", color: "#111827" }}>{safeFormatNumber(totalPrice)} FCFA</Text>
              </Text>
            )}
            <View style={styles.counterContainer}>
              <TouchableOpacity style={[styles.counterBtn, portions <= 1 && styles.counterBtnDisabled]} onPress={() => portions > 1 && setPortions(portions - 1)} disabled={portions <= 1}>
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{portions}</Text>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setPortions(portions + 1)}>
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{isEnglish ? "⏰ Delivery time:" : "⏰ Heure de livraison :"}</Text>
            <View style={styles.timeRow}>
              {["12:00", "13:00", "18:00", "19:00"].map((time) => (
                <TouchableOpacity key={time} onPress={() => setDeliveryTime(time)} style={[styles.timeChip, deliveryTime === time && styles.timeChipActive]}>
                  <Text style={[styles.timeChipText, deliveryTime === time && styles.timeChipTextActive]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{`📍 ${t.orderModal.deliveryZone} :`}</Text>

            {/* 🏷️ Suggestion rapide des quartiers configurés pour la ville active */}
            {availableCityZones.length > 0 && (
              <View style={styles.quickZonesContainer}>
                <Text style={styles.quickZonesHint}>
                  {isEnglish
                    ? `Served areas in ${activeCityName} (tap to select):`
                    : `Quartiers desservis à ${activeCityName} (cliquez pour sélectionner) :`}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickZonesScroll}>
                  {availableCityZones.map((zoneName) => {
                    const isSelected = userZone.trim().toLowerCase() === zoneName.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={zoneName}
                        onPress={() => setUserZone(zoneName)}
                        style={[styles.quickZoneChip, isSelected && styles.quickZoneChipActive]}
                      >
                        <Text style={[styles.quickZoneText, isSelected && styles.quickZoneTextActive]}>
                          📍 {zoneName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <TextInput 
              placeholder={isEnglish ? "E.g.: Bastos, Akwa, Bonapriso..." : zonePlaceholder} 
              style={styles.input} 
              value={userZone} 
              onChangeText={setUserZone} 
            />

            <View style={styles.deliveryPriceInfo}>
              <Text style={styles.deliveryPriceText}>
                {`🚚 ${t.orderModal.deliveryFee} : ${safeFormatNumber(deliveryPrice)} FCFA`}
                {userZone.trim() ? (
                  deliveryPrice > baseDeliveryPrice 
                    ? (isEnglish ? " ⚠️ (Out of zone +500 F)" : " ⚠️ (Hors-zone +500 F)") 
                    : (isEnglish ? ` ✓ (Standard rate ${activeCityName})` : ` ✓ (Tarif standard ${activeCityName})`)
                ) : ""}
              </Text>
            </View>

            <Text style={styles.label}>🥘 {t.orderModal.sidesAndOptions} <Text style={styles.requiredText}>*</Text> :</Text>
            {optionsList.length > 0 ? (
              <View style={styles.wrapRow}>
                {optionsList.map((opt: any) => {
                  const isSelected = selectedOptionId === opt.id;
                  const priceLabel = Number(opt.price || 0) > 0 ? `+${safeFormatNumber(opt.price)} F` : (isEnglish ? "Included" : "Inclus");
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setSelectedOptionId(opt.id)}
                      style={[styles.chip, isSelected ? styles.activeChip : styles.inactiveChip]}
                    >
                      <Text style={isSelected ? styles.activeText : styles.chipText}>
                        {opt.name} ({priceLabel})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
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
            )}
            {optionsList.length === 0 && !complement && <Text style={styles.errorHint}>{isEnglish ? "⚠️ Please select a side dish." : "⚠️ Veuillez choisir un accompagnement."}</Text>}

            {/* 📝 PRÉFÉRENCE DE CUISINE (FACULTATIVE & DISCRÈTE) */}
            <View style={styles.customizationSection}>
              <TouchableOpacity
                style={styles.customizationToggleBtn}
                onPress={() => setShowCustomization(!showCustomization)}
                activeOpacity={0.7}
              >
                <Text style={styles.customizationToggleText}>
                  {showCustomization 
                    ? (isEnglish ? "▼ 📝 Cooking preferences? (optional)" : "▼ 📝 Une préférence pour la cuisine ? (facultatif)")
                    : (isEnglish ? "▶ 📝 Cooking preferences? (optional)" : "▶ 📝 Une préférence pour la cuisine ? (facultatif)")}
                </Text>
              </TouchableOpacity>

              {showCustomization && (
                <View style={styles.customizationBox}>
                  <TextInput
                    placeholder={isEnglish ? "E.g.: no MSG, low salt, light oil..." : "Ex: sans cube, peu salé, peu d'huile..."}
                    placeholderTextColor="#94a3b8"
                    style={styles.customizationInput}
                    value={customizationNote}
                    onChangeText={setCustomizationNote}
                    maxLength={300}
                    multiline
                    numberOfLines={2}
                  />
                  <View style={styles.charCounterRow}>
                    <Text style={styles.charCounterText}>{customizationNote.length}/300 {isEnglish ? "characters" : "caractères"}</Text>
                    {customizationNote.trim().length > 0 && (
                      <TouchableOpacity onPress={() => setCustomizationNote("")}>
                        <Text style={styles.clearNoteText}>{isEnglish ? "Clear" : "Effacer"}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.label}>📱 {t.orderModal.phoneLabel} :</Text>
            <TextInput placeholder="Ex: 697000000 ou 670000000" style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <Text style={styles.phoneHint}>
              {isEnglish ? "This number will receive the Mobile Money payment prompt." : "Ce numéro recevra la demande de débit Mobile Money."}
            </Text>

            <View style={styles.priceContainer}>
              <View style={styles.priceLine}>
                <Text style={styles.priceLabel}>
                  {selectedVariant
                    ? `${isEnglish ? "Meal" : "Repas"} — ${selectedVariant.name} (${portions} ${portions > 1 ? t.common.portions : t.common.portion})`
                    : `${isEnglish ? "Meal" : "Repas"} (${portions} ${portions > 1 ? t.common.portions : t.common.portion})`}
                </Text>
                <Text style={styles.priceValue}>{`${pricePerUnit * portions} FCFA`}</Text>
              </View>
              {optionUnitFee > 0 && selectedOption && (
                <View style={styles.priceLine}>
                  <Text style={styles.priceLabel}>
                    {`${isEnglish ? "Side dish" : "Accompagnement"} — ${selectedOption.name} (${portions} ${portions > 1 ? t.common.portions : t.common.portion})`}
                  </Text>
                  <Text style={styles.priceValue}>{`+${safeFormatNumber(optionUnitFee * portions)} FCFA`}</Text>
                </View>
              )}
              <View style={styles.priceLine}><Text style={styles.priceLabel}>{t.orderModal.deliveryFee}</Text><Text style={styles.priceValue}>{`${deliveryPrice} FCFA`}</Text></View>
              {customizationNote.trim().length > 0 && (
                <View style={styles.recapCustomizationLine}>
                  <Text style={styles.recapCustomizationLabel}>{isEnglish ? "✨ Preference:" : "✨ Préférence :"}</Text>
                  <Text style={styles.recapCustomizationValue} numberOfLines={2}>« {customizationNote.trim()} »</Text>
                </View>
              )}
              <View style={styles.totalLine}><Text style={styles.totalLabel}>{t.orderModal.totalAmount}</Text><Text style={styles.totalValue}>{`${finalTotal} FCFA`}</Text></View>
              <View style={styles.depositBox}>
                <Text style={styles.depositText}>{isEnglish ? "40% DEPOSIT DUE" : "ACOMPTE 40% À PAYER"}</Text>
                <Text style={styles.depositAmount}>{`${deposit} FCFA`}</Text>
                <Text style={styles.remainingText}>{`${isEnglish ? "Balance on delivery:" : "Solde à la livraison :"} ${finalTotal - deposit} FCFA`}</Text>
                <View style={styles.balanceNotice}>
                  <Text style={styles.balanceNoticeText}>
                    {`⚠️ ${isEnglish ? `Required balance: Your Orange Money or MTN MoMo account must have at least ${safeFormatNumber(deposit)} FCFA to validate this payment.` : `Solde requis : Votre compte Orange Money ou MTN MoMo doit avoir au moins ${safeFormatNumber(deposit)} FCFA pour valider ce paiement.`}`}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.payButton, loading && { opacity: 0.6 }]}
              onPress={handleValidation}
              disabled={loading}
            >
              <Text style={styles.payButtonText}>{loading ? (isEnglish ? "Processing..." : "Traitement...") : `🔥 ${isEnglish ? "RESERVE" : "RÉSERVER"} (${safeFormatNumber(deposit)} F)`}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{t.common.close}</Text>
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
  headerArea: { alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "900", color: "#111827", textAlign: "center", letterSpacing: -0.5 },
  headerPriceSubtitle: { fontSize: 13, fontWeight: "600", color: "#64748b", marginTop: 2 },
  headerPriceHighlight: { fontSize: 16, fontWeight: "900", color: "#E31C25" },
  sectionHeading: { fontSize: 13, fontWeight: "800", color: "#1e293b", marginBottom: 8, marginTop: 4 },
  selectedVariantSummary: { fontSize: 12, color: "#64748b", marginTop: -4, marginBottom: 8, fontStyle: "italic" },
  variantSection: { width: "100%", marginBottom: 12 },
  variantList: { flexDirection: "column", gap: 8 },
  variantCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  variantCardSelected: {
    backgroundColor: "#fff5f5",
    borderColor: "#E31C25",
    borderWidth: 2,
  },
  variantCardLeft: {
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  },
  variantCardName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 2,
  },
  variantCardNameSelected: {
    color: "#991b1b",
    fontWeight: "900",
  },
  variantCardPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  variantCardPriceSelected: {
    color: "#E31C25",
    fontWeight: "800",
  },
  variantCheckBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    marginLeft: 12,
    flexShrink: 0,
  },
  variantCheckBadgeSelected: {
    borderColor: "#E31C25",
    backgroundColor: "#E31C25",
  },
  variantCheckText: {
    fontSize: 14,
    fontWeight: "900",
    color: "transparent",
  },
  variantCheckTextSelected: {
    color: "#ffffff",
  },
  quickZonesContainer: {
    marginBottom: 8,
  },
  quickZonesHint: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 6,
  },
  quickZonesScroll: {
    flexDirection: "row",
    marginBottom: 4,
  },
  quickZoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
  },
  quickZoneChipActive: {
    backgroundColor: "#fee2e2",
    borderColor: "#E31C25",
  },
  quickZoneText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  quickZoneTextActive: {
    color: "#b91c1c",
    fontWeight: "800",
  },
});

export default OrderModal;