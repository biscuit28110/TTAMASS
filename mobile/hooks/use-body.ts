import { useState, useCallback, useRef } from "react";
import { BodyMetric, getMetrics, addMetric } from "@/lib/api/body";

export type Period = "7j" | "30j" | "90j";

const PERIOD_LIMIT: Record<Period, number> = { "7j": 7, "30j": 30, "90j": 90 };

export function useBody() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [period, setPeriod] = useState<Period>("30j");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (p: Period = period) => {
    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const data = await getMetrics(PERIOD_LIMIT[p]);
      setMetrics([...data].reverse());
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [period]);

  const changePeriod = (p: Period) => {
    setPeriod(p);
    load(p);
  };

  const save = useCallback(async (fields: {
    weightKg?: number;
    waistCm?: number;
    chestCm?: number;
    armCm?: number;
    thighCm?: number;
  }) => {
    setSaving(true);
    setError(null);
    try {
      const newMetric = await addMetric({
        date: new Date().toISOString().split("T")[0],
        ...fields,
      });
      setMetrics((prev) => [...prev, newMetric]);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const previous = metrics.length > 1 ? metrics[metrics.length - 2] : null;
  const trend = latest?.weightKg && previous?.weightKg
    ? latest.weightKg - previous.weightKg
    : null;

  const weightData = metrics
    .filter((m) => m.weightKg !== null)
    .map((m) => ({ x: new Date(m.date).getTime(), y: m.weightKg as number, label: m.date }));

  return { metrics, period, loading, saving, error, load, changePeriod, save, latest, trend, weightData };
}
