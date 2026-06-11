import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-user", () => ({ getUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workoutSession: { findMany: vi.fn() },
    exercise: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/sport/sessions/route";

const mockUser = { id: "user-1", email: "test@ttamass.fr" };
const EXERCISE_UUID = "550e8400-e29b-41d4-a716-446655440001";
const validSet = { exerciseId: EXERCISE_UUID, setNumber: 1, reps: 10, weightKg: 60 };

function makeReq(url: string, options: { method?: string; body?: unknown } = {}) {
  const req = new NextRequest(`http://localhost${url}`, {
    method: options.method ?? "GET",
    headers: { Authorization: "Bearer test-token", "Content-Type": "application/json" },
  });
  if (options.body !== undefined) {
    (req as unknown as { json: () => Promise<unknown> }).json = () => Promise.resolve(options.body);
  }
  return req;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUser).mockResolvedValue(mockUser as never);
});

describe("GET /api/sport/sessions", () => {
  it("401 sans token", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    const res = await GET(makeReq("/api/sport/sessions"));
    expect(res.status).toBe(401);
  });

  it("200 avec les séances", async () => {
    const sessions = [{ id: "s1", date: "2026-06-10", workoutSets: [] }];
    vi.mocked(prisma.workoutSession.findMany).mockResolvedValue(sessions as never);

    const res = await GET(makeReq("/api/sport/sessions"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  it("plafonne le limit à 100", async () => {
    vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([] as never);
    await GET(makeReq("/api/sport/sessions?limit=9999"));
    expect(vi.mocked(prisma.workoutSession.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });
});

describe("POST /api/sport/sessions", () => {
  it("401 sans token", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    const res = await POST(makeReq("/api/sport/sessions", { method: "POST", body: {} }));
    expect(res.status).toBe(401);
  });

  it("400 si sets vide (min 1)", async () => {
    const res = await POST(makeReq("/api/sport/sessions", {
      method: "POST",
      body: { date: "2026-06-10", sets: [] },
    }));
    expect(res.status).toBe(400);
  });

  it("400 si date absente", async () => {
    const res = await POST(makeReq("/api/sport/sessions", {
      method: "POST",
      body: { sets: [validSet] },
    }));
    expect(res.status).toBe(400);
  });

  it("404 si un exercice n'existe pas", async () => {
    vi.mocked(prisma.exercise.findMany).mockResolvedValue([] as never);

    const res = await POST(makeReq("/api/sport/sessions", {
      method: "POST",
      body: { date: "2026-06-10", sets: [validSet] },
    }));
    expect(res.status).toBe(404);
  });

  it("201 : exécute la transaction et retourne la séance", async () => {
    const exercise = { id: EXERCISE_UUID, name: "Squat" };
    vi.mocked(prisma.exercise.findMany).mockResolvedValue([exercise] as never);
    const created = { id: "s1", date: "2026-06-10", workoutSets: [{ ...validSet, exercise }] };
    vi.mocked(prisma.$transaction).mockResolvedValue(created as never);

    const res = await POST(makeReq("/api/sport/sessions", {
      method: "POST",
      body: { date: "2026-06-10", sets: [validSet] },
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("s1");
    expect(vi.mocked(prisma.$transaction)).toHaveBeenCalledTimes(1);
  });
});
