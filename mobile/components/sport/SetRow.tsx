import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Colors, FontSize, Spacing } from "@/constants/theme";

interface Props {
  index: number;
  reps: string;
  weightKg: string;
  onChangeReps: (v: string) => void;
  onChangeWeight: (v: string) => void;
  onRemove: () => void;
}

export function SetRow({ index, reps, weightKg, onChangeReps, onChangeWeight, onRemove }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.xs }}>
      <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, width: 24, textAlign: "center" }}>{index + 1}</Text>
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: Colors.surface2, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" }}>
        <TextInput
          value={reps}
          onChangeText={onChangeReps}
          keyboardType="numeric"
          placeholder="Reps"
          placeholderTextColor={Colors.textMuted}
          style={{ flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: "600", padding: Spacing.sm, textAlign: "center" }}
        />
        <View style={{ width: 1, backgroundColor: Colors.border }} />
        <TextInput
          value={weightKg}
          onChangeText={onChangeWeight}
          keyboardType="decimal-pad"
          placeholder="kg"
          placeholderTextColor={Colors.textMuted}
          style={{ flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: "600", padding: Spacing.sm, textAlign: "center" }}
        />
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ color: Colors.textMuted, fontSize: 16 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
