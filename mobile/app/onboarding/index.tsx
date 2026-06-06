import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useOnboarding } from "@/hooks/use-onboarding";
import { StepProgress } from "@/components/ui/StepProgress";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { OnboardingStep2 } from "./step2";
import { OnboardingStep3 } from "./step3";

function GenderBtn({ label, value, selected, onPress }: { label: string; value: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1, padding: Spacing.md, borderRadius: 12, alignItems: "center",
        backgroundColor: selected ? Colors.red : Colors.surface,
        borderWidth: 1, borderColor: selected ? Colors.red : Colors.border,
      }}
    >
      <Text style={{ color: selected ? "#fff" : Colors.textSecondary, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function NumberInput({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (v: number) => void }) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md }}>
        <TextInput
          value={String(value)}
          onChangeText={(t) => { const n = parseFloat(t); if (!isNaN(n)) onChange(n); }}
          keyboardType="numeric"
          style={{ flex: 1, color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: "800", paddingVertical: Spacing.md }}
        />
        <Text style={{ color: Colors.textMuted, fontSize: FontSize.md }}>{unit}</Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const ctx = useOnboarding();

  if (ctx.step === 2) return <OnboardingStep2 ctx={ctx} />;
  if (ctx.step === 3) return <OnboardingStep3 ctx={ctx} />;

  const birthYear = ctx.data.birthDate ? new Date(ctx.data.birthDate).getFullYear() : new Date().getFullYear() - 25;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <StepProgress current={1} total={3} label="Ton profil" />

      <Text style={{ fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary, marginBottom: Spacing.xs }}>
        Parlons de toi
      </Text>
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xl }}>
        Ces données servent à calculer tes besoins caloriques précis.
      </Text>

      {/* Sexe */}
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: 6 }}>Sexe</Text>
      <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <GenderBtn label="Homme" value="MALE" selected={ctx.data.gender === "MALE"} onPress={() => ctx.update({ gender: "MALE" })} />
        <GenderBtn label="Femme" value="FEMALE" selected={ctx.data.gender === "FEMALE"} onPress={() => ctx.update({ gender: "FEMALE" })} />
        <GenderBtn label="Autre" value="OTHER" selected={ctx.data.gender === "OTHER"} onPress={() => ctx.update({ gender: "OTHER" })} />
      </View>

      {/* Année de naissance */}
      <NumberInput
        label="Année de naissance"
        value={birthYear}
        unit="an"
        onChange={(y) => ctx.update({ birthDate: `${y}-06-15` })}
      />

      <NumberInput label="Taille" value={ctx.data.heightCm} unit="cm" onChange={(v) => ctx.update({ heightCm: v })} />
      <NumberInput label="Poids actuel" value={ctx.data.weightKg} unit="kg" onChange={(v) => ctx.update({ weightKg: v })} />

      {ctx.error && <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.md }}>{ctx.error}</Text>}

      <TouchableOpacity
        onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); ctx.goToStep2(); }}
        style={{ backgroundColor: Colors.red, borderRadius: 12, padding: Spacing.md, alignItems: "center", marginTop: Spacing.md }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.md }}>Continuer →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
