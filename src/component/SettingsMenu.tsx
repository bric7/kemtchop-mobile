import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/i18n/LanguageContext";

interface SettingsMenuProps {
  onLogout: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onLogout }) => {
  const { t, isEnglish } = useTranslation();

  return (
    <View style={styles.menuSection}>
      <Text style={styles.sectionLabel}>
        {isEnglish ? "PREFERENCES & SETTINGS" : "PARAMÈTRES"}
      </Text>

      {/* 🌐 Choix de la langue bilingue FR / EN */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.subSectionTitle}>
          {t("profile.language")}
        </Text>
        <LanguageSelector variant="full" />
      </View>

      {/* Notifications */}
      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconContainer}>
          <Ionicons name="notifications" size={22} color="#E31C25" />
        </View>
        <Text style={styles.menuText}>Notifications</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{isEnglish ? "ACTIVE" : "ACTIF"}</Text>
        </View>
      </TouchableOpacity>

      {/* Déconnexion */}
      <TouchableOpacity
        style={[styles.menuItem, { marginTop: 10 }]}
        onPress={onLogout}
      >
        <View
          style={[styles.menuIconContainer, { backgroundColor: "#fff0f0" }]}
        >
          <Ionicons name="log-out" size={22} color="#ff4444" />
        </View>
        <Text style={[styles.menuText, { color: "#ff4444" }]}>
          {t("profile.logout")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  menuSection: { paddingHorizontal: 20, marginTop: 15 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#bbb",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbfbfb",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f2f2f2",
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    backgroundColor: "#fff",
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#333" },
  statusBadge: {
    backgroundColor: "#e8fdf0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { color: "#25D366", fontSize: 10, fontWeight: "900" },
});

export default SettingsMenu;
