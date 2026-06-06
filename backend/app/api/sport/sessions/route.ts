import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";

const setSchema = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive().max(1000).optional(),
  weightKg: z.number().nonnegative().max(1000).optional(),
  durationSec: z.number().int().positive().max(7200).optional(),
  notes: z.string().max(200).optional(),
});

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  duration: z.number().int().positive().max(600).optional(), // minutes
  sets: z.array(setSchema).min(1).max(100),
});

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: user.id },
    include: {
      workoutSets: {
        include: { exercise: true },
        orderBy: { setNumber: "asc" },
      },
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { date, sets, ...sessionData } = parsed.data;

  // Vérification que tous les exercices existent
  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
  });
  if (exercises.length !== exerciseIds.length) {
    return NextResponse.json({ error: "One or more exercises not found" }, { status: 404 });
  }

  const session = await prisma.$transaction(async (tx) => {
    const newSession = await tx.workoutSession.create({
      data: {
        userId: user.id,
        date: new Date(`${date}T12:00:00.000Z`),
        ...sessionData,
      },
    });

    await tx.workoutSet.createMany({
      data: sets.map((s) => ({ sessionId: newSession.id, ...s })),
    });

    return tx.workoutSession.findUnique({
      where: { id: newSession.id },
      include: {
        workoutSets: {
          include: { exercise: true },
          orderBy: { setNumber: "asc" },
        },
      },
    });
  });

  return NextResponse.json(session, { status: 201 });
}
