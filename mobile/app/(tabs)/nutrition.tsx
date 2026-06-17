import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useNutrition, MealType } from "@/hooks/use-nutrition";
import { useRefreshOnForeground } from "@/hooks/use-refresh-on-foreground";
import { MealSection } from "@/components/nutrition/MealSection";
import { Colors, FontSize, Spacing } from "@/constants/theme";

const MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, error, load, deleteEntry } = useNutrition();

  useEffect(() => { load(); }, [load]);
  useRefreshOnForeground(() => load());

  const handleAdd = (meal: MealType) => {
    router.push({ pathname: "/nutrition/search", params: { meal } });
  };

  if (loading && !data) return (
    <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color={Colors.red} size="large" />
    </View>
  );

  if (error) return (
    <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center", padding: Spacing.lg }}>
      <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.md }}>{error}</Text>
      <TouchableOpacity onPress={() => load()} style={{ backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: 12 }}>
        <Text style={{ color: Colors.textPrimary }}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  const totals = data?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const targets = data?.targets ?? { calories: null, proteinG: null, carbsG: null, fatG: null };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load()} tintColor={Colors.red} />}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.xs }}>
        <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary }}>
          Nutrition
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/nutrition/history")}
          style={{ backgroundColor: Colors.surface, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>Historique</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.lg }}>
        {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </Text>

      {/* Barre récap calories */}
      <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm }}>
          <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>Calories</Text>
          <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.sm }}>
            {Math.round(totals.calories)} / {targets.calories ?? "—"} kcal
          </Text>
        </View>
        {/* Barre de progression */}
        <View style={{ height: 6, backgroundColor: Colors.surface3, borderRadius: 3, overflow: "hidden" }}>
          <View style={{ height: "100%", borderRadius: 3, backgroundColor: Colors.red, width: `${Math.min((totals.calories / (targets.calories ?? 1)) * 100, 100)}%` }} />
        </View>
        {/* Macros en ligne */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.md }}>
          {[
            { label: "P", value: totals.proteinG, target: targets.proteinG, color: Colors.red },
            { label: "G", value: totals.carbsG, target: targets.carbsG, color: Colors.violet },
            { label: "L", value: totals.fatG, target: targets.fatG, color: Colors.warning },
          ].map(({ label, value, target, color }) => (
            <View key={label} style={{ alignItems: "center" }}>
              <Text style={{ color, fontWeight: "700", fontSize: FontSize.sm }}>{Math.round(value)}g</Text>
              <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{label} / {target ?? "—"}g</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sections repas */}
      {MEALS.map((meal) => (
        <MealSection
          key={meal}
          meal={meal}
          entries={data?.byMeal?.[meal] ?? []}
          onAdd={handleAdd}
          onDelete={deleteEntry}
        />
      ))}
    </ScrollView>
  );
}
