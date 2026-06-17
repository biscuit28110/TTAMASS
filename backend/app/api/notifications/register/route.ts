import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";

const registerSchema = z.object({
  expoPushToken: z.string().min(1).nullish(),
  notifStreakReminder: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const updated = await prisma.userProfile.update({
    where: { userId: user.id },
    data: parsed.data,
    select: { expoPushToken: true, notifStreakReminder: true },
  });

  return NextResponse.json(updated);
}
