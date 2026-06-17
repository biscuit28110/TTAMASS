import { api } from "@/lib/api/client";

export const notificationsApi = {
  register: (data: { expoPushToken?: string | null; notifStreakReminder?: boolean }) =>
    api.post<{ expoPushToken: string | null; notifStreakReminder: boolean }>(
      "/api/notifications/register",
      data
    ),
};
