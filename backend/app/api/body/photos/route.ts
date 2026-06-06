import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BodyPhotoType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";

const createSchema = z.object({
  url: z.string().url(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.nativeEnum(BodyPhotoType),
  notes: z.string().max(500).optional(),
});

// Photos réservées aux users Premium
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { plan: true },
  });

  if (profile?.plan === "FREE") {
    return NextResponse.json({ error: "Photos require Premium" }, { status: 403 });
  }

  const photos = await prisma.bodyPhoto.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { plan: true },
  });

  if (profile?.plan === "FREE") {
    return NextResponse.json({ error: "Photos require Premium" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const photo = await prisma.bodyPhoto.create({
    data: {
      userId: user.id,
      date: new Date(`${parsed.data.date}T12:00:00.000Z`),
      url: parsed.data.url,
      type: parsed.data.type,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
