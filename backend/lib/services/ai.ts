import { prisma } from "@/lib/prisma";
import { groq } from "@/lib/groq";

const FREE_DAILY_LIMIT = 5;

export async function checkDailyLimit(userId: string, isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const count = await prisma.aiMessage.count({
    where: {
      conversation: { userId },
      role: "USER",
      createdAt: { gte: todayStart },
    },
  });

  return count < FREE_DAILY_LIMIT;
}

export async function buildSystemPrompt(userId: string): Promise<string> {
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const [profile, todayEntries, latestMetric] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.foodEntry.findMany({
      where: { userId, date: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.bodyMetric.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalCalories = todayEntries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = todayEntries.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = todayEntries.reduce((s, e) => s + e.carbsG, 0);
  const totalFat = todayEntries.reduce((s, e) => s + e.fatG, 0);

  return `Tu es le coach nutrition et fitness personnel de l'utilisateur dans l'app TTAMASS.
Tu analyses ses données réelles et lui donnes des conseils personnalisés, directs et motivants.

PROFIL :
- Objectif : ${profile?.goal ?? "non défini"}
- Niveau activité : ${profile?.activityLevel ?? "non défini"}
- Poids actuel : ${latestMetric?.weightKg ?? profile?.weightKg ?? "inconnu"} kg

OBJECTIFS JOURNALIERS :
- Calories cibles : ${profile?.targetCalories ?? "non défini"} kcal
- Protéines : ${profile?.targetProteinG ?? "non défini"}g
- Glucides : ${profile?.targetCarbsG ?? "non défini"}g
- Lipides : ${profile?.targetFatG ?? "non défini"}g

AUJOURD'HUI (${today.toLocaleDateString("fr-FR")}) :
- Calories consommées : ${Math.round(totalCalories)} kcal
- Protéines : ${Math.round(totalProtein)}g
- Glucides : ${Math.round(totalCarbs)}g
- Lipides : ${Math.round(totalFat)}g
- Calories restantes : ${Math.round((profile?.targetCalories ?? 0) - totalCalories)} kcal

Réponds toujours en français. Sois concis, direct et actionnable. Maximum 3 paragraphes.`;
}

export async function streamCoachReply(
  conversationId: string,
  userMessage: string,
  systemPrompt: string,
  history: { role: "USER" | "ASSISTANT" | "SYSTEM"; content: string }[]
) {
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-10).map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content ?? "";
  const inputTokens = completion.usage?.prompt_tokens ?? 0;
  const outputTokens = completion.usage?.completion_tokens ?? 0;

  return { reply, inputTokens, outputTokens };
}
