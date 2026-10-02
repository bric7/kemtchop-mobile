import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../config/api";

const CITIES = {
  Yaoundé: [
    "Bastos",
    "Omnisports",
    "Mvan",
    "Biyem-Assi",
    "Ngousso",
    "Emana",
    "Centre-ville",
  ],
  Douala: [
    "Akwa",
    "Bonapriso",
    "Bonamoussadi",
    "Logbessou",
    "Deido",
    "Bassa",
    "Kotto",
  ],
};

export default function AddressesScreen() {
  const [city, setCity] = useState<"Yaoundé" | "Douala">("Yaoundé");
  const [neighborhood, setNeighborhood] = useState("");
  const [details, setDetails] = useState("");
  const [label, setLabel] = useState("Maison");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = async () => {
    if (loading) return;

    const trimmedNeighborhood = neighborhood.trim();
    const trimmedDetails = details.trim();

    if (!trimmedNeighborhood || !trimmedDetails) {
      setErrorMessage("Veuillez préciser le quartier et les détails (repères).");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const phone = await AsyncStorage.getItem("user_phone");
      if (!phone) {
        setErrorMessage("Utilisateur non identifié. Veuillez vous connecter.");
        return;
      }

      await apiFetch("/users/add-address", {
        method: "POST",
        body: JSON.stringify({
          phone: phone.trim(),
          city: city,
          neighborhood: trimmedNeighborhood,
          details: trimmedDetails,
          label: label,
        }),
      }, true);

      Alert.alert("Succès", "Adresse de livraison enregistrée ! ✅", [
        { text: "OK", onPress: () => router.back() },
      ]);
      if (Platform.OS === "web") {
        router.back();
      }
    } catch (error: any) {
      console.error("Erreur Save Address:", error);
      setErrorMessage(error.message || "Impossible d'enregistrer l'adresse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mes Adresses</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.sectionTitle}>
            Ajouter une adresse de livraison
          </Text>

          <View style={styles.row}>
            {(["Yaoundé", "Douala"] as const).map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.cityChip, city === item && styles.activeCity]}
                onPress={() => {
                  setCity(item);
                  setNeighborhood("");
                }}
              >
                <Text
                  style={[
                    styles.cityText,
                    city === item && styles.activeCityText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quartier</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Bastos, Akwa..."
              value={neighborhood}
              onChangeText={(text) => {
                setNeighborhood(text);
                if (errorMessage) setErrorMessage("");
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Précisions pour le livreur</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Portail noir à côté de la pharmacie, 2ème étage..."
              multiline
              numberOfLines={3}
              value={details}
              onChangeText={(text) => {
                setDetails(text);
                if (errorMessage) setErrorMessage("");
              }}
            />
          </View>

          <Text style={styles.label}>Type d'adresse</Text>
          <View style={styles.row}>
            {["Maison", "Bureau", "Autre"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.typeChip, label === item && styles.activeType]}
                onPress={() => setLabel(item)}
              >
                <Ionicons
                  name={
                    item === "Maison"
                      ? "home"
                      : item === "Bureau"
                        ? "briefcase"
                        : "location"
                  }
                  size={16}
                  color={label === item ? "#fff" : "#666"}
                />
                <Text
                  style={[
                    styles.typeText,
                    label === item && styles.activeTypeText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#E31C25" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer l'adresse</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// TES STYLES RESTENT EXACTEMENT LES MÊMES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 25,
    color: "#E31C25",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 15,
  },
  inputGroup: { marginBottom: 20 },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10, marginBottom: 15 },
  cityChip: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  activeCity: { backgroundColor: "#E31C25" },
  cityText: { fontWeight: "bold", color: "#666" },
  activeCityText: { color: "#fff" },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#eee",
  },
  activeType: { backgroundColor: "#000", borderColor: "#000" },
  typeText: { fontSize: 13, color: "#666" },
  activeTypeText: { color: "#fff", fontWeight: "bold" },
  saveBtn: {
    backgroundColor: "#E31C25",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 25,
    elevation: 5,
  },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderColor: "#FEB2B2",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: "#E31C25",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
