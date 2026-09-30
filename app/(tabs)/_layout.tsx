import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
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
          title: "Accueil",
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
          title: "Commandes",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "receipt" : "receipt-outline"}
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
          title: "Conseils",
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
          title: "Profil",
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
