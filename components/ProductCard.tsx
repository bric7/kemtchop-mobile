import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const ProductCard = ({ item, onOrder }: any) => (
  <View style={styles.productCard}>
    <Image source={{ uri: item.image_url }} style={styles.productImage} />
    <View style={styles.productInfo}>
      <Text style={styles.productName}>{item.product_name}</Text>
      <Text style={styles.productPrice}>{item.price} FCFA</Text>
      <TouchableOpacity style={styles.addBtn} onPress={() => onOrder(item)}>
        <Text style={styles.addBtnText}>Commander</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    overflow: "hidden",
  },
  productImage: { width: "100%", height: 120 },
  productInfo: { padding: 10 },
  productName: { fontSize: 14, fontWeight: "bold", color: "#333" },
  productPrice: {
    fontSize: 13,
    color: "#E31C25",
    fontWeight: "bold",
    marginVertical: 5,
  },
  addBtn: {
    backgroundColor: "#000",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
});
