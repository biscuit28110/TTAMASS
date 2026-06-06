import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors, FontSize } from "@/constants/theme";

interface Props {
  label: string;
  current: number;
  target: number;
  color: string;
  size?: number;
}

export function MacroRing({ label, current, target, color, size = 80 }: Props) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const pct = target > 0 ? Math.round((current / target) * 100) : 0;

  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={Colors.surface3} strokeWidth={6} fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={6} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Valeurs au centre */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 20, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: "800" }}>{Math.round(current)}g</Text>
        <Text style={{ color: Colors.textMuted, fontSize: 9 }}>{pct}%</Text>
      </View>
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>{label}</Text>
    </View>
  );
}
