import { describe, it, expect } from "vitest";
import { calculateMacros } from "@/lib/services/nutrition";

describe("calculateMacros", () => {
  const food = {
    caloriesPer100g: 200,
    proteinPer100g: 10,
    carbsPer100g: 30,
    fatPer100g: 5,
  };

  it("calcule les macros pour 100g", () => {
    const result = calculateMacros(food, 100);
    expect(result.calories).toBe(200);
    expect(result.proteinG).toBe(10);
    expect(result.carbsG).toBe(30);
    expect(result.fatG).toBe(5);
  });

  it("calcule les macros pour 200g", () => {
    const result = calculateMacros(food, 200);
    expect(result.calories).toBe(400);
    expect(result.proteinG).toBe(20);
  });

  it("calcule les macros pour une quantité partielle", () => {
    const result = calculateMacros(food, 50);
    expect(result.calories).toBe(100);
    expect(result.carbsG).toBe(15);
  });

  it("arrondit à 1 décimale", () => {
    const foodOdd = { caloriesPer100g: 100, proteinPer100g: 33, carbsPer100g: 0, fatPer100g: 0 };
    const result = calculateMacros(foodOdd, 33);
    expect(result.proteinG).toBe(10.9);
  });

  it("retourne 0 pour quantité nulle", () => {
    const result = calculateMacros(food, 0);
    expect(result.calories).toBe(0);
    expect(result.proteinG).toBe(0);
  });
});
