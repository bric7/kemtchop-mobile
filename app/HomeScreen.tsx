import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Vérifie bien que le fichier est dans app/components/OrderModal.tsx
import OrderModal from "./components/OrderModal";

const HomeScreen = () => {
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const CATEGORIES = [
    "Tout",
    "Grillades",
    "Plats Locaux",
    "Boissons",
    "Accompagnements",
    "rôti", // Ajoute celle-ci pour être raccord avec l'admin
  ];

  const SERVER_IP = "localhost"; // Ton IP locale machine

  // 1. Chargement des produits depuis FastAPI
  useEffect(() => {
    fetch(`http://${SERVER_IP}:8000/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => {
        console.log("Erreur serveur, chargement mode démo:", err);
        setProducts([
          {
            id: 1,
            product_name: "Poulet DG Express",
            price: 2500,
            complements: "Bâton, Frites, Plantain, Macabo",
            image_url:
              "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=200", // Image plus sympa
          },
        ]);
      });
  }, []);

  // 2. LOGIQUE D'ENVOI DE LA COMMANDE (Correction du undefined)
  // 2. LOGIQUE D'ENVOI DE LA COMMANDE (Mise à jour avec Date et Heure)
  const handleConfirmOrder = async (orderData: any) => {
    const SERVER_IP = "192.168.137.1";

    try {
      const response = await fetch(`http://${SERVER_IP}:8000/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: orderData.product_name,
          customer_name: orderData.customerName,
          phone: orderData.phone,
          zone: orderData.zone,
          total_price: orderData.total,
          deposit_amount: orderData.deposit,
          portion_size: orderData.size,
          family_count: orderData.familyCount || 1,
          complement: orderData.complement,
          status: "en_attente",
          // --- NOUVEAUX CHAMPS À ENVOYER ---
          delivery_date: orderData.delivery_date,
          delivery_time: orderData.delivery_time,
          // ---------------------------------
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Succès",
          `Commande pour ${orderData.delivery_date} à ${orderData.delivery_time} enregistrée !`,
        );
        setModalVisible(false);
      } else {
        const errorData = await response.json();
        console.log("Erreur FastAPI:", errorData);
        Alert.alert(
          "Erreur",
          "Le serveur a refusé les données. Vérifie que ton modèle Backend a bien les colonnes delivery_date et delivery_time.",
        );
      }
    } catch (error) {
      Alert.alert("Erreur", "Connexion au serveur impossible.");
    }
  };

  const renderProduct = ({ item }: any) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image_url }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product_name}</Text>
        <Text style={styles.productPrice}>{item.price} FCFA</Text>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => {
            setSelectedItem(item);
            setModalVisible(true);
          }}
        >
          <Text style={styles.orderButtonText}>Commander</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>TEST BRICE</Text>
        <Text style={styles.subtitle}>Express & Local</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
      />

      {/* Rendu conditionnel pour éviter les erreurs sur item nul */}
      {selectedItem && (
        <OrderModal
          visible={modalVisible}
          item={selectedItem}
          onClose={() => setModalVisible(false)}
          onConfirm={(data: any) => handleConfirmOrder(data)} // <--- Écris-le comme ça pour tester
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  logo: { fontSize: 26, fontWeight: "900", color: "#E31C25" },
  subtitle: {
    fontSize: 12,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  list: { padding: 15 },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 15,
    alignItems: "center",
    // Ombre pour faire propre sur mobile
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: { width: 90, height: 90, borderRadius: 15 },
  productInfo: { marginLeft: 15, flex: 1 },
  productName: { fontSize: 17, fontWeight: "bold", color: "#333" },
  productPrice: {
    color: "#E31C25",
    fontWeight: "800",
    marginVertical: 5,
    fontSize: 15,
  },
  orderButton: {
    backgroundColor: "#E31C25",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },
  orderButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
});

export default HomeScreen;
