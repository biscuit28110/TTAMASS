import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useNotifications } from "@/hooks/use-notifications";
import { ReminderKey, REMINDER_LABELS } from "@/lib/notifications";
import { Colors, FontSize, Spacing } from "@/constants/theme";

const ORDER: ReminderKey[] = ["meal", "streak", "workout", "calorieGoal"];

function HourStepper({ hour, onChange }: { hour: number; onChange: (h: number) => void }) {
  const step = async (delta: number) => {
    await Haptics.selectionAsync();
    onChange((hour + delta + 24) % 24);
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md, marginTop: Spacing.sm }}>
      <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>Heure</Text>
      <TouchableOpacity
        onPress={() => step(-1)}
        style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surface2, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border }}
      >
        <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: "700" }}>−</Text>
      </TouchableOpacity>
      <Text style={{ color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: "800", minWidth: 54, textAlign: "center" }}>
        {String(hour).padStart(2, "0")}:00
      </Text>
      <TouchableOpacity
        onPress={() => step(1)}
        style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surface2, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border }}
      >
        <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: "700" }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { prefs, loading, permissionDenied, toggle, setHour } = useNotifications();

  const handleToggle = async (key: ReminderKey, value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggle(key, value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xl }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: Spacing.md }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary }}>Notifications</Text>
        </View>

        <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.lg, lineHeight: 20 }}>
          Active des rappels quotidiens pour garder le rythme. Tu peux choisir l'heure de chacun.
        </Text>

        {permissionDenied && (
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + "66", marginBottom: Spacing.lg }}
          >
            <Text style={{ color: Colors.warning, fontSize: FontSize.sm, fontWeight: "700", marginBottom: 2 }}>Permission refusée</Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>Active les notifications dans les réglages système. Touche ici pour les ouvrir.</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator color={Colors.red} style={{ marginTop: Spacing.xl }} />
        ) : (
          <View style={{ gap: Spacing.md }}>
            {ORDER.map((key) => {
              const cfg = prefs[key];
              const { label, body } = REMINDER_LABELS[key];
              return (
                <View key={key} style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1, marginRight: Spacing.md }}>
                      <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md }}>{label}</Text>
                      <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }}>{body}</Text>
                    </View>
                    <Switch
                      value={cfg.enabled}
                      onValueChange={(v) => handleToggle(key, v)}
                      trackColor={{ false: Colors.surface2, true: Colors.red }}
                      thumbColor="#fff"
                    />
                  </View>
                  {cfg.enabled && <HourStepper hour={cfg.hour} onChange={(h) => setHour(key, h)} />}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
