import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "@/i18n/LanguageContext";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E31C25",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          height: 65,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {/* 1. ACCUEIL */}
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* 2. MES COMMANDES */}
      <Tabs.Screen
        name="orders"
        options={{
          title: t("nav.orders"),
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={(focused ? "receipt" : "receipt-text-outline") as any}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 3. CONSEILS / CHAT */}
      <Tabs.Screen
        name="chat"
        options={{
          title: t("nav.chat"),
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={
                focused ? "chat-processing" : "chat-processing-outline"
              }
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 4. PROFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t("nav.profile"),
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "account" : "account-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
