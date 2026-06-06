import { View, Text, TouchableOpacity } from "react-native";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { FoodEntry, MealType } from "@/hooks/use-nutrition";
import { FoodEntryRow } from "./FoodEntryRow";

const MEAL_LABELS: Record<MealType, { label: string; emoji: string }> = {
  BREAKFAST: { label: "Petit-déjeuner", emoji: "☀️" },
  LUNCH: { label: "Déjeuner", emoji: "🥗" },
  DINNER: { label: "Dîner", emoji: "🌙" },
  SNACK: { label: "Collation", emoji: "🍎" },
};

interface Props {
  meal: MealType;
  entries: FoodEntry[];
  onAdd: (meal: MealType) => void;
  onDelete: (id: string) => void;
}

export function MealSection({ meal, entries, onAdd, onDelete }: Props) {
  const { label, emoji } = MEAL_LABELS[meal];
  const total = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <View style={{ marginBottom: Spacing.lg }}>
      {/* En-tête section */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
        <Text style={{ flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "600", marginLeft: Spacing.sm }}>{label}</Text>
        {total > 0 && <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>{Math.round(total)} kcal</Text>}
        <TouchableOpacity
          onPress={() => onAdd(meal)}
          style={{ marginLeft: Spacing.sm, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.red, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 18, lineHeight: 22 }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Entrées */}
      {entries.length === 0 ? (
        <TouchableOpacity
          onPress={() => onAdd(meal)}
          style={{ borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed", borderRadius: 12, padding: Spacing.md, alignItems: "center" }}
        >
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>Ajouter un aliment</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ gap: Spacing.xs }}>
          {entries.map((entry) => (
            <FoodEntryRow key={entry.id} entry={entry} onDelete={onDelete} />
          ))}
        </View>
      )}
    </View>
  );
}
