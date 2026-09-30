import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { CartProvider } from "@/context/CartContext";

// Empêche la fermeture auto du splash pour charger les ressources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // On cache le splash dès que le layout est monté (ou après chargement data)
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <CartProvider>
        <View style={styles.webContainer}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f8fafc" } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="reels"
              options={{
                presentation: "modal",
                headerShown: false,
                contentStyle: { backgroundColor: "#000" },
              }}
            />
          </Stack>
        </View>
      </CartProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    backgroundColor: "#f8fafc",
  },
});
