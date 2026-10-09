// src/components/LanguageSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Globe, Check } from 'lucide-react-native';
import { useTranslation } from '../i18n/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'compact' }) => {
  const { language, setLanguage, isEnglish } = useTranslation();

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          onPress={() => setLanguage('fr')}
          activeOpacity={0.7}
          style={[
            styles.compactBtn,
            language === 'fr' && styles.compactBtnActive,
          ]}
        >
          <Text
            style={[
              styles.compactText,
              language === 'fr' && styles.compactTextActive,
            ]}
          >
            FR
          </Text>
        </TouchableOpacity>

        <View style={styles.compactDivider} />

        <TouchableOpacity
          onPress={() => setLanguage('en')}
          activeOpacity={0.7}
          style={[
            styles.compactBtn,
            language === 'en' && styles.compactBtnActive,
          ]}
        >
          <Text
            style={[
              styles.compactText,
              language === 'en' && styles.compactTextActive,
            ]}
          >
            EN
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Variant "full" pour la page Profil
  return (
    <View style={styles.fullContainer}>
      <TouchableOpacity
        onPress={() => setLanguage('fr')}
        activeOpacity={0.7}
        style={[
          styles.optionCard,
          language === 'fr' && styles.optionCardActive,
        ]}
      >
        <View style={styles.optionContent}>
          <Text style={styles.flag}>🇨🇲</Text>
          <View>
            <Text style={[styles.optionTitle, language === 'fr' && styles.optionTitleActive]}>
              Français
            </Text>
            <Text style={styles.optionSubtitle}>Langue par défaut</Text>
          </View>
        </View>
        {language === 'fr' && (
          <View style={styles.checkBadge}>
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setLanguage('en')}
        activeOpacity={0.7}
        style={[
          styles.optionCard,
          language === 'en' && styles.optionCardActive,
        ]}
      >
        <View style={styles.optionContent}>
          <Text style={styles.flag}>🇬🇧</Text>
          <View>
            <Text style={[styles.optionTitle, language === 'en' && styles.optionTitleActive]}>
              English
            </Text>
            <Text style={styles.optionSubtitle}>Cameroon & International</Text>
          </View>
        </View>
        {language === 'en' && (
          <View style={styles.checkBadge}>
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compactBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  compactBtnActive: {
    backgroundColor: '#E31C25',
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  compactText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  compactTextActive: {
    color: '#FFFFFF',
  },
  compactDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 1,
  },

  fullContainer: {
    gap: 8,
    width: '100%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionCardActive: {
    borderColor: '#E31C25',
    backgroundColor: '#FFF5F5',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 22,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  optionTitleActive: {
    color: '#E31C25',
  },
  optionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E31C25',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LanguageSelector;
