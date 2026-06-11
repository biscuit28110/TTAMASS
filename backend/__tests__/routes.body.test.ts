import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-user", () => ({ getUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    bodyMetric: { findMany: vi.fn(), create: vi.fn() },
    userProfile: { findUnique: vi.fn() },
  },
}));

import { getUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/body/metrics/route";

const mockUser = { id: "user-1", email: "test@ttamass.fr" };

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

describe("GET /api/body/metrics", () => {
  it("401 sans token", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    const res = await GET(makeReq("/api/body/metrics"));
    expect(res.status).toBe(401);
  });

  it("200 avec les métriques", async () => {
    const metrics = [{ id: "m1", date: "2026-06-10", weightKg: 80, bmi: 24.7 }];
    vi.mocked(prisma.bodyMetric.findMany).mockResolvedValue(metrics as never);

    const res = await GET(makeReq("/api/body/metrics"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].weightKg).toBe(80);
  });

  it("plafonne le limit à 365", async () => {
    vi.mocked(prisma.bodyMetric.findMany).mockResolvedValue([] as never);
    await GET(makeReq("/api/body/metrics?limit=9999"));
    expect(vi.mocked(prisma.bodyMetric.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ take: 365 })
    );
  });
});

describe("POST /api/body/metrics", () => {
  it("401 sans token", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    const res = await POST(makeReq("/api/body/metrics", { method: "POST", body: {} }));
    expect(res.status).toBe(401);
  });

  it("400 si date absente", async () => {
    const res = await POST(makeReq("/api/body/metrics", {
      method: "POST",
      body: { weightKg: 80 },
    }));
    expect(res.status).toBe(400);
  });

  it("400 si poids négatif", async () => {
    const res = await POST(makeReq("/api/body/metrics", {
      method: "POST",
      body: { date: "2026-06-10", weightKg: -5 },
    }));
    expect(res.status).toBe(400);
  });

  it("201 sans poids : pas de calcul BMI", async () => {
    const created = { id: "m1", date: "2026-06-10", weightKg: null, bmi: null, waistCm: 85 };
    vi.mocked(prisma.bodyMetric.create).mockResolvedValue(created as never);

    const res = await POST(makeReq("/api/body/metrics", {
      method: "POST",
      body: { date: "2026-06-10", waistCm: 85 },
    }));
    expect(res.status).toBe(201);
    expect(vi.mocked(prisma.userProfile.findUnique)).not.toHaveBeenCalled();
  });

  it("201 avec poids + profil : calcule le BMI", async () => {
    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({ heightCm: 180 } as never);
    const created = { id: "m1", date: "2026-06-10", weightKg: 80, bmi: 24.7 };
    vi.mocked(prisma.bodyMetric.create).mockResolvedValue(created as never);

    const res = await POST(makeReq("/api/body/metrics", {
      method: "POST",
      body: { date: "2026-06-10", weightKg: 80 },
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.bmi).toBe(24.7);
  });
});
