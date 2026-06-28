import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { TrailPoint } from "../types/wandState";

type WandTrailProps = {
  trail: TrailPoint[];
  frozen?: boolean;
  color?: string;
};

export function WandTrail({ trail, frozen = false, color = "#ffffffCC" }: WandTrailProps) {
  const points = useMemo(() => (frozen ? trail : [...trail].reverse()), [trail, frozen]);

  if (points.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {points.map((point, index) => {
        // Rastro dinâmico: fade normal; rastro fixo: todos visíveis
        const progress = frozen
          ? 1
          : 1 - index / Math.max(points.length - 1, 1);

        const size = frozen ? 8 : 6 + progress * 14;
        const opacity = frozen ? 0.85 : progress * 0.55;

        return (
          <View
            key={point.id}
            style={[
              styles.dot,
              {
                left: point.x - size / 2,
                top: point.y - size / 2,
                width: size,
                height: size,
                opacity,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    borderRadius: 999,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
});
