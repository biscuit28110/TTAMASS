import { useState, useCallback } from "react";
import { api } from "@/lib/api/client";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface FoodEntry {
  id: string;
  mealType: MealType;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  food: { id: string; name: string; brand: string | null; caloriesPer100g: number };
}

export interface DailyData {
  date: string;
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
  targets: { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null };
  byMeal: Record<MealType, FoodEntry[]>;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useNutrition() {
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (date = todayStr()) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<DailyData>(`/api/nutrition/daily?date=${date}`);
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    // Snapshot for rollback if the API call fails
    const snapshot = data;
    setData((prev) => {
      if (!prev) return prev;
      const byMeal = { ...prev.byMeal } as Record<MealType, FoodEntry[]>;
      (Object.keys(byMeal) as MealType[]).forEach((meal) => {
        byMeal[meal] = byMeal[meal].filter((e) => e.id !== id);
      });
      const all = Object.values(byMeal).flat();
      return {
        ...prev,
        byMeal,
        totals: {
          calories: all.reduce((s, e) => s + e.calories, 0),
          proteinG: all.reduce((s, e) => s + e.proteinG, 0),
          carbsG: all.reduce((s, e) => s + e.carbsG, 0),
          fatG: all.reduce((s, e) => s + e.fatG, 0),
        },
      };
    });
    try {
      await api.delete(`/api/nutrition/food-entries/${id}`);
    } catch (e: unknown) {
      setData(snapshot);
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    }
  }, [data]);

  return { data, loading, error, load, deleteEntry };
}
