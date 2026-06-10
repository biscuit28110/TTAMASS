import { calculateTdeeLocally } from "../lib/utils/tdee";

const baseData = {
  weightKg: 80,
  heightCm: 180,
  birthDate: "1990-01-01",
  activityLevel: "MODERATELY_ACTIVE" as const,
  goal: "RECOMPOSITION" as const,
};

describe("calculateTdeeLocally", () => {
  it("retourne un BMR cohérent pour un homme", () => {
    const result = calculateTdeeLocally({ ...baseData, gender: "MALE" });
    expect(result.bmr).toBeGreaterThan(1600);
    expect(result.bmr).toBeLessThan(2200);
  });

  it("BMR femme inférieur à BMR homme", () => {
    const male = calculateTdeeLocally({ ...baseData, gender: "MALE" });
    const female = calculateTdeeLocally({ ...baseData, gender: "FEMALE" });
    expect(female.bmr).toBeLessThan(male.bmr);
  });

  it("targetCalories = TDEE - 200 pour RECOMPOSITION", () => {
    const result = calculateTdeeLocally({ ...baseData, gender: "MALE" });
    expect(result.targetCalories).toBe(result.tdee - 200);
  });

  it("targetCalories minimum 1200", () => {
    const result = calculateTdeeLocally({
      ...baseData,
      weightKg: 40,
      heightCm: 150,
      gender: "FEMALE",
      goal: "CUT",
    });
    expect(result.targetCalories).toBeGreaterThanOrEqual(1200);
  });

  it("targetProteinG = 2g par kg", () => {
    const result = calculateTdeeLocally({ ...baseData, gender: "MALE" });
    expect(result.targetProteinG).toBe(160);
  });

  it("résultat cohérent sans birthDate (défaut age 25)", () => {
    const result = calculateTdeeLocally({ ...baseData, gender: "MALE", birthDate: undefined as unknown as string });
    expect(result.bmr).toBeGreaterThan(0);
    expect(result.tdee).toBeGreaterThan(0);
  });
});
