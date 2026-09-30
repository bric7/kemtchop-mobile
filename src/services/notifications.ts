import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from "../utils/platform";

// Vérifie si l'application s'exécute dans Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configuration du handler uniquement si hors Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
}

export const NotificationService = {
  registerForPushNotifications: async (phone: string, SERVER_IP: string): Promise<string | null> => {
    if (isExpoGo) {
      log('⚠️ Expo Go ne supporte plus les push notifications Android (SDK 53+).');
      return null;
    }

    if (!Device.isDevice) {
      log('⚠️ Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      log('❌ Permission refusée pour les notifications');
      return null;
    }

    try {
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'ton-project-id',
      })).data;
      
      log('✅ Token Expo obtenu:', token);
      
      await AsyncStorage.setItem('expo_push_token', token);
      
      await fetch(`http://${SERVER_IP}:8000/users/update-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, expo_token: token }),
      });
      
      return token;
    } catch (error) {
      log('❌ Erreur obtention token:', error);
      return null;
    }
  },

  sendLocalNotification: async (payload: NotificationPayload) => {
    if (isExpoGo) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        sound: payload.sound || 'default',
      },
      trigger: null,
    });
  },

  scheduleNotification: async (payload: NotificationPayload, trigger: Notifications.ScheduleInput) => {
    if (isExpoGo) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        sound: payload.sound || "default",
      },
      trigger,
    });
  },

  addListener: (callback: (notification: Notifications.Notification) => void) => {
    if (isExpoGo) return { remove: () => {} } as Notifications.Subscription;
    return Notifications.addNotificationReceivedListener(callback);
  },

  addResponseListener: (callback: (response: Notifications.NotificationResponse) => void) => {
    if (isExpoGo) return { remove: () => {} } as Notifications.Subscription;
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  removeListener: (subscription: Notifications.Subscription) => {
    if (isExpoGo) return;
    subscription?.remove();
  },
};

export default NotificationService;