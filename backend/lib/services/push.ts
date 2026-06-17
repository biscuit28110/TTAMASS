interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound?: "default";
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Envoie un lot de notifications via l'API Expo Push.
// Expo accepte jusqu'à 100 messages par requête.
export async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100).map((m) => ({ ...m, sound: "default" as const }));
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
  }
}

// Filtre les tokens Expo valides (format ExponentPushToken[...]).
export function isValidExpoToken(token: string | null): token is string {
  return !!token && token.startsWith("ExponentPushToken[");
}
