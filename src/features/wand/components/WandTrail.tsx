/**
 * WandTrail — renderiza o rastro via SVG path para suavidade visual a 60fps.
 * Usa react-native-svg para path de Bézier em vez de Views circulares.
 */

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import type { TrailPoint } from "../types/wandState";
import { MAX_RENDER_POINTS } from "../constants/world";

type WandTrailProps = {
  trail: TrailPoint[];
  frozen?: boolean;
  color?: string;
  width?: number;
  height?: number;
};

/** Converte array de pontos em string de SVG path com curvas de Bézier suaves */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cx = (points[i].x + points[i + 1].x) / 2;
    const cy = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${cx} ${cy}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function WandTrail({
  trail,
  frozen = false,
  color = "rgba(200, 180, 255, 0.9)",
  width = 400,
  height = 900,
}: WandTrailProps) {
  const { pathD, gradId } = useMemo(() => {
    const trimmed =
      trail.length > MAX_RENDER_POINTS ? trail.slice(-MAX_RENDER_POINTS) : trail;
    if (trimmed.length < 2) return { pathD: "", gradId: "grad-live" };
    const pts = frozen ? trimmed : [...trimmed].reverse();
    const gradId = `grad-${frozen ? "frozen" : "live"}-${trimmed[0]?.id ?? 0}`;
    return { pathD: buildSmoothPath(pts), gradId };
  }, [trail, frozen]);

  if (!pathD) return null;

  // Extrair hex da cor para o SVG (sem alpha se vier em rgba)
  const svgColor = color.startsWith("rgba")
    ? "#" +
      color
        .match(/\d+/g)!
        .slice(0, 3)
        .map((n) => parseInt(n).toString(16).padStart(2, "0"))
        .join("")
    : color;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={svgColor} stopOpacity={frozen ? "0.9" : "0.1"} />
            <Stop offset="100%" stopColor={svgColor} stopOpacity={frozen ? "0.9" : "0.85"} />
          </LinearGradient>
        </Defs>
        {/* Halo externo */}
        <Path
          d={pathD}
          fill="none"
          stroke={svgColor}
          strokeWidth={frozen ? 12 : 16}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={frozen ? 0.18 : 0.12}
        />
        {/* Traço principal com gradiente */}
        <Path
          d={pathD}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={frozen ? 4 : 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={frozen ? 0.95 : 0.85}
        />
        {/* Brilho central */}
        <Path
          d={pathD}
          fill="none"
          stroke="white"
          strokeWidth={frozen ? 1.5 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={frozen ? 0.5 : 0.35}
        />
      </Svg>
    </View>
  );
}