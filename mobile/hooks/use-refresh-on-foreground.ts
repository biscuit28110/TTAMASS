import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

// Rejoue `onForeground` quand l'app revient au premier plan.
// Garde-fou minBackgroundMs : on ignore les bascules rapides (multitâche, notif)
// pour ne re-fetch que si l'app a réellement été en arrière-plan un moment —
// utile notamment au passage de minuit (le résumé du jour change de date).
export function useRefreshOnForeground(onForeground: () => void, minBackgroundMs = 30_000) {
  const callbackRef = useRef(onForeground);
  callbackRef.current = onForeground;

  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        if (since !== null && Date.now() - since >= minBackgroundMs) {
          callbackRef.current();
        }
      } else if (backgroundedAt.current === null) {
        backgroundedAt.current = Date.now();
      }
    });
    return () => sub.remove();
  }, [minBackgroundMs]);
}
