import { useState, useCallback } from "react";
import { router } from "expo-router";
import { profileApi, UserProfile } from "@/lib/api/nutrition";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth.store";

export function useProfile() {
  const { signOut } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Refresh streak first, then fetch profile
      await api.post("/api/auth/profile/streak", {});
      const p = await profileApi.get();
      setProfile(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTargets = useCallback(async (data: {
    targetCalories?: number;
    targetProteinG?: number;
    targetCarbsG?: number;
    targetFatG?: number;
  }) => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch<UserProfile>("/api/auth/profile", data);
      setProfile(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }, [profile]);

  const logout = useCallback(async () => {
    await signOut();
    router.replace("/(auth)/login");
  }, [signOut]);

  return { profile, loading, saving, error, load, updateTargets, signOut: logout };
}
