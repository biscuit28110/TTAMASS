import { useState, useCallback, useRef } from "react";
import { Food, searchLocalFoods, logFoodEntry } from "@/lib/api/foods";
import { MealType } from "@/hooks/use-nutrition";

export function useFoodSearch(meal: MealType) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const foods = await searchLocalFoods(text);
        setResults(foods);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur de recherche");
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const logFood = useCallback(async (food: Food, quantityG: number) => {
    setLogging(true);
    setError(null);
    try {
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      await logFoodEntry({
        foodId: food.id,
        mealType: meal,
        quantityG,
        date: dateStr,
      });
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors du log");
      return false;
    } finally {
      setLogging(false);
    }
  }, [meal]);

  return { query, results, searching, logging, error, search, logFood };
}
