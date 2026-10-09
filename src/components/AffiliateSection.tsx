import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const AffiliateSection = ({ user }: { user: any }) => {
  // Fonction pour partager le lien sur WhatsApp/Réseaux
  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `Salut ! Teste Kemtchop, c'est le feu ! 🍳 Utilise mon code ${user.affiliate_code} ou clique ici pour commander : https://kemtchop.com/home?ref=${user.affiliate_code}`,
      });
    } catch (error: any) {
      console.log(error?.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER BUSINESS */}
      <View style={styles.businessHeader}>
        <MaterialCommunityIcons name="star-circle" size={24} color="#FFD700" />
        <Text style={styles.businessTitle}>ESPACE AMBASSADEUR</Text>
      </View>

      {/* CARTE DES GAINS */}
      <View style={styles.statsCard}>
        <View>
          <Text style={styles.label}>SOLDE À RETIRER</Text>
          <Text style={styles.amount}>
            {user.pending_commissions || 0} FCFA
          </Text>
        </View>
        <TouchableOpacity style={styles.payoutBtn}>
          <Text style={styles.payoutText}>Retirer</Text>
        </TouchableOpacity>
      </View>

      {/* OUTILS DE PARTAGE */}
      <View style={styles.shareBox}>
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>MON CODE PROMO</Text>
          <Text style={styles.codeText}>{user.affiliate_code}</Text>
        </View>

        <TouchableOpacity style={styles.whatsappBtn} onPress={onShare}>
          <MaterialCommunityIcons name="whatsapp" size={20} color="white" />
          <Text style={styles.whatsappText}>Partager mon lien</Text>
        </TouchableOpacity>
      </View>

      {/* INFO PAIEMENT */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color="#666"
        />
        <Text style={styles.infoText}>
          Tes gains sont versés sur le numéro : {user.phone}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  businessHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 8,
  },
  businessTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#333",
    letterSpacing: 1,
  },
  statsCard: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  label: { fontSize: 10, fontWeight: "800", color: "#888", marginBottom: 5 },
  amount: { fontSize: 22, fontWeight: "900", color: "#2ecc71" },
  payoutBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  payoutText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  shareBox: { flexDirection: "row", gap: 10 },
  codeContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#F0F0F0",
    borderStyle: "dashed",
    padding: 10,
    borderRadius: 15,
    alignItems: "center",
  },
  codeLabel: { fontSize: 8, fontWeight: "800", color: "#AAA" },
  codeText: { fontSize: 16, fontWeight: "900", color: "#333" },
  whatsappBtn: {
    flex: 1.5,
    backgroundColor: "#25D366",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 15,
  },
  whatsappText: { color: "#FFF", fontWeight: "900", fontSize: 13 },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 15,
    opacity: 0.6,
  },
  infoText: { fontSize: 11, color: "#666", fontWeight: "500" },
});

export default AffiliateSection;
