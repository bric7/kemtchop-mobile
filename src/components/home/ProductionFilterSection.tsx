import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type OfferDimension = "🔥 À réserver" | "🍲 Menu du Jour";

interface ProductionFilterSectionProps {
  productionDimension: OfferDimension;
  setProductionDimension: (d: OfferDimension) => void;
  culinaryCategory: string;
  setCulinaryCategory: (c: string) => void;
  dailyCount?: number;
  reservationCount?: number;
}

const CATEGORIES = ["Tout", "Plats Locaux", "Grillades", "Boissons", "Accompagnements"];

export default function ProductionFilterSection({
  productionDimension,
  setProductionDimension,
  culinaryCategory,
  setCulinaryCategory,
  dailyCount = 0,
  reservationCount = 0,
}: ProductionFilterSectionProps) {
  const isDaily = productionDimension === "🍲 Menu du Jour";
  const isReserve = productionDimension === "🔥 À réserver";

  return (
    <View style={styles.container}>
      {/* 🏷️ Titre de section explicatif */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionOverline}>MODES DE SERVICE</Text>
        <Text style={styles.sectionTitle}>Comment souhaitez-vous commander ?</Text>
      </View>

      {/* 🎛️ Les 2 Grands Boutons / Cartes de Sélection de Mode */}
      <View style={styles.modesRow}>
        {/* BOUTON 1 : Menu du Jour (Livraison Immédiate) */}
        <TouchableOpacity
          style={[styles.modeCard, isDaily && styles.modeCardDailyActive]}
          onPress={() => setProductionDimension("🍲 Menu du Jour")}
          activeOpacity={0.85}
        >
          <View style={styles.modeCardHeader}>
            <View style={[styles.modeIconCircle, isDaily ? styles.modeIconCircleActiveDaily : styles.modeIconCircleInactive]}>
              <Text style={styles.modeIconText}>🍲</Text>
            </View>
            <View style={[styles.modeTag, isDaily ? styles.modeTagDailyActive : styles.modeTagInactive]}>
              <Text style={[styles.modeTagText, isDaily ? styles.modeTagTextActive : styles.modeTagTextInactive]}>
                {dailyCount > 0 ? "EN DIRECT" : "AUJOURD'HUI"}
              </Text>
            </View>
          </View>

          <Text style={[styles.modeTitle, isDaily && styles.modeTitleActive]}>
            Menu du Jour
          </Text>
          <Text style={[styles.modeSubtitle, isDaily && styles.modeSubtitleActive]}>
            Livraison immédiate
          </Text>

          <View style={styles.modeStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: dailyCount > 0 ? '#10B981' : '#94a3b8' }]} />
            <Text style={[styles.modeStatusText, isDaily && styles.modeStatusTextActive]}>
              {dailyCount > 0 ? `${dailyCount} plat(s) prêt(s)` : "Prochain service demain"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* BOUTON 2 : À Réserver (Réservations de portions J+1 à J+7) */}
        <TouchableOpacity
          style={[styles.modeCard, isReserve && styles.modeCardReserveActive]}
          onPress={() => setProductionDimension("🔥 À réserver")}
          activeOpacity={0.85}
        >
          <View style={styles.modeCardHeader}>
            <View style={[styles.modeIconCircle, isReserve ? styles.modeIconCircleActiveReserve : styles.modeIconCircleInactive]}>
              <Text style={styles.modeIconText}>🔥</Text>
            </View>
            <View style={[styles.modeTag, isReserve ? styles.modeTagReserveActive : styles.modeTagInactive]}>
              <Text style={[styles.modeTagText, isReserve ? styles.modeTagTextActive : styles.modeTagTextInactive]}>
                RÉSERVATION
              </Text>
            </View>
          </View>

          <Text style={[styles.modeTitle, isReserve && styles.modeTitleActive]}>
            À Réserver
          </Text>
          <Text style={[styles.modeSubtitle, isReserve && styles.modeSubtitleActive]}>
            Dès demain (J+1)
          </Text>

          <View style={styles.modeStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.modeStatusText, isReserve && styles.modeStatusTextActive]}>
              {reservationCount > 0 ? `${reservationCount} recettes ouvertes` : "Toutes les recettes"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 💡 Bannière Pédagogique : Règle métier explicite */}
      <View style={[styles.explainerBanner, isDaily ? styles.explainerBannerDaily : styles.explainerBannerReserve]}>
        <Ionicons
          name={isDaily ? "flash-outline" : "calendar-outline"}
          size={18}
          color={isDaily ? "#059669" : "#dc2626"}
          style={styles.explainerIcon}
        />
        <View style={styles.explainerContent}>
          <Text style={[styles.explainerTitle, { color: isDaily ? "#065f46" : "#991b1b" }]}>
            {isDaily ? "⚡ Menu du Jour (Production confirmée)" : "📅 Réservation de portions (Seuil minimum : 4)"}
          </Text>
          <Text style={[styles.explainerText, { color: isDaily ? "#047857" : "#7f1d1d" }]}>
            {isDaily
              ? "Plat garanti pour aujourd'hui. Commandez vos portions directement dans la limite de la capacité restante !"
              : "Réservez vos portions individuelles à l'avance. Dès que 4 portions sont atteintes (même par une seule commande), la production est garantie pour cette date !"}
          </Text>
        </View>
      </View>

      {/* 🏷️ Filtres Catégories sous forme de pilules raffinées */}
      <View style={styles.categoriesHeader}>
        <Text style={styles.categoriesLabel}>Catégories :</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {CATEGORIES.map((cat) => {
          const isActive = culinaryCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCulinaryCategory(cat)}
              style={[styles.catChip, isActive && styles.catChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionOverline: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  modesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  modeCardDailyActive: {
    backgroundColor: '#064e3b',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modeCardReserveActive: {
    backgroundColor: '#7f1d1d',
    borderColor: '#E31C25',
    shadowColor: '#E31C25',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIconCircleInactive: {
    backgroundColor: '#f1f5f9',
  },
  modeIconCircleActiveDaily: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeIconCircleActiveReserve: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeIconText: {
    fontSize: 18,
  },
  modeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  modeTagInactive: {
    backgroundColor: '#f1f5f9',
  },
  modeTagDailyActive: {
    backgroundColor: '#10B981',
  },
  modeTagReserveActive: {
    backgroundColor: '#E31C25',
  },
  modeTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modeTagTextInactive: {
    color: '#64748b',
  },
  modeTagTextActive: {
    color: '#ffffff',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  modeTitleActive: {
    color: '#ffffff',
  },
  modeSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  modeSubtitleActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  modeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modeStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  modeStatusTextActive: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  explainerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  explainerBannerDaily: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  explainerBannerReserve: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  explainerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  explainerContent: {
    flex: 1,
  },
  explainerTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  explainerText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoriesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  catChipActive: {
    backgroundColor: '#E31C25',
    borderColor: '#E31C25',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
});