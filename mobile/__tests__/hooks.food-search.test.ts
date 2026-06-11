import { renderHook, act } from "./utils/render-hook";
import { useFoodSearch } from "@/hooks/use-food-search";

jest.mock("@/lib/api/foods", () => ({
  searchLocalFoods: jest.fn(),
  logFoodEntry: jest.fn(),
}));

const { searchLocalFoods, logFoodEntry } = jest.requireMock("@/lib/api/foods") as {
  searchLocalFoods: jest.Mock;
  logFoodEntry: jest.Mock;
};

const mockFood = {
  id: "food-1",
  name: "Poulet grillé",
  brand: null,
  barcode: null,
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
  source: "custom",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useFoodSearch — search", () => {
  it("query < 2 chars : ne déclenche pas l'API et garde results vide", async () => {
    const { result } = renderHook(() => useFoodSearch("LUNCH"));

    await act(async () => { result.current.search("p"); });
    await act(async () => { jest.runAllTimers(); });

    expect(searchLocalFoods).not.toHaveBeenCalled();
    expect(result.current.results).toHaveLength(0);
  });

  it("query vide : efface les résultats", async () => {
    searchLocalFoods.mockResolvedValue([mockFood]);
    const { result } = renderHook(() => useFoodSearch("LUNCH"));

    await act(async () => {
      result.current.search("po");
      jest.runAllTimers();
    });

    await act(async () => { result.current.search(""); });

    expect(result.current.results).toHaveLength(0);
  });

  it("query >= 2 chars : appelle l'API après debounce et met à jour results", async () => {
    searchLocalFoods.mockResolvedValue([mockFood]);
    const { result } = renderHook(() => useFoodSearch("LUNCH"));

    await act(async () => {
      result.current.search("poulet");
      jest.runAllTimers();
    });

    expect(searchLocalFoods).toHaveBeenCalledWith("poulet");
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].name).toBe("Poulet grillé");
  });

  it("erreur API : stocke le message dans error", async () => {
    searchLocalFoods.mockRejectedValue(new Error("Réseau indisponible"));
    const { result } = renderHook(() => useFoodSearch("LUNCH"));

    await act(async () => {
      result.current.search("poulet");
      jest.runAllTimers();
    });

    expect(result.current.error).toBe("Réseau indisponible");
    expect(result.current.results).toHaveLength(0);
  });
});

describe("useFoodSearch — logFood", () => {
  it("succès : retourne true", async () => {
    logFoodEntry.mockResolvedValue({});
    const { result } = renderHook(() => useFoodSearch("BREAKFAST"));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.logFood(mockFood, 150);
    });

    expect(ok).toBe(true);
    expect(logFoodEntry).toHaveBeenCalledWith(
      expect.objectContaining({ foodId: "food-1", mealType: "BREAKFAST", quantityG: 150 })
    );
  });

  it("échec API : retourne false et stocke l'erreur", async () => {
    logFoodEntry.mockRejectedValue(new Error("Quota dépassé"));
    const { result } = renderHook(() => useFoodSearch("DINNER"));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.logFood(mockFood, 200);
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("Quota dépassé");
  });
});
