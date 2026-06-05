import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MealType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { calculateMacros } from "@/lib/services/nutrition";

const createSchema = z.object({
  foodId: z.string().uuid(),
  mealType: z.nativeEnum(MealType),
  quantityG: z.number().positive().max(5000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const entries = await prisma.foodEntry.findMany({
    where: { userId: user.id, date: { gte: dayStart, lte: dayEnd } },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { foodId, mealType, quantityG, date } = parsed.data;

  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) return NextResponse.json({ error: "Food not found" }, { status: 404 });

  const macros = calculateMacros(food, quantityG);

  const entry = await prisma.foodEntry.create({
    data: {
      userId: user.id,
      foodId,
      mealType,
      quantityG,
      date: new Date(`${date}T12:00:00.000Z`),
      ...macros,
    },
    include: { food: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
