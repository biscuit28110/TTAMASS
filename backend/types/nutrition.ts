import { MealType, FoodSource } from "@prisma/client";

export type { MealType, FoodSource };

export interface FoodDto {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  source: FoodSource;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
}

export interface FoodEntryDto {
  id: string;
  date: string;
  mealType: MealType;
  food: FoodDto;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DayHistoryDto {
  date: string;
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  targets: {
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  };
  entryCount: number;
}

export interface DailySummaryDto {
  date: string;
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  targets: {
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  };
  byMeal: Record<MealType, FoodEntryDto[]>;
}
