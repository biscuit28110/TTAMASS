import { renderHook, act } from "./utils/render-hook";
import { useBody } from "@/hooks/use-body";

jest.mock("@/lib/api/body", () => ({
  getMetrics: jest.fn(),
  addMetric: jest.fn(),
}));

const { getMetrics, addMetric } = jest.requireMock("@/lib/api/body") as {
  getMetrics: jest.Mock;
  addMetric: jest.Mock;
};

const makeMetric = (date: string, weightKg: number | null = null) => ({
  id: date,
  date,
  weightKg,
  bmi: null,
  waistCm: null,
  chestCm: null,
  armCm: null,
  thighCm: null,
});

beforeEach(() => jest.clearAllMocks());

describe("useBody — load", () => {
  it("charge et inverse les métriques (plus récente en dernier)", async () => {
    const metrics = [makeMetric("2026-06-10", 80), makeMetric("2026-06-09", 79)];
    getMetrics.mockResolvedValue(metrics);
    const { result } = renderHook(() => useBody());

    await act(async () => { await result.current.load(); });

    // reverse() : 2026-06-09 en premier, 2026-06-10 en dernier
    expect(result.current.metrics[0].date).toBe("2026-06-09");
    expect(result.current.metrics[1].date).toBe("2026-06-10");
    expect(result.current.loading).toBe(false);
  });

  it("erreur API : stocke le message", async () => {
    getMetrics.mockRejectedValue(new Error("DB error"));
    const { result } = renderHook(() => useBody());

    await act(async () => { await result.current.load(); });

    expect(result.current.error).toBe("DB error");
    expect(result.current.metrics).toHaveLength(0);
  });
});

describe("useBody — trend & weightData", () => {
  it("trend = différence entre les deux derniers poids", async () => {
    getMetrics.mockResolvedValue([
      makeMetric("2026-06-08", 80),
      makeMetric("2026-06-09", 79.5),
    ]);
    const { result } = renderHook(() => useBody());

    await act(async () => { await result.current.load(); });

    // API retourne [2026-06-08=80, 2026-06-09=79.5], reverse() → [79.5, 80]
    // latest = 80, previous = 79.5 → trend = +0.5 (prise de poids)
    expect(result.current.trend).toBeCloseTo(0.5);
  });

  it("trend = null si moins de 2 métriques avec poids", async () => {
    getMetrics.mockResolvedValue([makeMetric("2026-06-10", 80)]);
    const { result } = renderHook(() => useBody());

    await act(async () => { await result.current.load(); });

    expect(result.current.trend).toBeNull();
  });

  it("weightData filtre les métriques sans poids", async () => {
    getMetrics.mockResolvedValue([
      makeMetric("2026-06-08", null),
      makeMetric("2026-06-09", 79),
    ]);
    const { result } = renderHook(() => useBody());

    await act(async () => { await result.current.load(); });

    expect(result.current.weightData).toHaveLength(1);
    expect(result.current.weightData[0].y).toBe(79);
  });
});

describe("useBody — save", () => {
  it("succès : ajoute la métrique à la liste et retourne true", async () => {
    getMetrics.mockResolvedValue([]);
    const newMetric = makeMetric("2026-06-10", 78);
    addMetric.mockResolvedValue(newMetric);
    const { result } = renderHook(() => useBody());

    await act(async () => { await result.current.load(); });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.save({ weightKg: 78 });
    });

    expect(ok).toBe(true);
    expect(result.current.metrics).toHaveLength(1);
    expect(result.current.metrics[0].weightKg).toBe(78);
  });

  it("échec API : retourne false et stocke l'erreur", async () => {
    getMetrics.mockResolvedValue([]);
    addMetric.mockRejectedValue(new Error("Quota dépassé"));
    const { result } = renderHook(() => useBody());

    await act(async () => { await result.current.load(); });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.save({ weightKg: 78 });
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("Quota dépassé");
  });
});
