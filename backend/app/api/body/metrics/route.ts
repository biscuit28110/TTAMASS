import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { calculateBmi } from "@/lib/services/body";

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().max(500).optional(),
  waistCm: z.number().positive().max(300).optional(),
  chestCm: z.number().positive().max(300).optional(),
  armCm: z.number().positive().max(150).optional(),
  thighCm: z.number().positive().max(200).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 90), 365);

  const metrics = await prisma.bodyMetric.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(metrics);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { date, weightKg, ...measurements } = parsed.data;

  // Calcul BMI si on a le poids et la taille du profil
  let bmi: number | undefined;
  if (weightKg) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { heightCm: true },
    });
    if (profile?.heightCm) {
      bmi = calculateBmi(weightKg, profile.heightCm);
    }
  }

  const metric = await prisma.bodyMetric.create({
    data: {
      userId: user.id,
      date: new Date(`${date}T12:00:00.000Z`),
      weightKg,
      bmi,
      ...measurements,
    },
  });

  return NextResponse.json(metric, { status: 201 });
}
