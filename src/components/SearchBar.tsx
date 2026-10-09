import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Rechercher un plat...",
}: {
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
}) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
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
