import { useState, useCallback } from "react";
import { sportApi, WorkoutSession, Exercise, WorkoutSet } from "@/lib/api/sport";

export function useSport() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sportApi.getSessions();
      setSessions(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await sportApi.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sessions, loading, error, load, deleteSession };
}

// ─── Hook log séance ───

interface SetEntry { exerciseId: string; exerciseName: string; sets: { reps: string; weightKg: string }[] }

export function useLogWorkout() {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [entries, setEntries] = useState<SetEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    const data = await sportApi.getExercises();
    setExercises(data);
  }, []);

  const addExercise = (ex: Exercise) => {
    if (entries.find((e) => e.exerciseId === ex.id)) return;
    setEntries((prev) => [...prev, { exerciseId: ex.id, exerciseName: ex.name, sets: [{ reps: "", weightKg: "" }] }]);
  };

  const addSet = (exerciseId: string) => {
    setEntries((prev) => prev.map((e) =>
      e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, { reps: "", weightKg: "" }] } : e
    ));
  };

  const updateSet = (exerciseId: string, setIndex: number, field: "reps" | "weightKg", value: string) => {
    setEntries((prev) => prev.map((e) =>
      e.exerciseId === exerciseId
        ? { ...e, sets: e.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s) }
        : e
    ));
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setEntries((prev) => prev.map((e) =>
      e.exerciseId === exerciseId
        ? { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
        : e
    ).filter((e) => e.sets.length > 0));
  };

  const removeExercise = (exerciseId: string) => {
    setEntries((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  };

  const save = useCallback(async (): Promise<WorkoutSession | null> => {
    if (entries.length === 0) { setError("Ajoute au moins un exercice"); return null; }
    setSaving(true);
    setError(null);
    try {
      const sets: WorkoutSet[] = entries.flatMap((e) =>
        e.sets.map((s, i) => ({
          exerciseId: e.exerciseId,
          setNumber: i + 1,
          reps: s.reps ? parseInt(s.reps) : undefined,
          weightKg: s.weightKg ? parseFloat(s.weightKg) : undefined,
        }))
      );
      return await sportApi.createSession({
        date: new Date().toISOString().split("T")[0],
        name: name || undefined,
        duration: duration ? parseInt(duration) : undefined,
        sets,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
      return null;
    } finally {
      setSaving(false);
    }
  }, [entries, name, duration]);

  return { name, setName, duration, setDuration, exercises, entries, saving, error, loadExercises, addExercise, addSet, updateSet, removeSet, removeExercise, save };
}
