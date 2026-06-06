import { View, Text } from "react-native";
import { Colors, Spacing } from "@/constants/theme";

interface Props {
  current: number;
  total: number;
  label: string;
}

export function StepProgress({ current, total, label }: Props) {
  return (
    <View style={{ marginBottom: Spacing.xl }}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: Spacing.sm }}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: i < current ? Colors.red : Colors.surface3,
            }}
          />
        ))}
      </View>
      <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
        Étape {current}/{total} — {label}
      </Text>
    </View>
  );
}
