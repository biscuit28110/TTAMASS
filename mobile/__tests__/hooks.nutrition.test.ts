import { renderHook, act } from "./utils/render-hook";
import { useNutrition, DailyData } from "@/hooks/use-nutrition";

jest.mock("@/lib/api/client", () => ({
  api: {
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

const { api } = jest.requireMock("@/lib/api/client") as { api: { get: jest.Mock; delete: jest.Mock } };

const makeEntry = (id: string, meal: "LUNCH" | "DINNER", calories: number) => ({
  id,
  mealType: meal,
  quantityG: 100,
  calories,
  proteinG: 10,
  carbsG: 5,
  fatG: 2,
  food: { id: "f1", name: "Test", brand: null, caloriesPer100g: calories },
});

const mockData: DailyData = {
  date: "2026-06-10",
  totals: { calories: 700, proteinG: 50, carbsG: 30, fatG: 15 },
  targets: { calories: 2000, proteinG: 160, carbsG: 200, fatG: 70 },
  byMeal: {
    BREAKFAST: [],
    LUNCH: [makeEntry("e1", "LUNCH", 500)],
    DINNER: [makeEntry("e2", "DINNER", 200)],
    SNACK: [],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue(mockData);
});

describe("useNutrition — load", () => {
  it("charge les données et les stocke", async () => {
    const { result } = renderHook(() => useNutrition());

    await act(async () => { await result.current.load(); });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("erreur réseau : stocke le message et loading=false", async () => {
    api.get.mockRejectedValue(new Error("Timeout"));
    const { result } = renderHook(() => useNutrition());

    await act(async () => { await result.current.load(); });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Timeout");
    expect(result.current.loading).toBe(false);
  });
});

describe("useNutrition — deleteEntry", () => {
  it("retire l'entrée de byMeal optimistiquement", async () => {
    api.delete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useNutrition());

    await act(async () => { await result.current.load(); });
    await act(async () => { await result.current.deleteEntry("e1"); });

    expect(result.current.data?.byMeal.LUNCH).toHaveLength(0);
  });

  it("recalcule les totaux après suppression", async () => {
    api.delete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useNutrition());

    await act(async () => { await result.current.load(); });
    await act(async () => { await result.current.deleteEntry("e1"); });

    // LUNCH (500 kcal) supprimé, reste DINNER (200 kcal)
    expect(result.current.data?.totals.calories).toBe(200);
  });

  it("rollback si l'API échoue", async () => {
    api.delete.mockRejectedValue(new Error("Forbidden"));
    const { result } = renderHook(() => useNutrition());

    await act(async () => { await result.current.load(); });
    await act(async () => { await result.current.deleteEntry("e1"); });

    expect(result.current.data?.byMeal.LUNCH).toHaveLength(1);
    expect(result.current.error).toBe("Forbidden");
  });
});
