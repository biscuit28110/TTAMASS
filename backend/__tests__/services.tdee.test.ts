import { describe, it, expect } from "vitest";
import { calculateTdee } from "@/lib/services/tdee";

const baseParams = {
  weightKg: 80,
  heightCm: 180,
  birthDate: new Date("1990-01-01"),
  activityLevel: "MODERATELY_ACTIVE" as const,
  goal: "RECOMPOSITION" as const,
};

describe("calculateTdee", () => {
  it("calcule un BMR cohérent pour un homme", () => {
    const result = calculateTdee({ ...baseParams, gender: "MALE" });
    // Mifflin-St Jeor : 10*80 + 6.25*180 - 5*age + 5 ≈ 1830 pour 35 ans
    expect(result.bmr).toBeGreaterThan(1600);
    expect(result.bmr).toBeLessThan(2200);
  });

  it("BMR femme est inférieur à BMR homme (même paramètres)", () => {
    const male = calculateTdee({ ...baseParams, gender: "MALE" });
    const female = calculateTdee({ ...baseParams, gender: "FEMALE" });
    expect(female.bmr).toBeLessThan(male.bmr);
    // Différence Mifflin : 161 + 5 = 166 calories
    expect(male.bmr - female.bmr).toBeCloseTo(166, 0);
  });

  it("TDEE > BMR (multiplicateur d'activité)", () => {
    const result = calculateTdee({ ...baseParams, gender: "MALE" });
    expect(result.tdee).toBeGreaterThan(result.bmr);
  });

  it("targetCalories ajusté selon l'objectif RECOMPOSITION (-200)", () => {
    const result = calculateTdee({ ...baseParams, gender: "MALE" });
    expect(result.targetCalories).toBe(result.tdee - 200);
  });

  it("targetCalories ajusté selon l'objectif CUT (-500)", () => {
    const result = calculateTdee({ ...baseParams, gender: "MALE", goal: "CUT" });
    expect(result.targetCalories).toBe(result.tdee - 500);
  });

  it("targetCalories minimum de 1200 même avec un déficit important", () => {
    const result = calculateTdee({
      ...baseParams,
      weightKg: 40,
      heightCm: 150,
      gender: "FEMALE",
      goal: "CUT",
    });
    expect(result.targetCalories).toBeGreaterThanOrEqual(1200);
  });

  it("targetProteinG = 2g par kg de poids corporel", () => {
    const result = calculateTdee({ ...baseParams, gender: "MALE" });
    expect(result.targetProteinG).toBe(160); // 80 * 2
  });

  it("targetCarbsG minimum de 50g", () => {
    const result = calculateTdee({
      ...baseParams,
      weightKg: 40,
      heightCm: 150,
      gender: "FEMALE",
      goal: "CUT",
    });
    expect(result.targetCarbsG).toBeGreaterThanOrEqual(50);
  });
});
