import { ActivityLevel, Goal } from "@prisma/client";
import { TdeeResult } from "@/types/auth";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
};

const CALORIE_ADJUSTMENT: Record<Goal, number> = {
  RECOMPOSITION: -200,
  CUT: -500,
  BULK: +300,
  MAINTENANCE: 0,
};

export function calculateTdee(params: {
  weightKg: number;
  heightCm: number;
  birthDate: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  activityLevel: ActivityLevel;
  goal: Goal;
}): TdeeResult {
  const { weightKg, heightCm, birthDate, gender, activityLevel, goal } = params;

  const age = Math.floor(
    (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  // Formule Mifflin-St Jeor
  const bmr =
    gender === "FEMALE"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIER[activityLevel]);
  const targetCalories = Math.max(1200, tdee + CALORIE_ADJUSTMENT[goal]);

  // Répartition macros pour recomposition : 2g/kg protéines minimum
  const targetProteinG = Math.round(weightKg * 2);
  const proteinCalories = targetProteinG * 4;
  const fatCalories = Math.round(targetCalories * 0.25);
  const targetFatG = Math.round(fatCalories / 9);
  const targetCarbsG = Math.round((targetCalories - proteinCalories - fatCalories) / 4);

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories: Math.round(targetCalories),
    targetProteinG,
    targetCarbsG: Math.max(50, targetCarbsG),
    targetFatG,
  };
}
