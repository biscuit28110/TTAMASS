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

// Structure retournée par l'API search (/cgi/search.pl) — différente du lookup par barcode
interface OFFSearchProduct {
  code: string;
  product_name: string;
  brands: string;
  nutriments: {
    "energy-kcal_100g": number;
    proteins_100g: number;
    carbohydrates_100g: number;
    fat_100g: number;
    fiber_100g?: number;
  };
}

// Recherche dans notre cache PostgreSQL
export async function searchLocalFoods(query: string): Promise<Food[]> {
  return api.get<Food[]>(`/api/nutrition/foods?q=${encodeURIComponent(query)}`);
}

// Recherche directe Open Food Facts (fallback)
export async function searchOpenFoodFacts(query: string): Promise<Food[]> {
  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=code,product_name,brands,nutriments`
  );
  const data = await res.json();
  return (data.products ?? [])
    .filter((p: OFFSearchProduct) => p.product_name && p.nutriments?.["energy-kcal_100g"])
    .map((p: OFFSearchProduct) => ({
      id: "",
      name: p.product_name,
      brand: p.brands || null,
      barcode: p.code,
      caloriesPer100g: p.nutriments["energy-kcal_100g"] ?? 0,
      proteinPer100g: p.nutriments.proteins_100g ?? 0,
      carbsPer100g: p.nutriments.carbohydrates_100g ?? 0,
      fatPer100g: p.nutriments.fat_100g ?? 0,
      source: "OPEN_FOOD_FACTS",
    }));
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
