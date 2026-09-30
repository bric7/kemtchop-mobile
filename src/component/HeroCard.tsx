import React from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ImageBackground 
} from "react-native"; // Il te manquait probablement cette ligne ou certains éléments dedans

const HeroCard = ({ item, onOrder }: any) => {
  if (!item) return null;

  return (
    <TouchableOpacity 
      style={styles.heroContainer} 
      onPress={() => onOrder(item)}
      activeOpacity={0.9}
    >
      <ImageBackground 
        source={{ uri: item.image_url }} 
        style={styles.heroImage}
        imageStyle={{ borderRadius: 20 }}
      >
        <View style={styles.heroOverlay}>
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>LE PLUS COMMANDÉ 🔥</Text>
          </View>
          <View>
            <Text style={styles.heroName}>{item.product_name}</Text>
            <Text style={styles.heroPrice}>{item.price} FCFA</Text>
          </View>
          <View style={styles.heroButton}>
             <Text style={styles.heroButtonText}>Commander</Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

// N'oublie pas de définir les styles ici s'ils ne sont pas dans ton index.tsx
const styles = StyleSheet.create({
  heroContainer: {
    marginHorizontal: 20,
    height: 220,
    marginBottom: 25,
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  heroImage: { flex: 1, justifyContent: "flex-end" },
  heroOverlay: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    height: "100%",
    justifyContent: "space-between",
  },
  promoBadge: {
    backgroundColor: "#E31C25",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  promoText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  heroName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },
  heroPrice: { color: "#fff", fontSize: 18, fontWeight: "700" },
  heroButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    width: 140,
  },
  heroButtonText: { color: "#000", fontWeight: "900", fontSize: 14 },
});

export default HeroCard;