import { BodyPhotoType } from "@prisma/client";

export type { BodyPhotoType };

export interface BodyMetricDto {
  id: string;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  bmi: number | null;
}

export interface BodyPhotoDto {
  id: string;
  date: string;
  url: string;
  type: BodyPhotoType;
  notes: string | null;
}
