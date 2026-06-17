import { useState, useCallback } from "react";
import { router } from "expo-router";
import { nutritionApi, profileApi, bodyApi, summaryApi, DailySummary, UserProfile, BodyMetric, WeeklySummary } from "@/lib/api/nutrition";
import { ApiError } from "@/lib/api/client";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useHome() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // silent : recharge sans afficher les skeletons (garde les données à l'écran).
  // Utilisé au refocus pour mettre à jour discrètement après un ajout.
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [s, p, m, w] = await Promise.all([
        nutritionApi.getDaily(todayStr()),
        profileApi.get(),
        bodyApi.getMetrics(2),
        summaryApi.getWeekly(),
      ]);
      setSummary(s);
      setProfile(p);
      setMetrics(m);
      setWeekly(w);
    } catch (e: unknown) {
      // 404 on profile means the user hasn't completed onboarding yet
      if (e instanceof ApiError && e.status === 404) {
        router.replace("/onboarding");
        return;
      }
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const caloriesLeft = (profile?.targetCalories ?? 0) - (summary?.totals.calories ?? 0);
  const latestWeight = metrics[0]?.weightKg ?? null;
  const weightTrend =
    metrics.length >= 2 && metrics[0].weightKg && metrics[1].weightKg
      ? metrics[0].weightKg - metrics[1].weightKg
      : null;

  return { summary, profile, weekly, loading, error, caloriesLeft, latestWeight, weightTrend, refresh: load };
}
