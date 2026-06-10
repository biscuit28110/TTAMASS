import { useState, useCallback } from "react";
import { api } from "@/lib/api/client";
import { Food, searchOpenFoodFacts, cacheFood, logFoodEntry } from "@/lib/api/foods";
import { MealType } from "@/hooks/use-nutrition";

export function useBarcodeScanner(meal: MealType) {
  const [scanned, setScanned] = useState(false);
  const [found, setFound] = useState<Food | null>(null);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async (barcode: string) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError(null);

    try {
      // 1. Cherche dans notre cache local
      const local = await api.get<Food[]>(`/api/nutrition/foods?barcode=${encodeURIComponent(barcode)}`);
      if (local.length > 0) {
        setFound(local[0]);
        setLoading(false);
        return;
      }

      // 2. Appel direct Open Food Facts par code-barres
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();

      if (data.status !== 1 || !data.product?.nutriments) {
        setError("Produit non trouvé dans la base Open Food Facts");
        setLoading(false);
        return;
      }

      const p = data.product;
      const food: Food = {
        id: "",
        name: p.product_name || p.product_name_fr || "Produit inconnu",
        brand: p.brands || null,
        barcode,
        caloriesPer100g: p.nutriments["energy-kcal_100g"] ?? 0,
        proteinPer100g: p.nutriments.proteins_100g ?? 0,
        carbsPer100g: p.nutriments.carbohydrates_100g ?? 0,
        fatPer100g: p.nutriments.fat_100g ?? 0,
        source: "OPEN_FOOD_FACTS",
      };
      setFound(food);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la recherche du produit");
    } finally {
      setLoading(false);
    }
  }, [scanned, loading]);

  const logFood = useCallback(async (food: Food, quantityG: number) => {
    setLogging(true);
    setError(null);
    try {
      let foodId = food.id;
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
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      await logFoodEntry({ foodId, mealType: meal, quantityG, date: dateStr });
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors du log");
      return false;
    } finally {
      setLogging(false);
    }
  }, [meal]);

  const reset = () => { setScanned(false); setFound(null); setError(null); };

  return { scanned, found, loading, logging, error, handleScan, logFood, reset };
}
