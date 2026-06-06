import { api } from "@/lib/api/client";

export interface BodyMetric {
  id: string;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  bmi: number | null;
}

export async function getMetrics(limit = 90): Promise<BodyMetric[]> {
  return api.get<BodyMetric[]>(`/api/body/metrics?limit=${limit}`);
}

export async function addMetric(data: {
  date: string;
  weightKg?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
}): Promise<BodyMetric> {
  return api.post<BodyMetric>("/api/body/metrics", data);
}
