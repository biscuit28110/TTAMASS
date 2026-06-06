import { OnboardingData, TdeePreview } from "@/lib/api/profile";

const ACTIVITY: Record<OnboardingData["activityLevel"], number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
};

const GOAL_DELTA: Record<OnboardingData["goal"], number> = {
  RECOMPOSITION: -200,
  CUT: -500,
  BULK: 300,
  MAINTENANCE: 0,
};

export function calculateTdeeLocally(data: OnboardingData): TdeePreview {
  const age = data.birthDate
    ? Math.floor((Date.now() - new Date(data.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : 25;

  const bmr =
    data.gender === "FEMALE"
      ? 10 * data.weightKg + 6.25 * data.heightCm - 5 * age - 161
      : 10 * data.weightKg + 6.25 * data.heightCm - 5 * age + 5;

  const tdee = Math.round(bmr * ACTIVITY[data.activityLevel]);
  const targetCalories = Math.max(1200, tdee + GOAL_DELTA[data.goal]);
  const targetProteinG = Math.round(data.weightKg * 2);
  const fatCalories = Math.round(targetCalories * 0.25);
  const targetFatG = Math.round(fatCalories / 9);
  const targetCarbsG = Math.max(50, Math.round((targetCalories - targetProteinG * 4 - fatCalories) / 4));

  return { bmr: Math.round(bmr), tdee, targetCalories: Math.round(targetCalories), targetProteinG, targetCarbsG, targetFatG };
}
