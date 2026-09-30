import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { SearchBar } from '../SearchBar';

interface HomeHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  userName?: string | null;
  selectedCity?: { id: number; name: string } | null;
  onPressCity: () => void;
}

export default function HomeHeader({ 
  searchQuery, 
  onSearchChange, 
  userName,
  selectedCity,
  onPressCity
}: HomeHeaderProps) {
  return (
    <View style={styles.topBar}>
      <View style={styles.headerRow}>
        <Text style={styles.logo}>KEMTCHOP</Text>
        <TouchableOpacity style={styles.cityPicker} onPress={onPressCity}>
          <MapPin size={16} color="#E31C25" />
          <Text style={styles.cityName}>
            {selectedCity ? selectedCity.name : "Ville..."}
          </Text>
        </TouchableOpacity>
      </View>

      <SearchBar value={searchQuery} onChange={onSearchChange} />
      {userName && searchQuery === '' && (
        <Text style={styles.welcomeText}>Salut, {userName} ! 👋</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#E31C25",
    letterSpacing: 1,
  },
  cityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cityName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginLeft: 6,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 5,
    marginTop: 10,
  },
});