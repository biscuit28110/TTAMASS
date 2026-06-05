import { MealType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DailySummaryDto, FoodEntryDto } from "@/types/nutrition";

export async function getDailySummary(
  userId: string,
  date: Date
): Promise<DailySummaryDto> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [entries, profile] = await Promise.all([
    prisma.foodEntry.findMany({
      where: { userId, date: { gte: dayStart, lte: dayEnd } },
      include: { food: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: {
        targetCalories: true,
        targetProteinG: true,
        targetCarbsG: true,
        targetFatG: true,
      },
    }),
  ]);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const byMeal = Object.values(MealType).reduce(
    (acc, meal) => {
      acc[meal] = entries
        .filter((e) => e.mealType === meal)
        .map(toEntryDto);
      return acc;
    },
    {} as Record<MealType, FoodEntryDto[]>
  );

  return {
    date: dayStart.toISOString().split("T")[0],
    totals,
    targets: {
      calories: profile?.targetCalories ?? null,
      proteinG: profile?.targetProteinG ?? null,
      carbsG: profile?.targetCarbsG ?? null,
      fatG: profile?.targetFatG ?? null,
    },
    byMeal,
  };
}

export function calculateMacros(
  food: { caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number },
  quantityG: number
) {
  const ratio = quantityG / 100;
  return {
    calories: Math.round(food.caloriesPer100g * ratio * 10) / 10,
    proteinG: Math.round(food.proteinPer100g * ratio * 10) / 10,
    carbsG: Math.round(food.carbsPer100g * ratio * 10) / 10,
    fatG: Math.round(food.fatPer100g * ratio * 10) / 10,
  };
}

function toEntryDto(e: {
  id: string;
  date: Date;
  mealType: MealType;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  food: {
    id: string;
    name: string;
    brand: string | null;
    barcode: string | null;
    source: import("@prisma/client").FoodSource;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    fiberPer100g: number | null;
  };
}): FoodEntryDto {
  return {
    id: e.id,
    date: e.date.toISOString().split("T")[0],
    mealType: e.mealType,
    quantityG: e.quantityG,
    calories: e.calories,
    proteinG: e.proteinG,
    carbsG: e.carbsG,
    fatG: e.fatG,
    food: {
      id: e.food.id,
      name: e.food.name,
      brand: e.food.brand,
      barcode: e.food.barcode,
      source: e.food.source,
      caloriesPer100g: e.food.caloriesPer100g,
      proteinPer100g: e.food.proteinPer100g,
      carbsPer100g: e.food.carbsPer100g,
      fatPer100g: e.food.fatPer100g,
      fiberPer100g: e.food.fiberPer100g,
    },
  };
}
