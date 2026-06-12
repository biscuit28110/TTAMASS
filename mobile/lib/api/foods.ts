import { api } from "@/lib/api/client";
import { MealType } from "@/hooks/use-nutrition";

export interface Food {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  source: string;
  unit: "G" | "ML";
  defaultQuantity: number;
}

export interface OFFProduct {
  code: string;
  product: {
    product_name: string;
    brands: string;
    nutriments: {
      "energy-kcal_100g": number;
      proteins_100g: number;
      carbohydrates_100g: number;
      fat_100g: number;
      fiber_100g?: number;
    };
  };
}

// Recherche unifiée : le backend gère local + Open Food Facts
export async function searchLocalFoods(query: string): Promise<Food[]> {
  return api.get<Food[]>(`/api/nutrition/foods?q=${encodeURIComponent(query)}`);
}

// Cache un aliment OFF dans notre DB et retourne l'id
export async function cacheFood(food: Omit<Food, "id" | "source">): Promise<Food> {
  return api.post<Food>("/api/nutrition/foods", food);
}

// Log une entrée alimentaire
export async function logFoodEntry(params: {
  foodId: string;
  mealType: MealType;
  quantityG: number;
  date: string;
}) {
  return api.post("/api/nutrition/food-entries", params);
}
