import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FoodSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";

const createFoodSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  barcode: z.string().max(50).optional(),
  caloriesPer100g: z.number().nonnegative().max(10000),
  proteinPer100g: z.number().nonnegative().max(100),
  carbsPer100g: z.number().nonnegative().max(100),
  fatPer100g: z.number().nonnegative().max(100),
  fiberPer100g: z.number().nonnegative().max(100).optional(),
});

// Recherche dans le cache local — appelée par l'app avant Open Food Facts
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const barcode = searchParams.get("barcode")?.trim();

  if (!query && !barcode) {
    return NextResponse.json({ error: "Provide q or barcode param" }, { status: 400 });
  }

  const foods = await prisma.food.findMany({
    where: barcode
      ? { barcode }
      : {
          name: { contains: query!, mode: "insensitive" },
        },
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(foods);
}

// Crée un aliment custom ou cache un aliment Open Food Facts
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createFoodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { barcode, ...data } = parsed.data;

  // Si barcode fourni, upsert (évite les doublons du cache OFF)
  const food = barcode
    ? await prisma.food.upsert({
        where: { barcode },
        update: {},
        create: {
          ...data,
          barcode,
          source: FoodSource.OPEN_FOOD_FACTS,
        },
      })
    : await prisma.food.create({
        data: {
          ...data,
          source: FoodSource.CUSTOM,
          createdByUserId: user.id,
        },
      });

  return NextResponse.json(food, { status: 201 });
}
