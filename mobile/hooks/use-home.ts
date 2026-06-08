import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { nutritionApi, profileApi, bodyApi, DailySummary, UserProfile, BodyMetric } from "@/lib/api/nutrition";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function useHome() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p, m] = await Promise.all([
        nutritionApi.getDaily(todayStr()),
        profileApi.get(),
        bodyApi.getMetrics(2),
      ]);
      setSummary(s);
      setProfile(p);
      setMetrics(m);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur de chargement";
      if (msg === "Profile not found") {
        router.replace("/onboarding");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const caloriesLeft = (profile?.targetCalories ?? 0) - (summary?.totals.calories ?? 0);
  const latestWeight = metrics[0]?.weightKg ?? null;
  const weightTrend =
    metrics.length >= 2 && metrics[0].weightKg && metrics[1].weightKg
      ? metrics[0].weightKg - metrics[1].weightKg
      : null;

  return { summary, profile, loading, error, caloriesLeft, latestWeight, weightTrend, refresh: load };
}
