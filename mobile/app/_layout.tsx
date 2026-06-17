import { useEffect } from "react";
import { View } from "react-native";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/auth.store";
import { setOnUnauthorized } from "@/lib/api/client";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/lib/logger"; // initialise les global handlers au démarrage
import { initRevenueCat } from "@/hooks/use-premium";

function AuthGuard() {
  const { userId, isAuthenticated, isLoading, restoreSession, signOut } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // When any API call returns 401 (expired token), force logout
  useEffect(() => {
    setOnUnauthorized(() => {
      signOut();
    });
  }, [signOut]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      initRevenueCat(userId);
    }
  }, [isAuthenticated, userId]);

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
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <ErrorBoundary>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0A0A" } }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="profile/index" />
              <Stack.Screen name="notifications/index" />
              <Stack.Screen name="paywall/index" options={{ presentation: "modal" }} />
            </Stack>
          </ErrorBoundary>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
