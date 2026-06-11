import { renderHook, act } from "./utils/render-hook";
import { useSport, useLogWorkout } from "@/hooks/use-sport";

jest.mock("@/lib/api/sport", () => ({
  sportApi: {
    getSessions: jest.fn(),
    deleteSession: jest.fn(),
    getExercises: jest.fn(),
    createSession: jest.fn(),
  },
}));

const { sportApi } = jest.requireMock("@/lib/api/sport") as {
  sportApi: {
    getSessions: jest.Mock;
    deleteSession: jest.Mock;
    getExercises: jest.Mock;
    createSession: jest.Mock;
  };
};

const makeSession = (id: string) => ({ id, date: "2026-06-10", name: "Test", workoutSets: [] });
const makeExercise = (id: string, name: string) => ({ id, name, category: "STRENGTH", muscleGroup: "CHEST" });

beforeEach(() => jest.clearAllMocks());

describe("useSport — load & delete", () => {
  it("charge les séances", async () => {
    sportApi.getSessions.mockResolvedValue([makeSession("s1"), makeSession("s2")]);
    const { result } = renderHook(() => useSport());

    await act(async () => { await result.current.load(); });

    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });

  it("erreur de chargement : stocke le message", async () => {
    sportApi.getSessions.mockRejectedValue(new Error("Réseau"));
    const { result } = renderHook(() => useSport());

    await act(async () => { await result.current.load(); });

    expect(result.current.error).toBe("Réseau");
  });

  it("deleteSession retire la séance de la liste", async () => {
    sportApi.getSessions.mockResolvedValue([makeSession("s1"), makeSession("s2")]);
    sportApi.deleteSession.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSport());

    await act(async () => { await result.current.load(); });
    await act(async () => { await result.current.deleteSession("s1"); });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].id).toBe("s2");
  });
});

describe("useLogWorkout — gestion des exercices", () => {
  it("addExercise ajoute un exercice avec un set vide", async () => {
    const { result } = renderHook(() => useLogWorkout());
    const ex = makeExercise("e1", "Développé couché");

    act(() => { result.current.addExercise(ex); });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].sets).toHaveLength(1);
  });

  it("addExercise ignoré si exercice déjà présent", async () => {
    const { result } = renderHook(() => useLogWorkout());
    const ex = makeExercise("e1", "Squat");

    act(() => { result.current.addExercise(ex); });
    act(() => { result.current.addExercise(ex); });

    expect(result.current.entries).toHaveLength(1);
  });

  it("addSet ajoute une série à l'exercice ciblé", async () => {
    const { result } = renderHook(() => useLogWorkout());

    act(() => { result.current.addExercise(makeExercise("e1", "Tractions")); });
    act(() => { result.current.addSet("e1"); });

    expect(result.current.entries[0].sets).toHaveLength(2);
  });

  it("removeExercise retire l'exercice", async () => {
    const { result } = renderHook(() => useLogWorkout());

    act(() => { result.current.addExercise(makeExercise("e1", "Curl")); });
    act(() => { result.current.removeExercise("e1"); });

    expect(result.current.entries).toHaveLength(0);
  });
});

describe("useLogWorkout — save", () => {
  it("save sans exercices : retourne null et stocke l'erreur", async () => {
    const { result } = renderHook(() => useLogWorkout());

    let session: unknown;
    await act(async () => { session = await result.current.save(); });

    expect(session).toBeNull();
    expect(result.current.error).toBe("Ajoute au moins un exercice");
  });

  it("save avec exercices : appelle createSession et retourne la session", async () => {
    const created = makeSession("new-session");
    sportApi.createSession.mockResolvedValue(created);
    const { result } = renderHook(() => useLogWorkout());

    act(() => {
      result.current.addExercise(makeExercise("e1", "Pompes"));
      result.current.updateSet("e1", 0, "reps", "10");
      result.current.updateSet("e1", 0, "weightKg", "0");
    });

    let session: unknown;
    await act(async () => { session = await result.current.save(); });

    expect(session).toEqual(created);
    expect(sportApi.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ sets: expect.arrayContaining([expect.objectContaining({ exerciseId: "e1" })]) })
    );
  });
});
