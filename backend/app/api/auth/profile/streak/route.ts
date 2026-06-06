import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";

function calculateStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const unique = [...new Set(dates)].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Current streak: count consecutive days from today or yesterday
  let current = 0;
  const start = unique[0] === today || unique[0] === yesterday ? unique[0] : null;
  if (start) {
    let check = new Date(start);
    for (const d of unique) {
      const checkStr = check.toISOString().split("T")[0];
      if (d === checkStr) {
        current++;
        check = new Date(check.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  // Longest streak: scan all dates
  const sorted = [...unique].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  return { current, longest };
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Collect all days with at least 1 food log or 1 workout
  const [foodDays, workoutDays] = await Promise.all([
    prisma.foodEntry.findMany({
      where: { userId: user.id },
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
      take: 400,
    }),
    prisma.workoutSession.findMany({
      where: { userId: user.id },
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
      take: 400,
    }),
  ]);

  const allDates = [
    ...foodDays.map((e) => e.date.toISOString().split("T")[0]),
    ...workoutDays.map((s) => s.date.toISOString().split("T")[0]),
  ];

  const { current, longest } = calculateStreak(allDates);

  const profile = await prisma.userProfile.update({
    where: { userId: user.id },
    data: {
      currentStreak: current,
      longestStreak: Math.max(longest, current),
    },
  });

  return NextResponse.json({ currentStreak: profile.currentStreak, longestStreak: profile.longestStreak });
}
