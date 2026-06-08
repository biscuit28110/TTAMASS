import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { StepProgress } from "@/components/ui/StepProgress";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { useOnboarding } from "@/hooks/use-onboarding";
import { TdeePreview } from "@/lib/api/profile";

function MacroRow({
  label, value, color, onEdit,
}: { label: string; value: number; color: string; onEdit: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: Spacing.sm }} />
      <Text style={{ flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <TextInput
          value={String(value)}
          onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n)) onEdit(n); }}
          keyboardType="numeric"
          style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md, textAlign: "right", minWidth: 60 }}
        />
        <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>g</Text>
      </View>
    </View>
  );
}

export default function OnboardingStep3({ ctx }: { ctx: ReturnType<typeof useOnboarding> }) {
  const insets = useSafeAreaInsets();
  const tdee = ctx.tdee as TdeePreview;

  const updateTdee = (field: keyof TdeePreview, value: number) => {
    ctx.setTdee((prev: TdeePreview | null) => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <StepProgress current={3} total={3} label="Tes objectifs" />

      <Text style={{ fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary, marginBottom: Spacing.xs }}>
        Tes objectifs calculés
      </Text>
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xl }}>
        Basés sur la formule Mifflin-St Jeor. Tu peux les ajuster.
      </Text>

      {/* TDEE info */}
      <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl }}>
        {[
          { label: "Métabolisme de base", value: tdee.bmr, unit: "kcal" },
          { label: "Dépense journalière", value: tdee.tdee, unit: "kcal" },
        ].map((item) => (
          <View key={item.label} style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ color: Colors.textMuted, fontSize: 10, marginBottom: 4 }}>{item.label}</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.lg, fontWeight: "800" }}>{item.value}</Text>
            <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{item.unit}</Text>
          </View>
        ))}
      </View>

      {/* Objectif calorique */}
      <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: 4 }}>Objectif calorique</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            value={String(tdee.targetCalories)}
            onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n)) updateTdee("targetCalories", n); }}
            keyboardType="numeric"
            style={{ color: Colors.red, fontSize: FontSize.xxl, fontWeight: "900", flex: 1 }}
          />
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.lg }}>kcal/jour</Text>
        </View>
      </View>

      {/* Macros */}
      <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>Macronutriments</Text>
        <MacroRow label="Protéines" value={tdee.targetProteinG} color={Colors.red} onEdit={(v) => updateTdee("targetProteinG", v)} />
        <MacroRow label="Glucides" value={tdee.targetCarbsG} color={Colors.violet} onEdit={(v) => updateTdee("targetCarbsG", v)} />
        <MacroRow label="Lipides" value={tdee.targetFatG} color={Colors.warning} onEdit={(v) => updateTdee("targetFatG", v)} />
      </View>

      {ctx.error && <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.md }}>{ctx.error}</Text>}

      <View style={{ flexDirection: "row", gap: Spacing.sm }}>
        <TouchableOpacity
          onPress={() => ctx.setStep(2)}
          style={{ flex: 1, padding: Spacing.md, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: "center" }}
        >
          <Text style={{ color: Colors.textSecondary, fontWeight: "600" }}>← Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); ctx.submit(); }}
          disabled={ctx.loading}
          style={{ flex: 2, backgroundColor: Colors.red, padding: Spacing.md, borderRadius: 12, alignItems: "center", opacity: ctx.loading ? 0.7 : 1 }}
        >
          {ctx.loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.md }}>C'est parti 🚀</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
