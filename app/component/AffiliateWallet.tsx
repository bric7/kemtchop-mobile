import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AffiliateWalletProps {
  // On ajoute un "?" pour dire que la valeur peut être absente au début
  pendingCommissions?: number;
}

const AffiliateWallet: React.FC<AffiliateWalletProps> = ({
  pendingCommissions = 0,
}) => {
  const handleWithdrawRequest = () => {
    // On sécurise aussi ici
    const amount = pendingCommissions || 0;
    Alert.alert(
      "Demande de retrait",
      `Voulez-vous retirer vos ${amount.toLocaleString()} FCFA ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () => Alert.alert("Succès", "Demande envoyée !"),
        },
      ],
    );
  };

  return (
    <View style={styles.walletBrief}>
      <View>
        <Text style={styles.walletLabel}>SOLDE DISPONIBLE</Text>
        {/* On s'assure que pendingCommissions existe avant d'appeler toLocaleString */}
        <Text style={styles.walletAmount}>
          {(pendingCommissions || 0).toLocaleString()} F
        </Text>
      </View>

      <TouchableOpacity
        style={styles.payoutBtn}
        onPress={handleWithdrawRequest}
        disabled={!pendingCommissions || pendingCommissions <= 0}
      >
        <Text style={styles.payoutBtnText}>Retirer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  walletBrief: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    backgroundColor: "#000",
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 8,
  },
  walletLabel: { color: "#aaa", fontSize: 10, fontWeight: "800" },
  walletAmount: { color: "#fff", fontSize: 26, fontWeight: "900" },
  payoutBtn: {
    backgroundColor: "#E31C25",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  payoutBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
});

export default AffiliateWallet;
