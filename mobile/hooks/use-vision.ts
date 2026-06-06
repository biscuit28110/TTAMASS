import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/client";
import { MealType } from "@/hooks/use-nutrition";

export interface DetectedFood {
  name: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: "high" | "medium" | "low";
}

export interface VisionResult {
  foods: DetectedFood[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  description: string;
  mealType: MealType;
}

async function analyzeAsset(
  asset: ImagePicker.ImagePickerAsset,
  meal: MealType
): Promise<VisionResult> {
  if (!asset.base64) throw new Error("Image sans données base64");
  const mediaType = asset.mimeType?.startsWith("image/png")
    ? "image/png"
    : asset.mimeType?.startsWith("image/webp")
    ? "image/webp"
    : "image/jpeg";

  return api.post<VisionResult>("/api/ai/vision", {
    image: asset.base64,
    mediaType,
    mealType: meal,
  });
}

export function useVision(meal: MealType) {
  const [analyzing, setAnalyzing] = useState(false);
  const [logging, setLogging] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickFromGallery = useCallback(async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Permission d'accès à la galerie refusée");
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (picked.canceled || !picked.assets[0]) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalyzing(true);
    try {
      const res = await analyzeAsset(picked.assets[0], meal);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur d'analyse");
    } finally {
      setAnalyzing(false);
    }
  }, [meal]);

  const takePhoto = useCallback(async () => {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Permission caméra refusée");
      return;
    }

    const taken = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (taken.canceled || !taken.assets[0]) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalyzing(true);
    try {
      const res = await analyzeAsset(taken.assets[0], meal);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur d'analyse");
    } finally {
      setAnalyzing(false);
    }
  }, [meal]);

  const logAll = useCallback(async (): Promise<boolean> => {
    if (!result) return false;
    setLogging(true);
    setError(null);

    try {
      const date = new Date().toISOString().split("T")[0];

      for (const food of result.foods) {
        const ratio = food.quantityG > 0 ? 100 / food.quantityG : 1;

        const cached = await api.post<{ id: string }>("/api/nutrition/foods", {
          name: food.name,
          brand: null,
          barcode: null,
          caloriesPer100g: Math.round(food.calories * ratio),
          proteinPer100g: Math.round(food.proteinG * ratio * 10) / 10,
          carbsPer100g: Math.round(food.carbsG * ratio * 10) / 10,
          fatPer100g: Math.round(food.fatG * ratio * 10) / 10,
          source: "AI_DETECTED",
        });

        await api.post("/api/nutrition/food-entries", {
          foodId: cached.id,
          mealType: result.mealType,
          quantityG: food.quantityG,
          date,
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
      return false;
    } finally {
      setLogging(false);
    }
  }, [result]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { analyzing, logging, result, error, pickFromGallery, takePhoto, logAll, reset };
}
