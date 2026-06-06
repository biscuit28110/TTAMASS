import { api } from "@/lib/api/client";

export interface OnboardingData {
  birthDate: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  heightCm: number;
  weightKg: number;
  activityLevel: "SEDENTARY" | "LIGHTLY_ACTIVE" | "MODERATELY_ACTIVE" | "VERY_ACTIVE" | "EXTRA_ACTIVE";
  goal: "RECOMPOSITION" | "BULK" | "CUT" | "MAINTENANCE";
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
}

export interface TdeePreview {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
}

export async function previewTdee(data: Omit<OnboardingData, "targetCalories" | "targetProteinG" | "targetCarbsG" | "targetFatG">): Promise<TdeePreview> {
  return api.post<TdeePreview>("/api/auth/profile/tdee-preview", data);
}

export async function submitProfile(data: OnboardingData) {
  return api.post("/api/auth/profile", data);
}
