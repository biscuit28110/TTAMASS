import { useRef, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Animated, Modal, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { Food } from "@/lib/api/foods";

interface Props {
  food: Food | null;
  onConfirm: (food: Food, grams: number) => void;
  onClose: () => void;
  loading?: boolean;
}

export function QuantityBottomSheet({ food, onConfirm, onClose, loading }: Props) {
  const [grams, setGrams] = useState("100");
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (food) {
      setGrams("100");
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start();
    }
  }, [food]);

  if (!food) return null;

  const qty = parseFloat(grams) || 0;
  const calories = Math.round((food.caloriesPer100g * qty) / 100);
  const protein = Math.round((food.proteinPer100g * qty) / 100 * 10) / 10;
  const carbs = Math.round((food.carbsPer100g * qty) / 100 * 10) / 10;
  const fat = Math.round((food.fatPer100g * qty) / 100 * 10) / 10;

  return (
    <Modal transparent animationType="none" visible={!!food} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} />
        <Animated.View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, transform: [{ translateY: slideAnim }] }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.surface3, alignSelf: "center", marginBottom: Spacing.lg }} />

          <Text style={{ color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: "800", marginBottom: 4 }} numberOfLines={1}>{food.name}</Text>
          {food.brand && <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.lg }}>{food.brand}</Text>}

          {/* Input quantité */}
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface2, borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
            <TextInput
              value={grams}
              onChangeText={setGrams}
              keyboardType="numeric"
              selectTextOnFocus
              style={{ flex: 1, color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: "900", textAlign: "center" }}
            />
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.lg }}>g</Text>
          </View>

          {/* Aperçu macros */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xl }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: Colors.red, fontSize: FontSize.lg, fontWeight: "800" }}>{calories}</Text>
              <Text style={{ color: Colors.textMuted, fontSize: 10 }}>kcal</Text>
            </View>
            {[["P", protein, Colors.red], ["G", carbs, Colors.violet], ["L", fat, Colors.warning]].map(([l, v, c]) => (
              <View key={String(l)} style={{ alignItems: "center" }}>
                <Text style={{ color: c as string, fontSize: FontSize.lg, fontWeight: "700" }}>{v}g</Text>
                <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{l}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={async () => {
              if (qty <= 0) return;
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onConfirm(food, qty);
            }}
            disabled={loading || qty <= 0}
            style={{ backgroundColor: Colors.red, borderRadius: 16, padding: Spacing.lg, alignItems: "center", opacity: (loading || qty <= 0) ? 0.6 : 1 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.md }}>Ajouter à mon repas</Text>}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
