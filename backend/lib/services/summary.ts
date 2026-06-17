import { prisma } from "@/lib/prisma";
import { getHistorySummary } from "@/lib/services/nutrition";
import { WeeklySummaryDto } from "@/types/summary";

const WINDOW_DAYS = 7;

export async function getWeeklySummary(userId: string): Promise<WeeklySummaryDto> {
  const now = new Date();
  const rangeEnd = new Date(now);
  rangeEnd.setHours(23, 59, 59, 999);
  const rangeStart = new Date(now);
  rangeStart.setDate(rangeStart.getDate() - (WINDOW_DAYS - 1));
  rangeStart.setHours(0, 0, 0, 0);

  const [history, workoutSessions, weights] = await Promise.all([
    getHistorySummary(userId, WINDOW_DAYS),
    prisma.workoutSession.count({
      where: { userId, date: { gte: rangeStart, lte: rangeEnd } },
    }),
    prisma.bodyMetric.findMany({
      where: { userId, date: { gte: rangeStart, lte: rangeEnd }, weightKg: { not: null } },
      orderBy: { date: "asc" },
      select: { weightKg: true },
    }),
  ]);

  // Moyenne calorique sur les jours réellement loggés (≥ 1 aliment)
  const loggedDays = history.filter((d) => d.totals.calories > 0);
  const totalCalories = loggedDays.reduce((s, d) => s + d.totals.calories, 0);
  const avgDailyCalories =
    loggedDays.length > 0 ? Math.round(totalCalories / loggedDays.length) : 0;

  // Variation de poids : dernier - premier point de la fenêtre
  const weightChangeKg =
    weights.length >= 2
      ? Math.round((weights[weights.length - 1].weightKg! - weights[0].weightKg!) * 10) / 10
      : null;

  return {
    startDate: rangeStart.toISOString().split("T")[0],
    endDate: rangeEnd.toISOString().split("T")[0],
    avgDailyCalories,
    daysLogged: loggedDays.length,
    workoutSessions,
    weightChangeKg,
  };
}
