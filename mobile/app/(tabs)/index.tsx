import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useHome } from "@/hooks/use-home";
import { useRefreshOnForeground } from "@/hooks/use-refresh-on-foreground";
import { MacroRing } from "@/components/ui/MacroRing";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { summary, profile, loading, error, caloriesLeft, latestWeight, weightTrend, refresh } = useHome();

  useRefreshOnForeground(refresh);

  const targets = summary?.targets ?? null;
  const totals = summary?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  if (error) return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
      <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.md }}>{error}</Text>
      <TouchableOpacity onPress={refresh} style={{ backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: 12 }}>
        <Text style={{ color: Colors.textPrimary }}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.red} />}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xl }}>
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>{greeting()} 👋</Text>
          <Text style={{ color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: "800" }}>TTAMASS</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/profile")} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18 }}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Calories restantes */}
      <View style={{ backgroundColor: Colors.surface, borderRadius: 20, padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs }}>Calories restantes</Text>
        {loading ? <SkeletonBlock height={64} /> : (
          <>
            <Text style={{ fontSize: 64, fontWeight: "900", color: caloriesLeft >= 0 ? Colors.red : Colors.error, lineHeight: 72 }}>
              {Math.abs(Math.round(caloriesLeft))}
            </Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>
              {caloriesLeft >= 0 ? `sur ${targets?.calories ?? "—"} kcal` : "dépassement"}
              {"  ·  "}{Math.round(totals.calories)} consommées
            </Text>
          </>
        )}
      </View>

      {/* Anneaux macros */}
      <View style={{ backgroundColor: Colors.surface, borderRadius: 20, padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.lg }}>Macronutriments</Text>
        {loading ? (
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            {[0, 1, 2].map(i => <SkeletonBlock key={i} width={80} height={80} borderRadius={40} />)}
          </View>
        ) : (
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <MacroRing label="Protéines" current={totals.proteinG} target={targets?.proteinG ?? 0} color={Colors.red} />
            <MacroRing label="Glucides" current={totals.carbsG} target={targets?.carbsG ?? 0} color={Colors.violet} />
            <MacroRing label="Lipides" current={totals.fatG} target={targets?.fatG ?? 0} color={Colors.warning} />
          </View>
        )}
      </View>

      {/* Streak + actions rapides */}
      <View style={{ flexDirection: "row", gap: Spacing.sm }}>
        <View style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 28 }}>🔥</Text>
          {loading ? <SkeletonBlock height={28} style={{ marginTop: 4 }} /> : (
            <Text style={{ color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: "900", marginTop: 4 }}>
              {profile?.currentStreak ?? 0}
            </Text>
          )}
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>jours de streak</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/nutrition")}
          style={{ flex: 2, backgroundColor: Colors.red, borderRadius: 16, padding: Spacing.lg, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 24 }}>＋</Text>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.sm, marginTop: 4 }}>Logger un repas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
