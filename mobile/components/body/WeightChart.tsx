import { View, Text, Dimensions } from "react-native";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";
import { Colors, FontSize, Spacing } from "@/constants/theme";

interface DataPoint { x: number; y: number; label: string }

interface Props {
  data: DataPoint[];
  height?: number;
}

const W = Dimensions.get("window").width - Spacing.lg * 2 - Spacing.lg * 2;

export function WeightChart({ data, height = 160 }: Props) {
  if (data.length < 2) return (
    <View style={{ height, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>
        Ajoute au moins 2 mesures pour voir le graphique
      </Text>
    </View>
  );

  const PAD = { top: 16, right: 8, bottom: 24, left: 40 };
  const W_inner = W - PAD.left - PAD.right;
  const H_inner = height - PAD.top - PAD.bottom;

  const minY = Math.min(...data.map((d) => d.y)) - 1;
  const maxY = Math.max(...data.map((d) => d.y)) + 1;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * W_inner;
  const toY = (v: number) => PAD.top + H_inner - ((v - minY) / (maxY - minY)) * H_inner;

  const points = data.map((d, i) => `${toX(i)},${toY(d.y)}`).join(" ");

  // Labels axe Y (3 valeurs)
  const yLabels = [minY + 0.5, (minY + maxY) / 2, maxY - 0.5];

  // Labels axe X (premier, milieu, dernier)
  const xIndices = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <Svg width={W} height={height}>
      {/* Lignes de grille */}
      {yLabels.map((v) => (
        <Line
          key={v}
          x1={PAD.left} y1={toY(v)}
          x2={W - PAD.right} y2={toY(v)}
          stroke={Colors.surface3} strokeWidth={1}
        />
      ))}

      {/* Labels Y */}
      {yLabels.map((v) => (
        <SvgText key={v} x={PAD.left - 6} y={toY(v) + 4} fontSize={10} fill={Colors.textMuted} textAnchor="end">
          {v.toFixed(1)}
        </SvgText>
      ))}

      {/* Courbe */}
      <Polyline points={points} fill="none" stroke={Colors.red} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* Points */}
      {data.map((d, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(d.y)} r={3} fill={Colors.red} />
      ))}

      {/* Labels X */}
      {xIndices.map((i) => (
        <SvgText key={i} x={toX(i)} y={height - 4} fontSize={10} fill={Colors.textMuted} textAnchor="middle">
          {new Date(data[i].label).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </SvgText>
      ))}
    </Svg>
  );
}
