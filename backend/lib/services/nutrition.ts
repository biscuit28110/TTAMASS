import { MealType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DailySummaryDto, DayHistoryDto, FoodEntryDto } from "@/types/nutrition";

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

export async function getHistorySummary(
  userId: string,
  days: number
): Promise<DayHistoryDto[]> {
  const now = new Date();
  const rangeEnd = new Date(now);
  rangeEnd.setHours(23, 59, 59, 999);
  const rangeStart = new Date(now);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  rangeStart.setHours(0, 0, 0, 0);

  const [entries, profile] = await Promise.all([
    prisma.foodEntry.findMany({
      where: { userId, date: { gte: rangeStart, lte: rangeEnd } },
      select: { date: true, calories: true, proteinG: true, carbsG: true, fatG: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { targetCalories: true, targetProteinG: true, targetCarbsG: true, targetFatG: true },
    }),
  ]);

  const byDate = new Map<string, { calories: number; proteinG: number; carbsG: number; fatG: number; count: number }>();
  for (const entry of entries) {
    const dateStr = entry.date.toISOString().split("T")[0];
    const existing = byDate.get(dateStr) ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, count: 0 };
    byDate.set(dateStr, {
      calories: existing.calories + entry.calories,
      proteinG: existing.proteinG + entry.proteinG,
      carbsG: existing.carbsG + entry.carbsG,
      fatG: existing.fatG + entry.fatG,
      count: existing.count + 1,
    });
  }

  const targets = {
    calories: profile?.targetCalories ?? null,
    proteinG: profile?.targetProteinG ?? null,
    carbsG: profile?.targetCarbsG ?? null,
    fatG: profile?.targetFatG ?? null,
  };

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const day = byDate.get(dateStr);
    return {
      date: dateStr,
      totals: day
        ? { calories: day.calories, proteinG: day.proteinG, carbsG: day.carbsG, fatG: day.fatG }
        : { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      targets,
      entryCount: day?.count ?? 0,
    };
  });
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
