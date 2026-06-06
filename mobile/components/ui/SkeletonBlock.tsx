import { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";
import { Colors } from "@/constants/theme";

interface Props { width?: number | string; height: number; borderRadius?: number; style?: ViewStyle }

export function SkeletonBlock({ width = "100%", height, borderRadius = 12, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width: width as number, height, borderRadius, backgroundColor: Colors.surface2, opacity }, style]}
    />
  );
}
