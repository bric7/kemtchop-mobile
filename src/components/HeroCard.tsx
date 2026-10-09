// app/components/HeroCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeroCardProps {
  campaign?: any;
  item?: any;
  onOrder?: (campaign: any) => void;
  getMediaUrl?: (url: string) => string;
}

export default function HeroCard({ campaign, item, onOrder }: HeroCardProps) {
  const activeItem = campaign || item;
  if (!activeItem) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🍲 {activeItem.recipe?.name || activeItem.product_name || activeItem.name || 'Marmite'}</Text>
      <Text style={styles.subtitle}>
        {activeItem.current_orders !== undefined ? `${activeItem.current_orders}/${activeItem.minimum_orders || 4} commandes` : `${activeItem.price || ''} FCFA`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
});