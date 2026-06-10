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

interface OFFProduct {
  code: string;
  product_name: string;
  product_name_fr?: string;
  brands?: string;
  nutriments: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
  };
}

async function searchOFF(query: string): Promise<OFFProduct[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&lc=fr&cc=fr&sort_by=unique_scans_n&fields=code,product_name,product_name_fr,brands,nutriments`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return (data.products ?? []).filter(
      (p: OFFProduct) =>
        (p.product_name_fr || p.product_name) &&
        (p.nutriments?.["energy-kcal_100g"] ?? 0) > 0
    );
  } catch {
    return [];
  }
}

// Recherche locale + Open Food Facts fusionnée
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const barcode = searchParams.get("barcode")?.trim();

  if (!query && !barcode) {
    return NextResponse.json({ error: "Provide q or barcode param" }, { status: 400 });
  }

  // Recherche locale sur name ET brand
  const local = await prisma.food.findMany({
    where: barcode
      ? { barcode }
      : {
          OR: [
            { name: { contains: query!, mode: "insensitive" } },
            { brand: { contains: query!, mode: "insensitive" } },
          ],
        },
    take: 20,
    orderBy: { name: "asc" },
  });

  if (barcode || local.length >= 10) {
    return NextResponse.json(local);
  }

  // Compléter avec OFF si résultats locaux insuffisants
  const offProducts = await searchOFF(query!);

  // Auto-cache les résultats OFF (upsert par barcode quand disponible)
  const offFoods = await Promise.all(
    offProducts.map(async (p) => {
      const name = p.product_name_fr || p.product_name;
      const foodData = {
        name,
        brand: p.brands?.split(",")[0].trim() || null,
        caloriesPer100g: p.nutriments["energy-kcal_100g"] ?? 0,
        proteinPer100g: p.nutriments.proteins_100g ?? 0,
        carbsPer100g: p.nutriments.carbohydrates_100g ?? 0,
        fatPer100g: p.nutriments.fat_100g ?? 0,
        fiberPer100g: p.nutriments.fiber_100g ?? null,
        source: FoodSource.OPEN_FOOD_FACTS,
      };

      if (p.code) {
        return prisma.food.upsert({
          where: { barcode: p.code },
          update: {},
          create: { ...foodData, barcode: p.code },
        });
      }

      // Sans barcode : cherche si déjà en DB par nom exact, sinon crée
      const existing = await prisma.food.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
      if (existing) return existing;
      return prisma.food.create({ data: foodData });
    })
  );

  // Fusionner : local en premier, dédupliquer par id
  const localIds = new Set(local.map((f) => f.id));
  const merged = [...local, ...offFoods.filter((f) => !localIds.has(f.id))];

  return NextResponse.json(merged.slice(0, 25));
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
