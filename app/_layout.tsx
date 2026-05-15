import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="reels"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}
