import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { StepProgress } from "@/components/ui/StepProgress";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingData } from "@/lib/api/profile";

type ActivityOption = { value: OnboardingData["activityLevel"]; label: string; description: string };
type GoalOption = { value: OnboardingData["goal"]; label: string; emoji: string };

const ACTIVITIES: ActivityOption[] = [
  { value: "SEDENTARY", label: "Sédentaire", description: "Bureau, peu ou pas de sport" },
  { value: "LIGHTLY_ACTIVE", label: "Légèrement actif", description: "1–3 séances/semaine" },
  { value: "MODERATELY_ACTIVE", label: "Modérément actif", description: "3–5 séances/semaine" },
  { value: "VERY_ACTIVE", label: "Très actif", description: "6–7 séances/semaine" },
  { value: "EXTRA_ACTIVE", label: "Extrêmement actif", description: "Athlète / travail physique" },
];

const GOALS: GoalOption[] = [
  { value: "RECOMPOSITION", label: "Recomposition", emoji: "⚡" },
  { value: "CUT", label: "Sèche", emoji: "🔥" },
  { value: "BULK", label: "Prise de masse", emoji: "💪" },
  { value: "MAINTENANCE", label: "Maintien", emoji: "⚖️" },
];

export default function OnboardingStep2({ ctx }: { ctx: ReturnType<typeof useOnboarding> }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl }}
    >
      <StepProgress current={2} total={3} label="Ton mode de vie" />

      <Text style={{ fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary, marginBottom: Spacing.xs }}>
        Ton niveau d'activité
      </Text>
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.lg }}>
        Impact direct sur ton TDEE.
      </Text>

      <View style={{ gap: Spacing.sm, marginBottom: Spacing.xl }}>
        {ACTIVITIES.map((a) => {
          const selected = ctx.data.activityLevel === a.value;
          return (
            <TouchableOpacity
              key={a.value}
              onPress={() => ctx.update({ activityLevel: a.value })}
              style={{
                backgroundColor: selected ? Colors.surface2 : Colors.surface,
                borderRadius: 12, padding: Spacing.md,
                borderWidth: 1, borderColor: selected ? Colors.red : Colors.border,
              }}
            >
              <Text style={{ color: selected ? Colors.textPrimary : Colors.textSecondary, fontWeight: selected ? "700" : "400", fontSize: FontSize.md }}>{a.label}</Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }}>{a.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary, marginBottom: Spacing.md }}>
        Ton objectif
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.xl }}>
        {GOALS.map((g) => {
          const selected = ctx.data.goal === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              onPress={() => ctx.update({ goal: g.value })}
              style={{
                width: "47%", padding: Spacing.md, borderRadius: 12, alignItems: "center",
                backgroundColor: selected ? Colors.red : Colors.surface,
                borderWidth: 1, borderColor: selected ? Colors.red : Colors.border,
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>{g.emoji}</Text>
              <Text style={{ color: selected ? "#fff" : Colors.textSecondary, fontWeight: "600", fontSize: FontSize.sm }}>{g.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", gap: Spacing.sm }}>
        <TouchableOpacity
          onPress={() => ctx.setStep(1)}
          style={{ flex: 1, padding: Spacing.md, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: "center" }}
        >
          <Text style={{ color: Colors.textSecondary, fontWeight: "600" }}>← Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); ctx.goToStep3(); }}
          style={{ flex: 2, backgroundColor: Colors.red, padding: Spacing.md, borderRadius: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.md }}>Voir mes objectifs →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
