import { useState, useCallback } from "react";
import { Alert, Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { api } from "@/lib/api/client";

const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? "";
const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? "";

export function initRevenueCat(userId: string) {
  const apiKey = Platform.OS === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  if (!apiKey) return;
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
  Purchases.logIn(userId);
}

export function usePremium() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.monthly;
      if (!pkg) throw new Error("Aucune offre disponible");

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPremium = !!customerInfo.entitlements.active["premium"];
      if (!isPremium) return false;

      await api.post("/api/auth/profile/upgrade", { plan: "PREMIUM" });
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur d'achat";
      if (!msg.toLowerCase().includes("cancel")) {
        setError(msg);
        Alert.alert("Erreur", msg);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = !!customerInfo.entitlements.active["premium"];

      await api.post("/api/auth/profile/upgrade", {
        plan: isPremium ? "PREMIUM" : "FREE",
      });

      if (!isPremium) {
        Alert.alert("Aucun abonnement actif", "Aucun achat Premium trouvé sur ce compte.");
      }
      return isPremium;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, upgrade, restore };
}
