// app/components/CampaignList.tsx
import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { CampaignCard } from './CampaignCard';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CollectivePot, CollectivePotStatus } from "../../types/collective_pot";

interface CampaignListProps {
  dateFilter?: 'tomorrow' | 'today';
  onOrder?: (collectivePot: CollectivePot) => void;
}

export default function CampaignList({ 
  dateFilter = 'tomorrow',
  onOrder 
}: CampaignListProps) {
  const { campaigns, loading, error, refresh } = useCampaigns(dateFilter);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F39C12" />
        <Text style={styles.loadingText}>Chargement des marmites...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Text style={styles.retryText} onPress={refresh}>
          🔄 Réessayer
        </Text>
      </View>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>🍲</Text>
        <Text style={styles.emptyTitle}>Aucune marmite disponible</Text>
        <Text style={styles.emptySubtitle}>
          Revenez plus tard pour découvrir de nouvelles saveurs !
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={campaigns}
      keyExtractor={(item) => item.id}
      numColumns={2}
      refreshing={loading}
      onRefresh={refresh}
      renderItem={({ item }) => (
        <View style={styles.cardContainer}>
          <CampaignCard 
            campaign={item}
            onPress={() => onOrder?.(item)}
          />
        </View>
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    color: '#3498DB',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  list: {
    padding: 8,
    paddingBottom: 20,
  },
  cardContainer: {
    flex: 1,
    maxWidth: '50%',
  },
});