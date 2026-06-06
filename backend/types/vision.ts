export type VisionMealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface DetectedFood {
  name: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: "high" | "medium" | "low";
}

export interface VisionAnalysisResult {
  foods: DetectedFood[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  description: string;
  inputTokens: number;
  outputTokens: number;
}

export interface VisionAnalysisRequest {
  image: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  mealType: VisionMealType;
}
