import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import {
  NotifPrefs,
  DEFAULT_PREFS,
  ReminderKey,
  requestPermission,
  rescheduleAll,
  getExpoPushToken,
} from "@/lib/notifications";
import { notificationsApi } from "@/lib/api/notifications";

const STORAGE_KEY = "notif_prefs";

function mergeWithDefaults(raw: Partial<NotifPrefs> | null): NotifPrefs {
  if (!raw) return DEFAULT_PREFS;
  return {
    meal: { ...DEFAULT_PREFS.meal, ...raw.meal },
    streak: { ...DEFAULT_PREFS.streak, ...raw.streak },
    workout: { ...DEFAULT_PREFS.workout, ...raw.workout },
    calorieGoal: { ...DEFAULT_PREFS.calorieGoal, ...raw.calorieGoal },
  };
}

export function useNotifications() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        setPrefs(mergeWithDefaults(stored ? JSON.parse(stored) : null));
      } catch {
        setPrefs(DEFAULT_PREFS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: NotifPrefs) => {
    setPrefs(next);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    await rescheduleAll(next);
  }, []);

  // Active/désactive un rappel. Au premier activé, demande la permission.
  // "streak" est piloté serveur : on enregistre le token + l'opt-in côté backend.
  const toggle = useCallback(
    async (key: ReminderKey, enabled: boolean) => {
      if (enabled) {
        const granted = await requestPermission();
        if (!granted) {
          setPermissionDenied(true);
          return;
        }
        setPermissionDenied(false);
      }

      if (key === "streak") {
        if (enabled) {
          const token = await getExpoPushToken();
          await notificationsApi.register({ expoPushToken: token, notifStreakReminder: true });
        } else {
          await notificationsApi.register({ notifStreakReminder: false });
        }
      }

      await persist({ ...prefs, [key]: { ...prefs[key], enabled } });
    },
    [prefs, persist]
  );

  const setHour = useCallback(
    async (key: ReminderKey, hour: number) => {
      await persist({ ...prefs, [key]: { ...prefs[key], hour } });
    },
    [prefs, persist]
  );

  return { prefs, loading, permissionDenied, toggle, setHour };
}
