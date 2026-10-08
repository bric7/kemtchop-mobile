import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MapPin, RefreshCw } from 'lucide-react-native';
import { SearchBar } from '../SearchBar';

interface HomeHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  userName?: string | null;
  selectedCity?: { id: number; name: string } | null;
  onPressCity: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function HomeHeader({ 
  searchQuery, 
  onSearchChange, 
  userName,
  selectedCity,
  onPressCity,
  onRefresh,
  isRefreshing = false,
}: HomeHeaderProps) {
  return (
    <View style={styles.topBar}>
      <View style={styles.headerRow}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
          <Text style={styles.logo}>KEMTCHOP</Text>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.cityPicker} onPress={onPressCity}>
            <MapPin size={15} color="#E31C25" />
            <Text style={styles.cityName}>
              {selectedCity ? selectedCity.name : "Ville..."}
            </Text>
          </TouchableOpacity>

          {onRefresh && (
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={onRefresh}
              activeOpacity={0.7}
              disabled={isRefreshing}
              accessibilityLabel="Actualiser le menu"
            >
              {isRefreshing ? (
                <ActivityIndicator size={14} color="#E31C25" />
              ) : (
                <RefreshCw size={15} color="#475569" />
              )}
            </TouchableOpacity>
          )}
        </View>
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
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#E31C25",
    letterSpacing: 0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
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