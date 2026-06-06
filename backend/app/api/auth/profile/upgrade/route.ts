import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";

const upgradeSchema = z.object({
  plan: z.enum(["FREE", "PREMIUM"]),
  // In production: receiptData from StoreKit/RevenueCat webhook signature
  receiptData: z.string().optional(),
});

// Called by RevenueCat webhook (server-to-server) or directly for testing
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = upgradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await prisma.userProfile.update({
    where: { userId: user.id },
    data: { plan: parsed.data.plan },
    select: { plan: true, userId: true },
  });

  return NextResponse.json({ plan: profile.plan });
}
