import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import OrderModal from "./components/OrderModal"; // 1. Import du Modal
import ReelItem from "./components/ReelItem";

export default function ReelsScreen() {
  const { height } = useWindowDimensions();
  const { startId } = useLocalSearchParams();
  const router = useRouter();

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<any>(null);

  // ÉTATS POUR LE MODAL
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const flatListRef = useRef<FlatList>(null);
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveId(viewableItems[0].item.id);
    }
  });

  useEffect(() => {
    fetch("http://localhost:8000/reels/")
      .then((res) => res.json())
      .then((data) => {
        setReels(data);
        if (startId) {
          const index = data.findIndex(
            (r: any) => r.id.toString() === startId.toString(),
          );
          if (index !== -1) {
            setActiveId(data[index].id);
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index, animated: false });
            }, 100);
          }
        } else if (data.length > 0) {
          setActiveId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [startId]);

  // 2. FONCTION DE CONFIRMATION (Celle qui répare l'erreur)
  const handleConfirmOrder = async (orderData: any) => {
    const SERVER_IP = "10.251.148.113";
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
        }),
      });

      if (response.ok) {
        Alert.alert(
          "KEMTCHOP",
          "Commande validée ! Un livreur vous contactera dès réception de l'acompte.",
        );
        setModalVisible(false);
      } else {
        Alert.alert(
          "Erreur",
          "Problème lors de l'enregistrement de la commande.",
        );
      }
    } catch (error) {
      Alert.alert("Erreur", "Connexion au serveur impossible.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#E31C25" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar hidden />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>✕</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item: any) => item.id.toString()}
        pagingEnabled={true}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        renderItem={({ item }) => (
          <ReelItem
            item={item}
            isActive={activeId === item.id}
            containerHeight={height}
            // 3. ON PASSE L'ACTION AU COMPOSANT ENFANT
            onPressOrder={() => {
              setSelectedItem(item);
              setModalVisible(true);
            }}
          />
        )}
      />

      {/* 4. LE MODAL UNIQUE POUR TOUS LES REELS */}
      {selectedItem && (
        <OrderModal
          visible={modalVisible}
          item={selectedItem}
          onClose={() => setModalVisible(false)}
          onConfirm={handleConfirmOrder}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  backText: { color: "white", fontSize: 20, fontWeight: "bold" },
});
