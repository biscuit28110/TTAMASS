import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Affiche les notifications même quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type ReminderKey = "meal" | "streak" | "workout" | "calorieGoal";

export interface ReminderConfig {
  enabled: boolean;
  hour: number; // 0..23, minute fixée à 0
}

export type NotifPrefs = Record<ReminderKey, ReminderConfig>;

export const DEFAULT_PREFS: NotifPrefs = {
  meal: { enabled: false, hour: 19 },
  streak: { enabled: false, hour: 21 },
  workout: { enabled: false, hour: 18 },
  calorieGoal: { enabled: false, hour: 20 },
};

export const REMINDER_LABELS: Record<ReminderKey, { title: string; body: string; label: string }> = {
  meal: {
    label: "Rappel repas",
    title: "🍽️ Pense à logger tes repas",
    body: "N'oublie pas d'enregistrer ce que tu as mangé aujourd'hui.",
  },
  streak: {
    label: "Rappel streak",
    title: "🔥 Maintiens ton streak !",
    body: "Track au moins une chose aujourd'hui pour ne pas le perdre.",
  },
  workout: {
    label: "Rappel séance",
    title: "💪 C'est l'heure de bouger",
    body: "Une séance de prévue aujourd'hui ? C'est le moment.",
  },
  calorieGoal: {
    label: "Objectif calorique",
    title: "📊 Où en es-tu de ton objectif ?",
    body: "Vérifie tes calories restantes pour la journée.",
  },
};

// Demande la permission ; retourne true si accordée.
export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Rappels",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#E53935",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Rappels programmés localement sur l'appareil (time-based).
// "streak" est exclu : il est piloté par le serveur (push intelligent, voir backend).
const LOCAL_KEYS: ReminderKey[] = ["meal", "workout", "calorieGoal"];

// Reprogramme tous les rappels locaux depuis les préférences.
// Annule d'abord tout pour éviter les doublons.
export async function rescheduleAll(prefs: NotifPrefs): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const key of LOCAL_KEYS) {
    const cfg = prefs[key];
    if (!cfg.enabled) continue;
    const { title, body } = REMINDER_LABELS[key];
    await Notifications.scheduleNotificationAsync({
      identifier: key,
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: cfg.hour,
        minute: 0,
      },
    });
  }
}

// Récupère le token Expo Push (pour les notifications pilotées serveur).
// Nécessite un dev build (ne fonctionne pas dans Expo Go) et la permission.
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const granted = await requestPermission();
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}
