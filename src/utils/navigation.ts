// utils/navigation.ts
import { router } from "expo-router";
import { Platform } from "react-native";

export const safeNavigate = {
  back: (fallback: string = "/") => {
    if (Platform.OS === "web") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        router.replace(fallback);
      }
    } else {
      try {
        router.back();
      } catch {
        router.replace(fallback);
      }
    }
  },
  replace: (path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    router.replace(normalized);
  },
  push: (path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    router.push(normalized);
  },
};