import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

export const SearchBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder="Rechercher un plat... (ex: Eru)"
      value={value}
      onChangeText={onChange}
      placeholderTextColor="#999"
    />
  </View>
);

const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: { fontSize: 14, color: "#333" },
});
