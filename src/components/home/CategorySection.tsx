// components/home/CategorySection.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const CATEGORIES = [
  "Tout",
  "Grillades",
  "Plats Locaux",
  "Boissons",
  "Accompagnements",
  "Rôti",
] as const;

type Category = typeof CATEGORIES[number];

interface CategorySectionProps {
  activeCategory: Category;
  onCategoryPress: (category: Category) => void;
}

export default function CategorySection({ 
  activeCategory, 
  onCategoryPress 
}: CategorySectionProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesScroll}
      contentContainerStyle={{ paddingRight: 20 }}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat}
          onPress={() => onCategoryPress(cat)}
          style={[
            styles.categoryChip,
            activeCategory === cat && styles.categoryChipActive,
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.categoryText,
              activeCategory === cat && styles.categoryTextActive,
            ]}
          >
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoriesScroll: { 
    marginBottom: 20, 
    paddingHorizontal: 20 
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipActive: { 
    backgroundColor: "#000",
    borderColor: "#E31C25",
  },
  categoryText: { 
    color: "#666", 
    fontWeight: "700",
    fontSize: 12,
  },
  categoryTextActive: { 
    color: "#fff",
    fontSize: 12,
  },
});