import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handleRequestReset = () => {
    if (phone.length < 8) {
      alert("Veuillez entrer un numéro de téléphone valide.");
      return;
    }

    // Génération d'un code de sécurité aléatoire pour le suivi
    const securityCode = Math.floor(1000 + Math.random() * 9000);
    const adminNum = "237670040475"; // REMPLACE PAR TON NUMÉRO WHATSAPP

    const message =
      `🔐 *DEMANDE DE RÉINITIALISATION*\n\n` +
      `Bonjour Kemtchop, j'ai oublié mon mot de passe.\n\n` +
      `📍 *Compte :* ${phone}\n` +
      `🔑 *Code Sécurité :* #KM-${securityCode}\n\n` +
      `Merci de m'aider à récupérer mon accès.`;

    const url = `whatsapp://send?phone=${adminNum}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        alert("WhatsApp n'est pas installé sur votre téléphone.");
      }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Ionicons name="lock-open-outline" size={50} color="#E31C25" />
          </View>

          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.subtitle}>
            Entrez votre numéro de téléphone. Nous allons vous aider à récupérer
            l'accès via notre support WhatsApp.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ton numéro de téléphone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TouchableOpacity style={styles.button} onPress={handleRequestReset}>
            <Text style={styles.buttonText}>DEMANDER DE L'AIDE</Text>
            <Ionicons
              name="logo-whatsapp"
              size={20}
              color="#fff"
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 30,
    justifyContent: "center",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fde8e8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#25D366", // Couleur WhatsApp
    padding: 18,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
