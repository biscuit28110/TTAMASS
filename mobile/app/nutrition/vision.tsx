import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useVision, DetectedFood } from "@/hooks/use-vision";
import { MealType } from "@/hooks/use-nutrition";
import { Colors, FontSize, Spacing } from "@/constants/theme";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Petit-déjeuner", LUNCH: "Déjeuner", DINNER: "Dîner", SNACK: "Collation",
};

const CONFIDENCE_COLOR: Record<DetectedFood["confidence"], string> = {
  high: Colors.success,
  medium: Colors.warning,
  low: Colors.textMuted,
};

export default function VisionScreen() {
  const insets = useSafeAreaInsets();
  const { meal } = useLocalSearchParams<{ meal: MealType }>();
  const activeMeal: MealType = meal ?? "LUNCH";
  const { analyzing, logging, result, error, pickFromGallery, takePhoto, logAll, reset } = useVision(activeMeal);

  const handleConfirm = async () => {
    const ok = await logAll();
    if (ok) router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md }}>
        <TouchableOpacity onPress={() => { reset(); router.back(); }}>
          <Text style={{ color: Colors.textSecondary, fontSize: FontSize.md }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textMuted, fontSize: 11 }}>{MEAL_LABELS[activeMeal]}</Text>
          <Text style={{ color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: "700" }}>
            Analyser une photo
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: Colors.border }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
      >
        {/* État initial ou reset */}
        {!result && !analyzing && (
          <>
            <View style={{ alignItems: "center", paddingVertical: Spacing.xxl }}>
              <Text style={{ fontSize: 64, marginBottom: Spacing.lg }}>🍽️</Text>
              <Text style={{ color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: "700", textAlign: "center", marginBottom: Spacing.sm }}>
                Analyse IA de ton repas
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, textAlign: "center", lineHeight: 20 }}>
                Prends une photo de ton assiette ou choisis une image — l'IA identifie les aliments et estime les macros.
              </Text>
            </View>

            {error && (
              <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.lg, fontSize: FontSize.sm }}>
                {error}
              </Text>
            )}

            <TouchableOpacity
              onPress={takePhoto}
              style={{ backgroundColor: Colors.red, borderRadius: 14, padding: Spacing.lg, alignItems: "center", marginBottom: Spacing.md }}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>📸</Text>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.md }}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickFromGallery}
              style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: Spacing.lg, alignItems: "center", borderWidth: 1, borderColor: Colors.border }}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🖼️</Text>
              <Text style={{ color: Colors.textPrimary, fontWeight: "600", fontSize: FontSize.md }}>Galerie photos</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Analyse en cours */}
        {analyzing && (
          <View style={{ alignItems: "center", paddingVertical: Spacing.xxl }}>
            <ActivityIndicator color={Colors.violet} size="large" style={{ marginBottom: Spacing.lg }} />
            <Text style={{ color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: "600" }}>
              Analyse en cours…
            </Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.sm, textAlign: "center" }}>
              L'IA identifie les aliments et calcule les macros
            </Text>
          </View>
        )}

        {/* Résultats */}
        {result && !analyzing && (
          <>
            <View style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>Description</Text>
              <Text style={{ color: Colors.textPrimary, fontSize: FontSize.sm, lineHeight: 20 }}>
                {result.description}
              </Text>
            </View>

            {/* Totaux */}
            <View style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.violet + "55" }}>
              <Text style={{ color: Colors.violetLight, fontWeight: "700", fontSize: FontSize.sm, marginBottom: Spacing.sm }}>
                Totaux estimés
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: Colors.textPrimary, fontWeight: "800", fontSize: FontSize.md }}>{result.totalCalories}</Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 10 }}>kcal</Text>
                </View>
                {[
                  { label: "Protéines", value: result.totalProteinG, color: Colors.red },
                  { label: "Glucides", value: result.totalCarbsG, color: Colors.violet },
                  { label: "Lipides", value: result.totalFatG, color: Colors.warning },
                ].map(({ label, value, color }) => (
                  <View key={label} style={{ alignItems: "center" }}>
                    <Text style={{ color, fontWeight: "700", fontSize: FontSize.md }}>{value}g</Text>
                    <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Liste des aliments */}
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: "600", marginBottom: Spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Aliments détectés
            </Text>
            <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
              {result.foods.map((food, i) => (
                <View key={i} style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <Text style={{ color: Colors.textPrimary, fontWeight: "600", fontSize: FontSize.sm, flex: 1, marginRight: Spacing.sm }}>
                      {food.name}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: CONFIDENCE_COLOR[food.confidence] }} />
                      <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.sm }}>{food.calories} kcal</Text>
                    </View>
                  </View>
                  <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                    {food.quantityG}g · P:{food.proteinG}g · G:{food.carbsG}g · L:{food.fatG}g
                  </Text>
                </View>
              ))}
            </View>

            {error && (
              <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.lg, fontSize: FontSize.sm }}>
                {error}
              </Text>
            )}

            <TouchableOpacity
              onPress={() => { reset(); }}
              style={{ alignItems: "center", paddingVertical: Spacing.sm, marginBottom: Spacing.sm }}
            >
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>Recommencer avec une autre photo</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Bouton de confirmation fixe */}
      {result && !analyzing && (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.md, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border }}>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={logging}
            style={{ backgroundColor: Colors.red, borderRadius: 14, padding: Spacing.lg, alignItems: "center", opacity: logging ? 0.7 : 1 }}
          >
            {logging
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.md }}>
                  Ajouter {result.foods.length} aliment{result.foods.length > 1 ? "s" : ""} à {MEAL_LABELS[activeMeal]}
                </Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
