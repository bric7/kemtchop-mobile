import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  // --- ÉTAPE 1 : VÉRIFICATION ANTICIPÉE ---
  // Si on est dans Expo Go, on sort immédiatement sans rien importer d'autre
  if (Constants.appOwnership === "expo") {
    console.log(
      "⚠️ Mode Expo Go détecté : Notifications désactivées pour éviter le crash.",
    );
    return null;
  }

  // --- ÉTAPE 2 : IMPORT DYNAMIQUE ---
  // On importe 'expo-notifications' ici seulement pour que Expo Go ne le voit pas au démarrage
  const Notifications = await import("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  let token;

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;
    } catch (e) {
      console.log("Erreur lors de la récupération du Token:", e);
    }
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
