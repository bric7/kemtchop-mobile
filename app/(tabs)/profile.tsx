import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AffiliateMenu from "../component/AffiliateMenu";
import AffiliateWallet from "../component/AffiliateWallet";
import ProfileHeader from "../component/ProfileHeader";
import SettingsMenu from "../component/SettingsMenu";

export default function ProfileScreen() {
  const [userName, setUserName] = useState("Client Kemtchop");
  const [userPhone, setUserPhone] = useState("");
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState("");
  const [pendingCommissions, setPendingCommissions] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  // État pour l'input manuel
  const [manualRef, setManualRef] = useState("");

  const SERVER_IP = "127.0.0.1";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const phone = await AsyncStorage.getItem("user_phone");
      const name = await AsyncStorage.getItem("user_name");

      if (name) setUserName(name);
      if (phone) {
        setUserPhone(phone);
        checkAffiliateStatus(phone);
      }
    } catch (e) {
      console.log("Erreur chargement local storage:", e);
    }
  };

  const checkAffiliateStatus = async (phone: string) => {
    try {
      const res = await fetch(
        `http://${SERVER_IP}:8000/users/status?phone=${phone}`,
        { method: "GET" },
      );
      const data = await res.json();

      if (data.is_affiliate) {
        setIsAffiliate(true);
        setAffiliateCode(data.affiliate_code);
        setPendingCommissions(data.pending_commissions || 0);
        setTotalEarned(data.total_earned || 0);
      } else {
        setIsAffiliate(false);
      }
    } catch (e) {
      console.log("Erreur status API:", e);
    }
  };

  // --- LOGIQUE DE SAUVEGARDE MANUELLE ---
  const handleSaveManualCode = async () => {
    if (!manualRef.trim()) {
      Alert.alert("Attention", "Veuillez entrer un code.");
      return;
    }
    try {
      // On sauvegarde sous la même clé que le Deep Link
      await AsyncStorage.setItem(
        "active_affiliate_code",
        manualRef.trim().toUpperCase(),
      );
      Alert.alert(
        "Succès",
        `Le code ${manualRef.toUpperCase()} est activé pour vos prochains Kemit !`,
      );
      setManualRef(""); // On vide le champ
    } catch (e) {
      Alert.alert("Erreur", "Impossible de sauvegarder le code.");
    }
  };

  const handleAffiliateWhatsApp = () => {
    const adminPhone = "237670040475";
    const message = `Bonjour Kemtchop ! Je suis ${userName} (${userPhone}) et je souhaite devenir ambassadeur pour gagner des commissions sur Afrishop.`;
    const url = `whatsapp://send?phone=${adminPhone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(
            `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`,
          );
        }
      })
      .catch(() => {
        Alert.alert("Erreur", "Impossible d'ouvrir WhatsApp.");
      });
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous sortir ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader
          userName={userName}
          userPhone={userPhone}
          isAffiliate={isAffiliate}
        />

        {/* 1. INPUT MANUEL (Seulement si pas ambassadeur) */}
        {!isAffiliate && (
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>Code Parrain</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Saisis le code ici"
                value={manualRef}
                onChangeText={setManualRef}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.btnOk}
                onPress={handleSaveManualCode}
              >
                <Text style={styles.btnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2. PORTEFEUILLE (Si ambassadeur) */}
        {isAffiliate && (
          <AffiliateWallet pendingCommissions={pendingCommissions} />
        )}

        {/* 3. MENU AMBASSADEUR */}
        <AffiliateMenu
          isAffiliate={isAffiliate}
          affiliateCode={affiliateCode}
          totalEarned={totalEarned}
          onWhatsAppPress={handleAffiliateWhatsApp}
        />

        <SettingsMenu onLogout={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  manualCard: {
    margin: 20,
    padding: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  manualTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 45,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 15,
    fontWeight: "bold",
    color: "#E31C25",
  },
  btnOk: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: "center",
  },
  btnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 12,
  },
});
