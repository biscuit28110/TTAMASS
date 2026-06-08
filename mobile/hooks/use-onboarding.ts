import { useState } from "react";
import { router } from "expo-router";
import { OnboardingData, TdeePreview, submitProfile } from "@/lib/api/profile";
import { calculateTdeeLocally } from "@/lib/utils/tdee";

export type Step = 1 | 2 | 3;

const DEFAULTS: OnboardingData = {
  birthDate: `${new Date().getFullYear() - 25}-06-15`,
  gender: "MALE",
  heightCm: 175,
  weightKg: 75,
  activityLevel: "MODERATELY_ACTIVE",
  goal: "RECOMPOSITION",
};

export function useOnboarding() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>(DEFAULTS);
  const [tdee, setTdee] = useState<TdeePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (fields: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...fields }));

  const goToStep2 = () => {
    if (!data.birthDate || !data.heightCm || !data.weightKg) {
      setError("Remplis tous les champs");
      return;
    }
    setError(null);
    setStep(2);
  };

  const goToStep3 = () => {
    setError(null);
    // Calcul TDEE en local pour l'affichage (pas besoin d'un aller-retour API)
    const preview = calculateTdeeLocally(data);
    setTdee({
      ...preview,
      targetCalories: data.targetCalories ?? preview.targetCalories,
      targetProteinG: data.targetProteinG ?? preview.targetProteinG,
      targetCarbsG: data.targetCarbsG ?? preview.targetCarbsG,
      targetFatG: data.targetFatG ?? preview.targetFatG,
    });
    setStep(3);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await submitProfile({
        ...data,
        targetCalories: tdee?.targetCalories,
        targetProteinG: tdee?.targetProteinG,
        targetCarbsG: tdee?.targetCarbsG,
        targetFatG: tdee?.targetFatG,
      });
      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return { step, data, tdee, loading, error, update, goToStep2, goToStep3, setStep, setTdee, submit };
}
