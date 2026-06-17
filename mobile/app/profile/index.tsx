import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useProfile } from "@/hooks/use-profile";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { ActivityLevel, Goal } from "@/lib/api/nutrition";

const ACTIVITIES: { value: ActivityLevel; label: string }[] = [
  { value: "SEDENTARY", label: "Sédentaire" },
  { value: "LIGHTLY_ACTIVE", label: "Légèrement actif" },
  { value: "MODERATELY_ACTIVE", label: "Modérément actif" },
  { value: "VERY_ACTIVE", label: "Très actif" },
  { value: "EXTRA_ACTIVE", label: "Extrêmement actif" },
];

const GOALS: { value: Goal; label: string; emoji: string }[] = [
  { value: "RECOMPOSITION", label: "Recomposition", emoji: "⚡" },
  { value: "CUT", label: "Sèche", emoji: "🔥" },
  { value: "BULK", label: "Prise de masse", emoji: "💪" },
  { value: "MAINTENANCE", label: "Maintien", emoji: "⚖️" },
];

function StatCard({ emoji, value, label, color }: { emoji: string; value: string | number; label: string; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 14, padding: Spacing.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{ color: color ?? Colors.textPrimary, fontWeight: "900", fontSize: FontSize.xl, marginTop: 4 }}>{value}</Text>
      <Text style={{ color: Colors.textMuted, fontSize: 10, marginTop: 2, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

function MacroField({ label, value, unit, onChange }: { label: string; value: string; unit: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: Colors.textMuted, fontSize: 10, marginBottom: 4 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface2, borderRadius: 10, paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: Colors.border }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          style={{ flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: "700", paddingVertical: Spacing.sm }}
        />
        <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{unit}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loading, saving, error, load, updateTargets, updatePersonal, signOut } = useProfile();

  // Macro edit state
  const [editMacros, setEditMacros] = useState(false);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  // Personal edit state
  const [editPersonal, setEditPersonal] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (profile && !editMacros) {
      setCalories(String(profile.targetCalories ?? ""));
      setProtein(String(profile.targetProteinG ?? ""));
      setCarbs(String(profile.targetCarbsG ?? ""));
      setFat(String(profile.targetFatG ?? ""));
    }
  }, [profile, editMacros]);

  useEffect(() => {
    if (profile && !editPersonal) {
      setWeight(profile.weightKg ? String(profile.weightKg) : "");
      setHeight(profile.heightCm ? String(profile.heightCm) : "");
      setActivityLevel(profile.activityLevel ?? null);
      setGoal(profile.goal ?? null);
    }
  }, [profile, editPersonal]);

  const handleSaveMacros = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateTargets({
      targetCalories: calories ? parseInt(calories) : undefined,
      targetProteinG: protein ? parseInt(protein) : undefined,
      targetCarbsG: carbs ? parseInt(carbs) : undefined,
      targetFatG: fat ? parseInt(fat) : undefined,
    });
    setEditMacros(false);
  };

  const handleSavePersonal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updatePersonal({
      weightKg: weight ? parseFloat(weight) : undefined,
      heightCm: height ? parseFloat(height) : undefined,
      activityLevel: activityLevel ?? undefined,
      goal: goal ?? undefined,
    });
    setEditPersonal(false);
  };

  const goalLabel = GOALS.find(g => g.value === profile?.goal);
  const activityLabel = ACTIVITIES.find(a => a.value === profile?.activityLevel);

  const handleSignOut = () => {
    Alert.alert("Déconnexion", "Tu veux vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion", style: "destructive", onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
        }
      }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xl }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: Spacing.md }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary }}>Mon profil</Text>
        </View>

        {/* Avatar + plan badge */}
        <View style={{ alignItems: "center", marginBottom: Spacing.xl }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.red, justifyContent: "center", alignItems: "center", marginBottom: Spacing.md }}>
            <Text style={{ fontSize: 36 }}>🏋️</Text>
          </View>
          {loading ? <SkeletonBlock width={120} height={28} /> : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
              <View style={{ backgroundColor: profile?.plan === "PREMIUM" ? Colors.violet : Colors.surface2, borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: profile?.plan === "PREMIUM" ? Colors.violet : Colors.border }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                  {profile?.plan === "PREMIUM" ? "⭐ Premium" : "Free"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        {loading ? (
          <SkeletonBlock height={90} style={{ marginBottom: Spacing.lg }} />
        ) : (
          <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg }}>
            <StatCard emoji="🔥" value={profile?.currentStreak ?? 0} label="Streak actuel" color={Colors.red} />
            <StatCard emoji="🏆" value={profile?.longestStreak ?? 0} label="Record" color={Colors.warning} />
            <StatCard emoji="⚖️" value={profile?.weightKg?.toFixed(1) ?? "—"} label="kg départ" />
          </View>
        )}

        {/* Données personnelles */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md }}>
            <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md }}>Données personnelles</Text>
            {!editPersonal ? (
              <TouchableOpacity onPress={() => setEditPersonal(true)}>
                <Text style={{ color: Colors.red, fontSize: FontSize.xs, fontWeight: "600" }}>Modifier</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setEditPersonal(false)}>
                <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? <SkeletonBlock height={80} /> : editPersonal ? (
            <>
              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
                <MacroField label="POIDS" value={weight} unit="kg" onChange={setWeight} />
                <MacroField label="TAILLE" value={height} unit="cm" onChange={setHeight} />
              </View>

              <Text style={{ color: Colors.textMuted, fontSize: 10, marginBottom: Spacing.xs }}>NIVEAU D'ACTIVITÉ</Text>
              <View style={{ gap: Spacing.xs, marginBottom: Spacing.md }}>
                {ACTIVITIES.map((a) => (
                  <TouchableOpacity
                    key={a.value}
                    onPress={() => setActivityLevel(a.value)}
                    style={{ flexDirection: "row", alignItems: "center", backgroundColor: activityLevel === a.value ? Colors.red + "22" : Colors.surface2, borderRadius: 10, padding: Spacing.sm, borderWidth: 1, borderColor: activityLevel === a.value ? Colors.red : Colors.border }}
                  >
                    <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: activityLevel === a.value ? Colors.red : Colors.textMuted, backgroundColor: activityLevel === a.value ? Colors.red : "transparent", marginRight: Spacing.sm }} />
                    <Text style={{ color: activityLevel === a.value ? Colors.textPrimary : Colors.textSecondary, fontSize: FontSize.sm, fontWeight: activityLevel === a.value ? "700" : "400" }}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: Colors.textMuted, fontSize: 10, marginBottom: Spacing.xs }}>OBJECTIF</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginBottom: Spacing.md }}>
                {GOALS.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    onPress={() => setGoal(g.value)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: goal === g.value ? Colors.red + "22" : Colors.surface2, borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: goal === g.value ? Colors.red : Colors.border }}
                  >
                    <Text style={{ fontSize: 14 }}>{g.emoji}</Text>
                    <Text style={{ color: goal === g.value ? Colors.textPrimary : Colors.textSecondary, fontSize: FontSize.sm, fontWeight: goal === g.value ? "700" : "400" }}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSavePersonal}
                disabled={saving}
                style={{ backgroundColor: Colors.red, borderRadius: 12, padding: Spacing.md, alignItems: "center", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Enregistrer · Recalcul TDEE auto</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
              {[
                { label: "Poids", value: profile?.weightKg, unit: "kg" },
                { label: "Taille", value: profile?.heightCm, unit: "cm" },
              ].map((m) => (
                <View key={m.label} style={{ backgroundColor: Colors.surface2, borderRadius: 10, padding: Spacing.sm, minWidth: "45%", flex: 1, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{m.label}</Text>
                  <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md }}>{m.value ?? "—"} <Text style={{ fontSize: 10, color: Colors.textMuted }}>{m.unit}</Text></Text>
                </View>
              ))}
              <View style={{ backgroundColor: Colors.surface2, borderRadius: 10, padding: Spacing.sm, width: "100%", borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ color: Colors.textMuted, fontSize: 10, marginBottom: 2 }}>Activité</Text>
                <Text style={{ color: Colors.textPrimary, fontWeight: "600", fontSize: FontSize.sm }}>{activityLabel?.label ?? "—"}</Text>
              </View>
              <View style={{ backgroundColor: Colors.surface2, borderRadius: 10, padding: Spacing.sm, width: "100%", borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ color: Colors.textMuted, fontSize: 10, marginBottom: 2 }}>Objectif</Text>
                <Text style={{ color: Colors.textPrimary, fontWeight: "600", fontSize: FontSize.sm }}>{goalLabel ? `${goalLabel.emoji} ${goalLabel.label}` : "—"}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Objectifs macros */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md }}>
            <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md }}>Objectifs nutritionnels</Text>
            {!editMacros ? (
              <TouchableOpacity onPress={() => setEditMacros(true)}>
                <Text style={{ color: Colors.red, fontSize: FontSize.xs, fontWeight: "600" }}>Modifier</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setEditMacros(false)}>
                <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? <SkeletonBlock height={60} /> : editMacros ? (
            <>
              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm }}>
                <MacroField label="CALORIES" value={calories} unit="kcal" onChange={setCalories} />
                <MacroField label="PROTÉINES" value={protein} unit="g" onChange={setProtein} />
              </View>
              <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md }}>
                <MacroField label="GLUCIDES" value={carbs} unit="g" onChange={setCarbs} />
                <MacroField label="LIPIDES" value={fat} unit="g" onChange={setFat} />
              </View>
              <TouchableOpacity
                onPress={handleSaveMacros}
                disabled={saving}
                style={{ backgroundColor: Colors.red, borderRadius: 12, padding: Spacing.md, alignItems: "center", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Enregistrer</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
              {[
                { label: "Calories", value: profile?.targetCalories, unit: "kcal" },
                { label: "Protéines", value: profile?.targetProteinG, unit: "g" },
                { label: "Glucides", value: profile?.targetCarbsG, unit: "g" },
                { label: "Lipides", value: profile?.targetFatG, unit: "g" },
              ].map((m) => (
                <View key={m.label} style={{ backgroundColor: Colors.surface2, borderRadius: 10, padding: Spacing.sm, minWidth: "45%", borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{m.label}</Text>
                  <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md }}>{m.value ?? "—"} <Text style={{ fontSize: 10, color: Colors.textMuted }}>{m.unit}</Text></Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Premium upsell (Free only) */}
        {!loading && profile?.plan === "FREE" && (
          <TouchableOpacity
            onPress={() => router.push("/paywall")}
            style={{ backgroundColor: Colors.violet, borderRadius: 16, padding: Spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md }}
          >
            <View>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: FontSize.md }}>⭐ Passer à Premium</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FontSize.xs, marginTop: 2 }}>Coach IA illimité · Photos · Export</Text>
            </View>
            <Text style={{ color: "#fff", fontSize: FontSize.lg }}>→</Text>
          </TouchableOpacity>
        )}

        {error && <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.md }}>{error}</Text>}

        {/* Notifications */}
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: Spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <Text style={{ color: Colors.textPrimary, fontWeight: "700" }}>Notifications</Text>
          </View>
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.lg }}>→</Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: Spacing.lg, alignItems: "center", borderWidth: 1, borderColor: Colors.border }}
        >
          <Text style={{ color: Colors.error, fontWeight: "700" }}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
