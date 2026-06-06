import { useState, useCallback, useRef } from "react";
import { Food, searchLocalFoods, searchOpenFoodFacts, cacheFood, logFoodEntry } from "@/lib/api/foods";
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
        // Cherche d'abord en local
        const local = await searchLocalFoods(text);
        if (local.length > 0) {
          setResults(local);
        } else {
          // Fallback Open Food Facts
          const off = await searchOpenFoodFacts(text);
          setResults(off);
        }
      } catch {
        setError("Erreur de recherche");
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const logFood = useCallback(async (food: Food, quantityG: number) => {
    setLogging(true);
    setError(null);
    try {
      let foodId = food.id;

      // Si l'aliment vient d'OFF (pas encore en DB), on le cache d'abord
      if (!foodId) {
        const cached = await cacheFood({
          name: food.name,
          brand: food.brand,
          barcode: food.barcode,
          caloriesPer100g: food.caloriesPer100g,
          proteinPer100g: food.proteinPer100g,
          carbsPer100g: food.carbsPer100g,
          fatPer100g: food.fatPer100g,
        });
        foodId = cached.id;
      }

      await logFoodEntry({
        foodId,
        mealType: meal,
        quantityG,
        date: new Date().toISOString().split("T")[0],
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
