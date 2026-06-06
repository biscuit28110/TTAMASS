import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useNutritionHistory } from "@/hooks/use-nutrition-history";
import { Colors, FontSize, Spacing } from "@/constants/theme";

const PERIODS = [
  { label: "7J", value: 7 },
  { label: "30J", value: 30 },
  { label: "90J", value: 90 },
];

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  if (dateStr === today) return "Aujourd'hui";
  if (dateStr === yesterday) return "Hier";
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { history, days, loading, error, load } = useNutritionHistory();

  useEffect(() => { load(7); }, [load]);

  const handlePeriod = (d: number) => {
    Haptics.selectionAsync();
    load(d);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: Spacing.md, padding: 4 }}>
            <Text style={{ color: Colors.red, fontSize: FontSize.md, fontWeight: "600" }}>‹ Retour</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary }}>
            Historique
          </Text>
        </View>

        {/* Sélecteur période */}
        <View style={{ flexDirection: "row", backgroundColor: Colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border }}>
          {PERIODS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              onPress={() => handlePeriod(value)}
              style={{
                flex: 1,
                paddingVertical: Spacing.sm,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: days === value ? Colors.red : "transparent",
              }}
            >
              <Text style={{
                color: days === value ? "#fff" : Colors.textSecondary,
                fontWeight: days === value ? "700" : "400",
                fontSize: FontSize.sm,
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={Colors.red} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.lg }}>
          <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.md }}>{error}</Text>
          <TouchableOpacity
            onPress={() => load(days)}
            style={{ backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: 12 }}
          >
            <Text style={{ color: Colors.textPrimary }}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
        >
          {history.map((day) => {
            const caloriesPct = day.targets.calories
              ? Math.min((day.totals.calories / day.targets.calories) * 100, 100)
              : 0;
            const isEmpty = day.entryCount === 0;

            return (
              <View
                key={day.date}
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 16,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  opacity: isEmpty ? 0.45 : 1,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: isEmpty ? 0 : Spacing.sm }}>
                  <Text style={{ color: Colors.textPrimary, fontWeight: "600", fontSize: FontSize.sm }}>
                    {formatDate(day.date)}
                  </Text>
                  {isEmpty ? (
                    <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>Pas de données</Text>
                  ) : (
                    <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>
                      {Math.round(day.totals.calories)}{day.targets.calories ? ` / ${day.targets.calories}` : ""} kcal
                    </Text>
                  )}
                </View>

                {!isEmpty && (
                  <>
                    {/* Barre calories */}
                    <View style={{ height: 5, backgroundColor: Colors.surface3, borderRadius: 3, overflow: "hidden", marginBottom: Spacing.sm }}>
                      <View style={{
                        height: "100%",
                        borderRadius: 3,
                        backgroundColor: caloriesPct >= 100 ? Colors.warning : Colors.red,
                        width: `${caloriesPct}%`,
                      }} />
                    </View>

                    {/* Macros */}
                    <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                      {[
                        { label: "Prot.", value: day.totals.proteinG, color: Colors.red },
                        { label: "Gluc.", value: day.totals.carbsG, color: Colors.violet },
                        { label: "Lip.", value: day.totals.fatG, color: Colors.warning },
                      ].map(({ label, value, color }) => (
                        <View key={label} style={{ alignItems: "center" }}>
                          <Text style={{ color, fontWeight: "700", fontSize: FontSize.xs }}>{Math.round(value)}g</Text>
                          <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{label}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
