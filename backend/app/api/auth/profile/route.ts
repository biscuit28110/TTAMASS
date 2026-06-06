import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ActivityLevel, Goal, Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { calculateTdee } from "@/lib/services/tdee";

const onboardingSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.nativeEnum(Gender),
  heightCm: z.number().positive().max(300),
  weightKg: z.number().positive().max(500),
  activityLevel: z.nativeEnum(ActivityLevel),
  goal: z.nativeEnum(Goal),
  // Optionnel : l'user peut override les calculs auto
  targetCalories: z.number().int().positive().optional(),
  targetProteinG: z.number().int().positive().optional(),
  targetCarbsG: z.number().int().positive().optional(),
  targetFatG: z.number().int().positive().optional(),
});

const updateSchema = onboardingSchema.partial();

// Récupérer le profil
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json(profile);
}

// Créer le profil après inscription (onboarding)
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  if (existing) return NextResponse.json({ error: "Profile already exists" }, { status: 409 });

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    birthDate,
    gender,
    heightCm,
    weightKg,
    activityLevel,
    goal,
    targetCalories,
    targetProteinG,
    targetCarbsG,
    targetFatG,
  } = parsed.data;

  const manualOverride = !!(targetCalories || targetProteinG || targetCarbsG || targetFatG);

  // Calcul TDEE automatique si pas d'override manuel
  const tdee = calculateTdee({
    weightKg,
    heightCm,
    birthDate: new Date(birthDate),
    gender: gender === "OTHER" ? "MALE" : gender,
    activityLevel,
    goal,
  });

  const profile = await prisma.userProfile.create({
    data: {
      userId: user.id,
      birthDate: new Date(birthDate),
      gender,
      heightCm,
      weightKg,
      activityLevel,
      goal,
      manualOverride,
      targetCalories: targetCalories ?? tdee.targetCalories,
      targetProteinG: targetProteinG ?? tdee.targetProteinG,
      targetCarbsG: targetCarbsG ?? tdee.targetCarbsG,
      targetFatG: targetFatG ?? tdee.targetFatG,
    },
  });

  return NextResponse.json({ profile, tdee }, { status: 201 });
}

// Mettre à jour le profil
export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { targetCalories, targetProteinG, targetCarbsG, targetFatG, ...rest } = parsed.data;
  const manualOverride = !!(targetCalories || targetProteinG || targetCarbsG || targetFatG);

  // Recalcul TDEE si données physiques changées et pas d'override
  let tdeeTargets = {};
  const needsRecalc = rest.weightKg || rest.heightCm || rest.birthDate || rest.activityLevel || rest.goal;
  if (needsRecalc && !manualOverride) {
    const updated = { ...profile, ...rest };
    if (updated.weightKg && updated.heightCm && updated.birthDate && updated.activityLevel && updated.goal) {
      const tdee = calculateTdee({
        weightKg: updated.weightKg,
        heightCm: updated.heightCm,
        birthDate: new Date(updated.birthDate),
        gender: updated.gender === "FEMALE" ? "FEMALE" : "MALE",
        activityLevel: updated.activityLevel,
        goal: updated.goal,
      });
      tdeeTargets = {
        targetCalories: tdee.targetCalories,
        targetProteinG: tdee.targetProteinG,
        targetCarbsG: tdee.targetCarbsG,
        targetFatG: tdee.targetFatG,
      };
    }
  }

  const updated = await prisma.userProfile.update({
    where: { userId: user.id },
    data: {
      ...rest,
      ...(rest.birthDate ? { birthDate: new Date(rest.birthDate) } : {}),
      ...(manualOverride ? { targetCalories, targetProteinG, targetCarbsG, targetFatG, manualOverride: true } : tdeeTargets),
    },
  });

  return NextResponse.json(updated);
}
