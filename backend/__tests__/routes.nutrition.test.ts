import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-user", () => ({ getUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    food: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    foodEntry: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}));

import { getUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { GET as getFoods, POST as postFood } from "@/app/api/nutrition/foods/route";
import { GET as getFoodEntries, POST as postFoodEntry } from "@/app/api/nutrition/food-entries/route";

const mockUser = { id: "user-1", email: "test@ttamass.fr" };
const mockFood = {
  id: "food-1",
  name: "Poulet",
  brand: null,
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
  fiberPer100g: null,
};

function makeReq(url: string, options: { method?: string; body?: unknown } = {}) {
  const req = new NextRequest(`http://localhost${url}`, {
    method: options.method ?? "GET",
    headers: { Authorization: "Bearer test-token", "Content-Type": "application/json" },
  });
  if (options.body !== undefined) {
    (req as unknown as { json: () => Promise<unknown> }).json = () => Promise.resolve(options.body);
  }
  return req;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUser).mockResolvedValue(mockUser as never);
  // Empêche les appels réels à Open Food Facts
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ products: [] }),
  }));
});

describe("GET /api/nutrition/foods", () => {
  it("401 sans token", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    const res = await getFoods(makeReq("/api/nutrition/foods?q=poulet"));
    expect(res.status).toBe(401);
  });

  it("400 si ni q ni barcode", async () => {
    const res = await getFoods(makeReq("/api/nutrition/foods"));
    expect(res.status).toBe(400);
  });

  it("200 avec résultats locaux", async () => {
    vi.mocked(prisma.food.findMany).mockResolvedValue([mockFood] as never);
    const res = await getFoods(makeReq("/api/nutrition/foods?q=poulet"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("POST /api/nutrition/food-entries", () => {
  it("401 sans token", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    const res = await postFoodEntry(makeReq("/api/nutrition/food-entries", { method: "POST", body: {} }));
    expect(res.status).toBe(401);
  });

  it("400 si body invalide (foodId pas UUID)", async () => {
    const res = await postFoodEntry(makeReq("/api/nutrition/food-entries", {
      method: "POST",
      body: { foodId: "not-a-uuid", mealType: "LUNCH", quantityG: 150, date: "2026-06-10" },
    }));
    expect(res.status).toBe(400);
  });

  it("400 si quantité négative", async () => {
    const res = await postFoodEntry(makeReq("/api/nutrition/food-entries", {
      method: "POST",
      body: { foodId: "550e8400-e29b-41d4-a716-446655440001", mealType: "LUNCH", quantityG: -1, date: "2026-06-10" },
    }));
    expect(res.status).toBe(400);
  });

  it("404 si aliment introuvable", async () => {
    vi.mocked(prisma.food.findUnique).mockResolvedValue(null as never);
    const res = await postFoodEntry(makeReq("/api/nutrition/food-entries", {
      method: "POST",
      body: { foodId: "550e8400-e29b-41d4-a716-446655440001", mealType: "LUNCH", quantityG: 150, date: "2026-06-10" },
    }));
    expect(res.status).toBe(404);
  });

  it("201 et retourne l'entrée créée avec macros calculées", async () => {
    vi.mocked(prisma.food.findUnique).mockResolvedValue(mockFood as never);
    const created = {
      id: "entry-1",
      quantityG: 150,
      calories: 247.5,
      proteinG: 46.5,
      carbsG: 0,
      fatG: 5.4,
      food: mockFood,
    };
    vi.mocked(prisma.foodEntry.create).mockResolvedValue(created as never);

    const res = await postFoodEntry(makeReq("/api/nutrition/food-entries", {
      method: "POST",
      body: { foodId: "550e8400-e29b-41d4-a716-446655440001", mealType: "LUNCH", quantityG: 150, date: "2026-06-10" },
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("entry-1");
  });
});
