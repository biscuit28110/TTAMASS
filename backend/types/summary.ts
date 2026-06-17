export interface WeeklySummaryDto {
  startDate: string; // YYYY-MM-DD (il y a 6 jours)
  endDate: string; // YYYY-MM-DD (aujourd'hui)
  avgDailyCalories: number; // moyenne sur les jours loggés (0 si aucun)
  daysLogged: number; // 0..7
  workoutSessions: number; // nb de séances dans la fenêtre
  weightChangeKg: number | null; // dernier - premier poids ; null si < 2 mesures
}
