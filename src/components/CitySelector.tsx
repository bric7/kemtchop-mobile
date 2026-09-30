// app/components/CitySelector.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { api } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface City {
  id: number;
  name: string;
}

interface CitySelectorProps {
  visible: boolean;
  onSelect: (city: City) => void;
  onClose?: () => void;
}

const DEFAULT_CITIES: City[] = [
  { id: 1, name: "Yaoundé" },
  { id: 2, name: "Douala" },
];

export default function CitySelector({ visible, onSelect, onClose }: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>(DEFAULT_CITIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchCities();
    }
  }, [visible]);

  const fetchCities = async () => {
    try {
      const data = await api.get("/cities/");
      if (Array.isArray(data) && data.length > 0) {
        setCities(data);
      } else {
        setCities(DEFAULT_CITIES);
      }
    } catch (e) {
      // Fallback gracieux si l'API /cities/ n'est pas encore déployée sur le serveur distant
      setCities(DEFAULT_CITIES);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (city: City) => {
    await AsyncStorage.setItem('selected_city', JSON.stringify(city));
    onSelect(city);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.indicator} />
          <Text style={styles.title}>📍 Où êtes-vous situé ?</Text>
          <Text style={styles.subtitle}>
            Choisissez votre ville pour voir les menus disponibles dans votre zone.
          </Text>

          {loading ? (
            <ActivityIndicator color="#E31C25" size="large" style={{ marginVertical: 40 }} />
          ) : (
            <FlatList
              data={cities}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityItem}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.cityIcon}>
                    <MapPin size={20} color="#E31C25" />
                  </View>
                  <Text style={styles.cityName}>{item.name}</Text>
                  <ChevronRight size={20} color="#CBD5E1" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aucune ville disponible pour le moment.</Text>
              }
            />
          )}

          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '70%',
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cityName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
});
