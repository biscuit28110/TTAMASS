import { api } from "@/lib/api/client";

export interface DailySummary {
  date: string;
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
  targets: { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null };
}

export type ActivityLevel = "SEDENTARY" | "LIGHTLY_ACTIVE" | "MODERATELY_ACTIVE" | "VERY_ACTIVE" | "EXTRA_ACTIVE";
export type Goal = "RECOMPOSITION" | "BULK" | "CUT" | "MAINTENANCE";

export interface UserProfile {
  currentStreak: number;
  longestStreak: number;
  targetCalories: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatG: number | null;
  plan: "FREE" | "PREMIUM";
  weightKg: number | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
}

export interface BodyMetric {
  id: string;
  date: string;
  weightKg: number | null;
}

export const nutritionApi = {
  getDaily: (date: string) => api.get<DailySummary>(`/api/nutrition/daily?date=${date}`),
};

export const profileApi = {
  get: () => api.get<UserProfile>("/api/auth/profile"),
};

export const bodyApi = {
  getMetrics: (limit = 2) => api.get<BodyMetric[]>(`/api/body/metrics?limit=${limit}`),
};
