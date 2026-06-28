import { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View, Text } from "react-native";
import type { SpellState, Vector2 } from "../types/wandState";

type WandCursorProps = {
  cursor: Vector2;
  spell: SpellState | null;
};

export function WandCursor({ cursor, spell }: WandCursorProps) {
  const { width, height } = useWindowDimensions();
  const left = cursor.x * width;
  const top = cursor.y * height;
  const innerSize = 22;
  const ringSize = useMemo(() => innerSize + 16 + (spell?.alpha ?? 0) * 18, [spell]);

  return (
    <View style={[styles.cursor, { left, top, transform: [{ translateX: -ringSize / 2 }, { translateY: -ringSize / 2 }] }]}>
      <View style={[styles.ring, { width: ringSize, height: ringSize, opacity: spell?.alpha ?? 0 }]} />
      <View style={styles.core} />
      <View style={styles.glow} />
      {spell ? (
        <View style={styles.labelContainer} pointerEvents="none">
          <Text style={styles.labelText}>{spell.name}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cursor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.65)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  core: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.98)",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  labelContainer: {
    position: "absolute",
    bottom: -34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(48, 26, 98, 0.88)",
  },
  labelText: {
    color: "#f9f7ff",
    fontSize: 12,
    fontWeight: "700",
  },
});
