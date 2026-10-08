import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// ✅ AJOUTE CETTE LIGNE ICI :
import { apiFetch } from "../config/api";
import NotificationService from "@/services/notifications";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (loading) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone || !password || !confirmPassword) {
      setErrorMessage("Veuillez remplir tous les champs.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const result = await apiFetch("/users/register", {
        method: "POST",
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone,
          password,
        }),
      });

      if (result.status === "success") {
        const sessionData: [string, string][] = [
          ["user_phone", trimmedPhone],
          ["user_name", trimmedName],
        ];
        if (result.access_token) {
          sessionData.push(["access_token", result.access_token]);
        }
        if (result.is_affiliate !== undefined) {
          sessionData.push(["is_affiliate", String(result.is_affiliate)]);
        }
        if (result.affiliate_code) {
          sessionData.push(["affiliate_code", result.affiliate_code]);
        }

        await AsyncStorage.multiSet(sessionData);

        // 🔔 Synchronisation du Token Expo Push
        NotificationService.syncTokenWithBackend().catch(() => {});

        if (Platform.OS === "web") {
          router.replace("/(tabs)");
        } else {
          Alert.alert("Bienvenue ! 🎉", "Ton compte Kemtchop est prêt.", [
            { text: "C'est parti !", onPress: () => router.replace("/(tabs)") },
          ]);
        }
      }
    } catch (error: any) {
      console.error("❌ Erreur inscription:", error);
      setErrorMessage(error.message || "Inscription échouée. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Platform.OS === "web" ? undefined : Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <Image
              source={require("../assets/images/icon.png")}
              style={{ width: 84, height: 84, borderRadius: 20, marginBottom: 16 }}
              resizeMode="cover"
            />
            <Text style={styles.title}>Rejoindre KEMTCHOP</Text>
            <Text style={styles.subtitle}>
              Crée ton compte pour commander tes grillades
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage("");
              }}
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errorMessage) setErrorMessage("");
              }}
            />

            {/* Champ Mot de passe avec Œil */}
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mot de passe"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage("");
                }}
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

            {/* Confirmation du mot de passe */}
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errorMessage) setErrorMessage("");
              }}
            />

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#E31C25" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>S'INSCRIRE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: "#666", textAlign: "center" }}>
                Retour au login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Crucial pour ScrollView
    padding: 30,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#E31C25",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
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
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderColor: "#FEB2B2",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
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
