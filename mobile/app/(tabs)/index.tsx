import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg }}
    >
      <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary, marginBottom: Spacing.xs }}>
        Bonjour 👋
      </Text>
      <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl }}>
        Voici ton résumé du jour
      </Text>

      {/* Calories card */}
      <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs }}>Calories restantes</Text>
        <Text style={{ color: Colors.red, fontSize: FontSize.hero, fontWeight: "900", lineHeight: FontSize.hero }}>
          — kcal
        </Text>
        <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.xs }}>
          Connecte l'API pour voir tes données
        </Text>
      </View>

      {/* Macros row */}
      <View style={{ flexDirection: "row", gap: Spacing.sm }}>
        {[
          { label: "Protéines", color: Colors.red },
          { label: "Glucides", color: Colors.violet },
          { label: "Lipides", color: Colors.warning },
        ].map((m) => (
          <View key={m.label} style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ color: m.color, fontSize: FontSize.lg, fontWeight: "800" }}>—g</Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }}>{m.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
