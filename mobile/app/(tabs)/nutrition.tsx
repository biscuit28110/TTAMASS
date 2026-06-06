import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg }}>
      <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary }}>Nutrition</Text>
      <Text style={{ color: Colors.textMuted, marginTop: Spacing.sm }}>Module en cours de développement</Text>
    </View>
  );
}
