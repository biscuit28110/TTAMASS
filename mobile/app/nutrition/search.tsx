import { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useFoodSearch } from "@/hooks/use-food-search";
import { QuantityBottomSheet } from "@/components/nutrition/QuantityBottomSheet";
import { Food } from "@/lib/api/foods";
import { MealType } from "@/hooks/use-nutrition";
import { Colors, FontSize, Spacing } from "@/constants/theme";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Petit-déjeuner", LUNCH: "Déjeuner", DINNER: "Dîner", SNACK: "Collation",
};

export default function FoodSearchScreen() {
  const insets = useSafeAreaInsets();
  const { meal } = useLocalSearchParams<{ meal: MealType }>();
  const { query, results, searching, logging, error, search, logFood } = useFoodSearch(meal ?? "LUNCH");
  const [selected, setSelected] = useState<Food | null>(null);

  const handleConfirm = async (food: Food, grams: number) => {
    const ok = await logFood(food, grams);
    if (ok) {
      setSelected(null);
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.textSecondary, fontSize: FontSize.md }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textMuted, fontSize: 11 }}>{MEAL_LABELS[meal ?? "LUNCH"]}</Text>
          <TextInput
            autoFocus
            placeholder="Rechercher un aliment..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={search}
            style={{ color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: "600", padding: 0 }}
          />
        </View>
        {searching && <ActivityIndicator color={Colors.red} size="small" />}
      </View>

      <View style={{ height: 1, backgroundColor: Colors.border }} />

      {/* Résultats */}
      {error && (
        <Text style={{ color: Colors.error, textAlign: "center", padding: Spacing.lg }}>{error}</Text>
      )}

      {query.length < 2 && !searching && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>🔍</Text>
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>Tape au moins 2 caractères</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, i) => item.id || `${item.barcode}-${i}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
        ListEmptyComponent={
          query.length >= 2 && !searching ? (
            <Text style={{ color: Colors.textMuted, textAlign: "center", padding: Spacing.xl }}>Aucun résultat pour "{query}"</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelected(item)}
            style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={{ color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: "600" }} numberOfLines={1}>{item.name}</Text>
                {item.brand && <Text style={{ color: Colors.textMuted, fontSize: 11 }}>{item.brand}</Text>}
              </View>
              <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "700" }}>{Math.round(item.caloriesPer100g)} kcal</Text>
            </View>
            <Text style={{ color: Colors.textMuted, fontSize: 10, marginTop: 4 }}>
              P:{item.proteinPer100g}g · G:{item.carbsPer100g}g · L:{item.fatPer100g}g · pour 100g
            </Text>
          </TouchableOpacity>
        )}
      />

      <QuantityBottomSheet
        food={selected}
        onConfirm={handleConfirm}
        onClose={() => setSelected(null)}
        loading={logging}
      />
    </View>
  );
}
