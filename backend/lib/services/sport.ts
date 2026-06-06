import { prisma } from "@/lib/prisma";
import { ExerciseProgressDto } from "@/types/sport";

export async function getExerciseProgress(
  userId: string,
  exerciseId: string,
  limit = 20
): Promise<ExerciseProgressDto[]> {
  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      workoutSets: { some: { exerciseId } },
    },
    include: {
      workoutSets: {
        where: { exerciseId },
        orderBy: { setNumber: "asc" },
      },
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  return sessions.map((session) => {
    const sets = session.workoutSets;
    const maxWeight = Math.max(...sets.map((s) => s.weightKg ?? 0));
    const totalVolume = sets.reduce(
      (sum, s) => sum + (s.reps ?? 0) * (s.weightKg ?? 0),
      0
    );
    return {
      date: session.date.toISOString().split("T")[0],
      maxWeightKg: maxWeight,
      totalVolume: Math.round(totalVolume),
      sets: sets.map((s) => ({
        setNumber: s.setNumber,
        reps: s.reps,
        weightKg: s.weightKg,
      })),
    };
  });
}
