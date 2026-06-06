import { useState, useCallback } from "react";
import { api } from "@/lib/api/client";

export interface DayHistory {
  date: string;
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
  targets: { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null };
  entryCount: number;
}

export function useNutritionHistory() {
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number = 7) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<DayHistory[]>(`/api/nutrition/history?days=${d}`);
      setHistory(data);
      setDays(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  return { history, days, loading, error, load };
}
