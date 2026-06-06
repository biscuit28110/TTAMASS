import { MuscleGroup } from "@prisma/client";

export type { MuscleGroup };

export interface ExerciseDto {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
}

export interface WorkoutSetDto {
  id: string;
  exerciseId: string;
  exercise: ExerciseDto;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  notes: string | null;
}

export interface WorkoutSessionDto {
  id: string;
  date: string;
  name: string | null;
  notes: string | null;
  duration: number | null;
  sets: WorkoutSetDto[];
}

export interface ExerciseProgressDto {
  date: string;
  maxWeightKg: number;
  totalVolume: number; // sum(reps * weight) sur la séance
  sets: { setNumber: number; reps: number | null; weightKg: number | null }[];
}
