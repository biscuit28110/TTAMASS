import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { calculateBmi } from "@/lib/services/body";

const updateSchema = z.object({
  weightKg: z.number().positive().max(500).optional(),
  waistCm: z.number().positive().max(300).optional(),
  chestCm: z.number().positive().max(300).optional(),
  armCm: z.number().positive().max(150).optional(),
  thighCm: z.number().positive().max(200).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const metric = await prisma.bodyMetric.findUnique({ where: { id } });
  if (!metric) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (metric.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let bmi = metric.bmi;
  if (parsed.data.weightKg) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { heightCm: true },
    });
    if (profile?.heightCm) {
      bmi = calculateBmi(parsed.data.weightKg, profile.heightCm);
    }
  }

  const updated = await prisma.bodyMetric.update({
    where: { id },
    data: { ...parsed.data, bmi },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const metric = await prisma.bodyMetric.findUnique({ where: { id } });
  if (!metric) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (metric.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.bodyMetric.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
