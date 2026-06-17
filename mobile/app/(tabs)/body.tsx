import { useCallback, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useBody, Period } from "@/hooks/use-body";
import { useRefreshOnForeground } from "@/hooks/use-refresh-on-foreground";
import { WeightChart } from "@/components/body/WeightChart";
import { AddMetricSheet } from "@/components/body/AddMetricSheet";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Colors, FontSize, Spacing } from "@/constants/theme";

const PERIODS: Period[] = ["7j", "30j", "90j"];

export default function BodyScreen() {
  const insets = useSafeAreaInsets();
  const { metrics, period, loading, saving, error, load, changePeriod, save, latest, trend, weightData } = useBody();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Recharge à chaque focus : spinner au 1er affichage, mise à jour silencieuse ensuite
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      load(undefined, !firstFocus.current);
      firstFocus.current = false;
    }, [load])
  );
  useRefreshOnForeground(() => load(undefined, true));

  const handleSave = async (fields: Parameters<typeof save>[0]) => {
    const ok = await save(fields);
    if (ok) setSheetOpen(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load()} tintColor={Colors.red} />}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.xl }}>
          <View>
            <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary }}>Corps</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 }}>Suivi de ta progression</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSheetOpen(true)}
            style={{ backgroundColor: Colors.red, borderRadius: 14, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>＋</Text>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.sm }}>Mesure</Text>
          </TouchableOpacity>
        </View>

        {/* Poids actuel + tendance */}
        <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg }}>
          <View style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: 4 }}>Poids actuel</Text>
            {loading ? <SkeletonBlock height={36} /> : (
              <Text style={{ color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: "900" }}>
                {latest?.weightKg?.toFixed(1) ?? "—"}
                <Text style={{ fontSize: FontSize.md, color: Colors.textMuted }}> kg</Text>
              </Text>
            )}
          </View>

          <View style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: 4 }}>Tendance</Text>
            {loading ? <SkeletonBlock height={36} /> : (
              <Text style={{ fontSize: FontSize.xxl, fontWeight: "900", color: trend === null ? Colors.textMuted : trend <= 0 ? Colors.success : Colors.error }}>
                {trend === null ? "—" : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}`}
                {trend !== null && <Text style={{ fontSize: FontSize.md }}> kg</Text>}
              </Text>
            )}
          </View>
        </View>

        {/* IMC */}
        {latest?.bmi && (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>IMC</Text>
            <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.lg }}>{latest.bmi}</Text>
          </View>
        )}

        {/* Graphique poids */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 20, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg }}>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "600" }}>Évolution du poids</Text>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => changePeriod(p)}
                  style={{ paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 8, backgroundColor: period === p ? Colors.red : Colors.surface2 }}
                >
                  <Text style={{ color: period === p ? "#fff" : Colors.textMuted, fontSize: 11, fontWeight: "600" }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {loading ? <SkeletonBlock height={160} /> : <WeightChart data={weightData} />}
        </View>

        {/* Mensurations dernière entrée */}
        {latest && (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "600", marginBottom: Spacing.md }}>Dernières mensurations</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
              {[
                { label: "Taille", value: latest.waistCm, unit: "cm" },
                { label: "Poitrine", value: latest.chestCm, unit: "cm" },
                { label: "Bras", value: latest.armCm, unit: "cm" },
                { label: "Cuisse", value: latest.thighCm, unit: "cm" },
              ].filter((m) => m.value).map((m) => (
                <View key={m.label} style={{ backgroundColor: Colors.surface2, borderRadius: 12, padding: Spacing.md, minWidth: "45%" }}>
                  <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{m.label}</Text>
                  <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.lg }}>{m.value} {m.unit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {error && <Text style={{ color: Colors.error, textAlign: "center", marginTop: Spacing.lg }}>{error}</Text>}
      </ScrollView>

      <AddMetricSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onSave={handleSave} loading={saving} />
    </View>
  );
}
