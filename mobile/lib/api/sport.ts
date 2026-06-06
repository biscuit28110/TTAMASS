import { api } from "@/lib/api/client";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  isCustom: boolean;
}

export interface WorkoutSet {
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string | null;
  duration: number | null;
  notes: string | null;
  workoutSets: (WorkoutSet & { exercise: Exercise })[];
}

export interface ExerciseProgress {
  date: string;
  maxWeightKg: number;
  totalVolume: number;
  sets: { setNumber: number; reps: number | null; weightKg: number | null }[];
}

export const sportApi = {
  getSessions: (limit = 20) => api.get<WorkoutSession[]>(`/api/sport/sessions?limit=${limit}`),
  getSession: (id: string) => api.get<WorkoutSession>(`/api/sport/sessions/${id}`),
  deleteSession: (id: string) => api.delete(`/api/sport/sessions/${id}`),
  createSession: (data: { date: string; name?: string; notes?: string; duration?: number; sets: WorkoutSet[] }) =>
    api.post<WorkoutSession>("/api/sport/sessions", data),
  getExercises: (muscleGroup?: string) =>
    api.get<Exercise[]>(`/api/sport/exercises${muscleGroup ? `?muscleGroup=${muscleGroup}` : ""}`),
  getProgress: (exerciseId: string) =>
    api.get<{ exercise: Exercise; progress: ExerciseProgress[] }>(`/api/sport/exercises/${exerciseId}/history`),
};
