import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const WHATSAPP_NUMBER = "237670040475"; // Ton numéro sans le +

  const handleWhatsApp = () => {
    const message =
      "Bonjour Kemtchop ! J'aimerais avoir des conseils sur vos plats du jour.";
    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Lien de secours si l'app WhatsApp n'est pas installée
        Linking.openURL(`https://wa.me/${+237670040475}`);
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Icône animée ou illustrée */}
        <View style={styles.iconCircle}>
          <Ionicons name="chatbubbles" size={60} color="#E31C25" />
          <View style={styles.onlineBadge} />
        </View>

        <Text style={styles.title}>Service Conseil Kemtchop</Text>
        <Text style={styles.description}>
          Une hésitation sur le menu ? Un événement spécial à organiser
          (anniversaire, réunion) ?{"\n\n"}
          Discutez en direct avec nos chefs pour choisir les meilleurs
          compléments et quantités.
        </Text>

        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={26} color="white" />
          <Text style={styles.btnText}>Lancer la discussion</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Réponse rapide : Lun - Dim (08h - 22h)
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 10,
    right: 15,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#25D366", // Vert WhatsApp
    borderWidth: 3,
    borderColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#000",
    marginBottom: 15,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  whatsappBtn: {
    flexDirection: "row",
    backgroundColor: "#25D366",
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#25D366",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  btnText: { color: "white", fontWeight: "900", fontSize: 18, marginLeft: 12 },
  infoBox: { flexDirection: "row", alignItems: "center", marginTop: 30 },
  infoText: { color: "#999", fontSize: 13, marginLeft: 8 },
});
