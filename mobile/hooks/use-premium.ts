import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { api } from "@/lib/api/client";
import { profileApi } from "@/lib/api/nutrition";

// Stub purchase result — wire to RevenueCat / StoreKit when ready
async function purchasePremium(): Promise<{ success: boolean; receiptData?: string }> {
  // TODO: replace with Purchases.purchasePackage(pkg) from react-native-purchases
  // import Purchases from 'react-native-purchases';
  // const offerings = await Purchases.getOfferings();
  // const pkg = offerings.current?.monthly;
  // if (!pkg) throw new Error('No offerings');
  // const { customerInfo } = await Purchases.purchasePackage(pkg);
  // const active = customerInfo.entitlements.active['premium'];
  // return { success: !!active };
  return { success: true }; // sandbox stub
}

export function usePremium() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await purchasePremium();
      if (!result.success) return false;

      await api.post("/api/auth/profile/upgrade", {
        plan: "PREMIUM",
        receiptData: result.receiptData,
      });
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur d'achat";
      // User cancelled is not an error worth showing
      if (!msg.includes("cancel") && !msg.includes("Cancel")) {
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
      // TODO: const { customerInfo } = await Purchases.restorePurchases();
      // Check entitlements and sync to backend
      const profile = await profileApi.get();
      return profile.plan === "PREMIUM";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, upgrade, restore };
}
