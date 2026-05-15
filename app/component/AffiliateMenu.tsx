import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Import nécessaire pour la navigation
import React from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AffiliateMenuProps {
  isAffiliate: boolean;
  affiliateCode: string;
  totalEarned: number;
  onWhatsAppPress: () => void;
}

const AffiliateMenu: React.FC<AffiliateMenuProps> = ({
  isAffiliate,
  affiliateCode,
  totalEarned,
  onWhatsAppPress,
}) => {
  const router = useRouter(); // Initialisation du router

  const handleShare = async () => {
    try {
      // Lien profond ou lien web vers Afrishop
      const shareLink = `https://kemtchop.com/home?ref=${affiliateCode}`;

      const messageGeneral =
        `Salut ! Découvre la carte de KEMTCHOP 🍗🥘.\n\n` +
        `Grillades, plats locaux et saveurs du pays. Commande ici et fais-toi livrer : \n${shareLink}`;

      await Share.share({
        message: messageGeneral,
      });
    } catch (error) {
      console.log("Erreur partage:", error);
    }
  };

  return (
    <View style={styles.menuSection}>
      <Text style={styles.sectionLabel}>Business & Affiliation</Text>

      {isAffiliate ? (
        <>
          {/* 1. BOUTON PARTAGER */}
          <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
            <View
              style={[styles.menuIconContainer, { backgroundColor: "#e8f5e9" }]}
            >
              <Ionicons name="share-social" size={22} color="#2e7d32" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.menuText}>Partager mon lien</Text>
              <Text style={styles.menuSubText}>
                Code actif : {affiliateCode}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          {/* 2. BOUTON MES PERFORMANCES (Redirige vers le Dashboard) */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/ambassador")} // Ouvre le dossier app/ambassador
          >
            <View
              style={[styles.menuIconContainer, { backgroundColor: "#fff8e1" }]}
            >
              <Ionicons name="stats-chart" size={22} color="#f57f17" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.menuText}>Mes Performances</Text>
              <Text style={styles.menuSubText}>
                Gains cumulés : {totalEarned.toLocaleString()} FCFA
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </>
      ) : (
        /* 3. BOUTON DEVENIR AMBASSADEUR (Si pas affilié) */
        <TouchableOpacity style={styles.menuItem} onPress={onWhatsAppPress}>
          <View
            style={[styles.menuIconContainer, { backgroundColor: "#E31C25" }]}
          >
            <Ionicons name="cash" size={22} color="#fff" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.menuText}>Devenir Ambassadeur</Text>
            <Text style={styles.menuSubText}>
              Gagnez 15% de commission sur chaque vente
            </Text>
          </View>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  menuSection: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#bbb",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbfbfb",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f2f2f2",
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  menuSubText: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
});

export default AffiliateMenu;
