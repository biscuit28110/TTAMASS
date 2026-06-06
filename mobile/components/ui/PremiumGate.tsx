import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, FontSize, Spacing } from "@/constants/theme";

interface Props {
  feature: string;
  description?: string;
  children?: React.ReactNode;
  isPremium: boolean;
}

export function PremiumGate({ feature, description, children, isPremium }: Props) {
  if (isPremium) return <>{children}</>;

  return (
    <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.xl, alignItems: "center", borderWidth: 1, borderColor: Colors.violet + "44" }}>
      <Text style={{ fontSize: 32, marginBottom: Spacing.sm }}>⭐</Text>
      <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md, textAlign: "center", marginBottom: 4 }}>
        {feature}
      </Text>
      {description && (
        <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, textAlign: "center", marginBottom: Spacing.lg, lineHeight: 18 }}>
          {description}
        </Text>
      )}
      <TouchableOpacity
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/paywall");
        }}
        style={{ backgroundColor: Colors.violet, borderRadius: 12, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.sm }}>Passer à Premium</Text>
      </TouchableOpacity>
    </View>
  );
}
