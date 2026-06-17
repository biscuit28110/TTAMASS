import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { getWeeklySummary } from "@/lib/services/summary";

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summary = await getWeeklySummary(user.id);
  return NextResponse.json(summary);
}
