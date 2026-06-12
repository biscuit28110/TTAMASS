import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FoodSource, FoodUnit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";

const BEVERAGE_KEYWORDS = [
  "eau", "water", "jus", "juice", "lait", "milk", "soda", "café", "coffee",
  "thé", "tea", "bière", "beer", "vin", "wine", "boisson", "drink", "beverage",
  "limonade", "lemonade", "sirop", "syrup", "smoothie", "kombucha", "kéfir", "kefir",
  "nectar", "infusion", "tisane", "bouillon", "broth", "coca-cola", "pepsi", "fanta",
  "sprite", "orangina", "oasis", "vittel", "evian", "perrier", "volvic", "badoit",
  "contrex", "lipton", "activia drink", "yakult",
];

function getBeverageProps(name: string): { unit: FoodUnit; defaultQuantity: number } | null {
  const lower = name.toLowerCase();
  if (BEVERAGE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { unit: FoodUnit.ML, defaultQuantity: 250 };
  }
  return null;
}

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

interface UsdaFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  gtinUpc?: string;
  foodNutrients: Array<{ nutrientId: number; value: number }>;
}

// OFF v2 : Elasticsearch-based, pertinence réelle, fr + en
async function searchOFF(query: string): Promise<OFFProduct[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      langs: "fr,en",
      page_size: "25",
      fields: "code,product_name,product_name_fr,brands,nutriments",
    });
    const res = await fetch(`https://search.openfoodfacts.org/search?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return (data.hits ?? []).filter(
      (p: OFFProduct) =>
        (p.product_name_fr || p.product_name) &&
        p.nutriments != null
    );
  } catch {
    return [];
  }
}

// USDA FDC : aliments bruts et génériques (poulet, riz, œuf…)
// Foundation + SR Legacy = données per 100g, qualité nutritionnelle de référence
async function searchUSDA(query: string): Promise<UsdaFood[]> {
  const apiKey = process.env.USDA_API_KEY ?? "DEMO_KEY";
  try {
    const params = new URLSearchParams({
      query,
      api_key: apiKey,
      pageSize: "15",
      dataType: "Foundation,SR Legacy",
    });
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return (data.foods ?? []).filter((f: UsdaFood) =>
      f.description && Array.isArray(f.foodNutrients)
    );
  } catch {
    return [];
  }
}

function mapUsdaProduct(f: UsdaFood) {
  const get = (id: number) => f.foodNutrients.find((n) => n.nutrientId === id)?.value ?? 0;
  const raw = f.description;
  const name = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return {
    name,
    brand: f.brandOwner?.trim() || null,
    barcode: f.gtinUpc || null,
    caloriesPer100g: get(1008),
    proteinPer100g: get(1003),
    carbsPer100g: get(1005),
    fatPer100g: get(1004),
    fiberPer100g: get(1079) || null,
    source: FoodSource.OPEN_FOOD_FACTS,
    ...(getBeverageProps(name) ?? {}),
  };
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const barcode = searchParams.get("barcode")?.trim();

  if (!query && !barcode) {
    return NextResponse.json({ error: "Provide q or barcode param" }, { status: 400 });
  }

  if (barcode) {
    const local = await prisma.food.findMany({ where: { barcode }, take: 20 });
    return NextResponse.json(local);
  }

  // Ranking local : exact match > startsWith > contains (pertinence décroissante)
  const [exact, startsWith, contains] = await Promise.all([
    prisma.food.findMany({ where: { name: { equals: query!, mode: "insensitive" } }, take: 5 }),
    prisma.food.findMany({ where: { name: { startsWith: query!, mode: "insensitive" } }, take: 10 }),
    prisma.food.findMany({
      where: { OR: [{ name: { contains: query!, mode: "insensitive" } }, { brand: { contains: query!, mode: "insensitive" } }] },
      take: 20,
    }),
  ]);

  const seenLocal = new Set<string>();
  const local: typeof exact = [];
  for (const f of [...exact, ...startsWith, ...contains]) {
    if (!seenLocal.has(f.id)) { seenLocal.add(f.id); local.push(f); }
  }

  if (local.length >= 10) return NextResponse.json(local.slice(0, 25));

  // OFF v2 + USDA en parallèle
  const [offProducts, usdaProducts] = await Promise.all([
    searchOFF(query!),
    searchUSDA(query!),
  ]);

  // Cache OFF
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
        ...(getBeverageProps(name) ?? {}),
      };
      if (p.code) {
        return prisma.food.upsert({ where: { barcode: p.code }, update: {}, create: { ...foodData, barcode: p.code } });
      }
      const existing = await prisma.food.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
      if (existing) return existing;
      return prisma.food.create({ data: foodData });
    })
  );

  // Cache USDA — exclut les barcodes déjà couverts par OFF
  const offBarcodes = new Set(offFoods.map((f) => f.barcode).filter(Boolean));
  const usdaFoods = await Promise.all(
    usdaProducts
      .filter((f) => !f.gtinUpc || !offBarcodes.has(f.gtinUpc))
      .map(async (f) => {
        const foodData = mapUsdaProduct(f);
        if (foodData.barcode) {
          return prisma.food.upsert({ where: { barcode: foodData.barcode }, update: {}, create: foodData });
        }
        const existing = await prisma.food.findFirst({ where: { name: { equals: foodData.name, mode: "insensitive" } } });
        if (existing) return existing;
        return prisma.food.create({ data: foodData });
      })
  );

  // Fusion finale : local > OFF > USDA
  const merged = [...local];
  const seenMerge = new Set(local.map((f) => f.id));
  for (const f of [...offFoods, ...usdaFoods]) {
    if (!seenMerge.has(f.id)) { seenMerge.add(f.id); merged.push(f); }
  }

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
