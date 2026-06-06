import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MuscleGroup } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";

const createCustomSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.nativeEnum(MuscleGroup),
});

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const muscleGroup = searchParams.get("muscleGroup") as MuscleGroup | null;

  const exercises = await prisma.exercise.findMany({
    where: {
      AND: [
        muscleGroup ? { muscleGroup } : {},
        {
          OR: [
            { isCustom: false },
            { isCustom: true, createdByUserId: user.id },
          ],
        },
      ],
    },
    orderBy: [{ isCustom: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(exercises);
}

// Créer un exercice custom
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createCustomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const exercise = await prisma.exercise.create({
    data: {
      ...parsed.data,
      isCustom: true,
      createdByUserId: user.id,
    },
  });

  return NextResponse.json(exercise, { status: 201 });
}
