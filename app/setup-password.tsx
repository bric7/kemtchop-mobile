import { useLocalSearchParams, useRouter } from "expo-router";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle,
    Lock,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
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

export default function SetupPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    // Validation locale
    if (!token) {
      setError("Lien invalide (token manquant).");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Note pour Brice : Assure-toi que ton PC et ton téléphone sont sur le même Wi-Fi
      // et que 192.168.1.10 est bien l'IP actuelle de ton PC.
      const response = await fetch(
        "http://127.0.0.1:8000/users/complete-setup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: token,
            new_password: password,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.detail || "Ce lien est invalide ou a expiré.");
      }
    } catch (err) {
      setError("Impossible de joindre le serveur Kemtchop. Vérifie ton Wi-Fi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle size={80} color="#22C55E" />
        <Text style={styles.successTitle}>C'EST PRÊT !</Text>
        <Text style={styles.successSub}>
          Ton mot de passe est configuré. Tu peux maintenant te connecter.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/login")} // .replace est mieux ici pour éviter de revenir en arrière
        >
          <Text style={styles.loginButtonText}>SE CONNECTER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              SÉCURISER{"\n"}
              <Text style={{ color: "#E31C25" }}>MON COMPTE</Text>
            </Text>
            <Text style={styles.subtitle}>
              Choisis un mot de passe pour accéder à tes commissions et
              commandes.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                placeholder="Nouveau mot de passe"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                placeholder="Confirmer le mot de passe"
                style={styles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#999"
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#E31C25" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || !token) && { backgroundColor: "#ccc" },
              ]}
              onPress={handleSubmit}
              disabled={loading || !token}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    VALIDER MON COMPTE
                  </Text>
                  <ArrowRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>KEMTCHOP LOGISTICS © 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 25, flexGrow: 1 },
  header: { marginTop: 40, marginBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: "900",
    fontStyle: "italic",
    lineHeight: 32,
  },
  subtitle: { fontSize: 15, color: "#666", marginTop: 10, fontWeight: "500" },
  form: { gap: 15 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 60,
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  errorText: {
    color: "#E31C25",
    fontWeight: "700",
    fontStyle: "italic",
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: "#000",
    height: 65,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "900",
    fontStyle: "italic",
    marginTop: 20,
  },
  successSub: {
    textAlign: "center",
    color: "#666",
    marginTop: 10,
    lineHeight: 20,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#E31C25",
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 30,
    marginTop: 30,
  },
  loginButtonText: { color: "#fff", fontWeight: "900" },
  footerText: {
    textAlign: "center",
    color: "#CCC",
    fontSize: 10,
    fontWeight: "900",
    marginTop: "auto",
    paddingVertical: 20,
  },
});
