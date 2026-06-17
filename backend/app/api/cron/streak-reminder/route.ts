import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendExpoPush, isValidExpoToken } from "@/lib/services/push";

// Déclenché par une tâche planifiée Coolify (cron), le soir.
// Envoie un rappel streak aux users qui ont opt-in et n'ont rien loggé aujourd'hui.
// Protégé par MIGRATION_TOKEN (Bearer).
export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.MIGRATION_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const [candidates, trackedToday] = await Promise.all([
    prisma.userProfile.findMany({
      where: { notifStreakReminder: true, expoPushToken: { not: null } },
      select: { userId: true, expoPushToken: true },
    }),
    prisma.foodEntry.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const trackedSet = new Set(trackedToday.map((e) => e.userId));

  const messages = candidates
    .filter((c) => !trackedSet.has(c.userId) && isValidExpoToken(c.expoPushToken))
    .map((c) => ({
      to: c.expoPushToken!,
      title: "🔥 Maintiens ton streak !",
      body: "Tu n'as rien loggé aujourd'hui. Track un repas pour ne pas le perdre.",
    }));

  await sendExpoPush(messages);

  return NextResponse.json({ success: true, sent: messages.length, candidates: candidates.length });
}
