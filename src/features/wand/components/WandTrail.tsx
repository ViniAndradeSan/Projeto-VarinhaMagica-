import { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import type { TrailPoint } from "../types/wandState";

type WandTrailProps = {
  trail: TrailPoint[];
};

export function WandTrail({ trail }: WandTrailProps) {
  const { width, height } = useWindowDimensions();
  const points = useMemo(() => [...trail].reverse(), [trail]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {points.map((point, index) => {
        const progress = 1 - index / Math.max(points.length - 1, 1);
        const size = 10 + progress * 22;
        const opacity = progress * 0.28;
        const left = point.x * width - size / 2;
        const top = point.y * height - size / 2;

        return (
          <View
            key={point.id}
            style={[
              styles.dot,
              {
                left,
                top,
                width: size,
                height: size,
                opacity,
                backgroundColor: `rgba(255, 235, 220, ${opacity})`,
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
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
});
