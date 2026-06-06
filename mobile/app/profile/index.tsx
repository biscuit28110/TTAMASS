import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useProfile } from "@/hooks/use-profile";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Colors, FontSize, Spacing } from "@/constants/theme";

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
  const { profile, loading, saving, error, load, updateTargets, signOut } = useProfile();
  const [editMode, setEditMode] = useState(false);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (profile && !editMode) {
      setCalories(String(profile.targetCalories ?? ""));
      setProtein(String(profile.targetProteinG ?? ""));
      setCarbs(String(profile.targetCarbsG ?? ""));
      setFat(String(profile.targetFatG ?? ""));
    }
  }, [profile, editMode]);

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateTargets({
      targetCalories: calories ? parseInt(calories) : undefined,
      targetProteinG: protein ? parseInt(protein) : undefined,
      targetCarbsG: carbs ? parseInt(carbs) : undefined,
      targetFatG: fat ? parseInt(fat) : undefined,
    });
    setEditMode(false);
  };

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

        {/* Objectifs macros */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md }}>
            <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md }}>Objectifs nutritionnels</Text>
            {!editMode ? (
              <TouchableOpacity onPress={() => setEditMode(true)}>
                <Text style={{ color: Colors.red, fontSize: FontSize.xs, fontWeight: "600" }}>Modifier</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setEditMode(false)}>
                <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? <SkeletonBlock height={60} /> : editMode ? (
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
                onPress={handleSave}
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
