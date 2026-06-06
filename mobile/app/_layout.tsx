import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/auth.store";

function AuthGuard() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuth) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0A0A" } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
