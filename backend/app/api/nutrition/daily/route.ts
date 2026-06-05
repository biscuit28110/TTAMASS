import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { getDailySummary } from "@/lib/services/nutrition";

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const date = new Date(`${dateParam}T12:00:00.000Z`);

  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
  }

  const summary = await getDailySummary(user.id, date);
  return NextResponse.json(summary);
}
