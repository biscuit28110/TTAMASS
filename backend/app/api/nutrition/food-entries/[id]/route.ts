import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MealType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { calculateMacros } from "@/lib/services/nutrition";

const updateSchema = z.object({
  quantityG: z.number().positive().max(5000).optional(),
  mealType: z.nativeEnum(MealType).optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.foodEntry.findUnique({ where: { id } });

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.foodEntry.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.foodEntry.findUnique({
    where: { id },
    include: { food: true },
  });

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const quantityG = parsed.data.quantityG ?? entry.quantityG;
  const macros = calculateMacros(entry.food, quantityG);

  const updated = await prisma.foodEntry.update({
    where: { id },
    data: { quantityG, mealType: parsed.data.mealType, ...macros },
    include: { food: true },
  });

  return NextResponse.json(updated);
}
