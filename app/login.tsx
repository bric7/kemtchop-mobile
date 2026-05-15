import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// ✅ IMPORT API CONFIG (remplace les fetch locaux)
import { apiFetch } from "@/config/api";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ❌ SUPPRIMÉ : const SERVER_IP = "127.0.0.1";

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Erreur", "Remplis ton numéro et ton mot de passe.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Utilise apiFetch au lieu de fetch local
      const data = await apiFetch("/users/login", {
        method: "POST",
        body: JSON.stringify({
          phone: phone.trim(),
          password: password,
        }),
      });

      await AsyncStorage.multiSet([
        ["user_phone", phone.trim()],
        ["user_name", data.user_name],
        ["is_affiliate", String(data.is_affiliate)],
      ]);

      console.log("✅ Connexion réussie pour:", data.user_name);

      Alert.alert("Succès", `Content de vous revoir, ${data.user_name} !`, [
        { text: "C'est parti !", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Erreur",
        error.message || "Le serveur KEMTCHOP est injoignable.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const adminNum = "2376XXXXXXXX"; // REMPLACE PAR TON NUMÉRO
    const msg = `Bonjour Kemtchop, j'ai oublié mon mot de passe pour le compte ${phone}`;
    Linking.openURL(
      `whatsapp://send?phone=${adminNum}&text=${encodeURIComponent(msg)}`,
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: "100%" }}>
            <Text style={styles.title}>KEMTCHOP</Text>
            <Text style={styles.subtitle}>Connectez-vous pour commander</Text>

            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />

            {/* Champ Mot de passe avec Œil */}
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mot de passe"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>SE CONNECTER</Text>
              )}
            </TouchableOpacity>

            {/* Liens de secours */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.link}
                onPress={() => router.push("/register")}
              >
                <Text style={styles.linkText}>
                  Pas de compte ? Inscrivez-vous
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#E31C25",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: "#E31C25",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footer: {
    marginTop: 25,
    alignItems: "center",
  },
  forgotText: {
    color: "#E31C25",
    fontWeight: "600",
    marginBottom: 15,
  },
  link: {
    marginTop: 5,
  },
  linkText: {
    color: "#666",
    textDecorationLine: "underline",
  },
});
