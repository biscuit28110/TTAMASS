import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/get-user";
import { getHistorySummary } from "@/lib/services/nutrition";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ days: searchParams.get("days") ?? 7 });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const history = await getHistorySummary(user.id, parsed.data.days);
  return NextResponse.json(history);
}
