import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRef } from "react";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { FoodEntry } from "@/hooks/use-nutrition";

interface Props {
  entry: FoodEntry;
  onDelete: (id: string) => void;
}

export function FoodEntryRow({ entry, onDelete }: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = (_: unknown, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0.8], extrapolate: "clamp" });
    return (
      <TouchableOpacity
        onPress={async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          swipeRef.current?.close();
          onDelete(entry.id);
        }}
        style={{ width: 80, backgroundColor: Colors.error, justifyContent: "center", alignItems: "center", borderRadius: 12, marginLeft: Spacing.sm }}
      >
        <Animated.Text style={{ color: "#fff", fontWeight: "700", transform: [{ scale }] }}>🗑</Animated.Text>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface2, borderRadius: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: "600" }} numberOfLines={1}>{entry.food.name}</Text>
          {entry.food.brand && <Text style={{ color: Colors.textMuted, fontSize: 11 }}>{entry.food.brand}</Text>}
          <Text style={{ color: Colors.textMuted, fontSize: 11, marginTop: 2 }}>
            {entry.food.unit === "ML"
              ? entry.quantityG >= 1000
                ? `${(entry.quantityG / 1000).toFixed(1).replace(".", ",")} L`
                : `${entry.quantityG} ml`
              : `${entry.quantityG} g`
            } · P:{Math.round(entry.proteinG)}g G:{Math.round(entry.carbsG)}g L:{Math.round(entry.fatG)}g
          </Text>
        </View>
        <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.sm }}>{Math.round(entry.calories)} kcal</Text>
      </View>
    </Swipeable>
  );
}
