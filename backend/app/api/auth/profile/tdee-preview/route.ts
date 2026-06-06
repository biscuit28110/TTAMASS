import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ActivityLevel, Goal, Gender } from "@prisma/client";
import { getUser } from "@/lib/auth/get-user";
import { calculateTdee } from "@/lib/services/tdee";

const schema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.nativeEnum(Gender),
  heightCm: z.number().positive().max(300),
  weightKg: z.number().positive().max(500),
  activityLevel: z.nativeEnum(ActivityLevel),
  goal: z.nativeEnum(Goal),
});

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { birthDate, gender, ...rest } = parsed.data;
  const result = calculateTdee({
    ...rest,
    birthDate: new Date(birthDate),
    gender: gender === "OTHER" ? "MALE" : gender,
  });

  return NextResponse.json(result);
}
