// components/home/HeroSection.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HeroCard from '../HeroCard';

interface Product {
  id: number;
  product_name: string;
  price: number;
  image_url: string;
  is_hero?: boolean;
  [key: string]: any;
}

interface HeroSectionProps {
  featuredProduct: Product | null;
  onOrder: (item: Product) => void;
  getMediaUrl: (url: string) => string;
}

export default function HeroSection({ 
  featuredProduct, 
  onOrder, 
  getMediaUrl 
}: HeroSectionProps) {
  if (!featuredProduct) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Suggestion du Chef</Text>
      <HeroCard 
        item={featuredProduct} 
        onOrder={() => onOrder(featuredProduct)}
        getMediaUrl={getMediaUrl}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 20,
    marginBottom: 15,
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});