// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiFetch, triggerGlobalRefresh } from '../../config/api';

// Vérifie si l'application s'exécute dans Expo Go
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo';

// Configuration du handler uniquement si hors Expo Go et hors web
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    // Ignore if not supported in environment
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
}

export const NotificationService = {
  /**
   * Synchronise le token Expo Push avec le compte utilisateur connecté dans le backend
   */
  syncTokenWithBackend: async (token?: string): Promise<boolean> => {
    try {
      const pushToken = token || (await AsyncStorage.getItem('expo_push_token'));
      if (!pushToken) return false;

      const accessToken = await AsyncStorage.getItem('access_token');
      if (!accessToken) {
        // Utilisateur non encore authentifié : le token sera enregistré dès la connexion
        return false;
      }

      const res = await apiFetch(
        '/users/update-token',
        {
          method: 'POST',
          body: JSON.stringify({ expo_token: pushToken }),
        },
        true
      );
      console.log('✅ Token push synchronisé avec le backend KemTchop:', res?.status || 'OK');
      return true;
    } catch (e) {
      console.warn('⚠️ Échec synchronisation token push:', e);
      return false;
    }
  },

  /**
   * Enregistre l'appareil pour les notifications push
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return null;
    }

    if (isExpoGo) {
      console.log('⚠️ Expo Go détecté : push notifications ignorées en développement.');
      return null;
    }

    if (!Device.isDevice) {
      console.log('⚠️ Les notifications push nécessitent un appareil physique.');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log("❌ Permission de notifications refusée par l'utilisateur.");
        return null;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E31C25',
          sound: 'default',
        });
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        (Constants as any).easConfig?.projectId ||
        '81bf6e71-0bae-407b-858f-38994170b6e0';

      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenResponse.data;
      console.log('✅ Token Expo Push obtenu:', token);

      if (token) {
        await AsyncStorage.setItem('expo_push_token', token);
        await NotificationService.syncTokenWithBackend(token);
      }

      return token;
    } catch (error) {
      console.warn('⚠️ Erreur obtention Expo push token:', error);
      return null;
    }
  },

  /**
   * Initialise les écouteurs de notifications pour rafraîchir l'interface automatiquement
   */
  initNotificationListeners: async () => {
    if (Platform.OS === 'web' || isExpoGo) return () => {};

    try {
      const receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log(
            '🔔 [KemTchop Mobile] Notification reçue :',
            notification.request.content.title
          );
          triggerGlobalRefresh();
        }
      );

      const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log(
            '👆 Notification cliquée :',
            response.notification.request.content.data
          );
          triggerGlobalRefresh();
        }
      );

      // 🔄 Écoute le renouvellement dynamique du token par l'OS
      const tokenSubscription = Notifications.addPushTokenListener((tokenData) => {
        console.log('🔄 Token push renouvelé par l’OS:', tokenData?.data);
        if (tokenData?.data) {
          AsyncStorage.setItem('expo_push_token', tokenData.data);
          NotificationService.syncTokenWithBackend(tokenData.data);
        }
      });

      return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
        tokenSubscription.remove();
      };
    } catch (e) {
      return () => {};
    }
  },
};

export default NotificationService;