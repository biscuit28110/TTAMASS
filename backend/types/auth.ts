import { ActivityLevel, Goal } from "@prisma/client";

export type { ActivityLevel, Goal };

export interface UserProfileDto {
  id: string;
  userId: string;
  birthDate: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel;
  goal: Goal;
  targetCalories: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatG: number | null;
  manualOverride: boolean;
  plan: string;
  currentStreak: number;
  longestStreak: number;
}

export interface TdeeResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
}
