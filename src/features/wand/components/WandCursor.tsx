import { StyleSheet, View } from "react-native";
import type { Vector2 } from "../types/wandState";

type WandCursorProps = {
  cursor: Vector2;
  visible: boolean;
};

export function WandCursor({ cursor, visible }: WandCursorProps) {
  if (!visible) return null;

  return (
    <View
      style={[
        styles.cursor,
        {
          left: cursor.x - 14,
          top: cursor.y - 14,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.glow} />
      <View style={styles.core} />
    </View>
  );
}

const styles = StyleSheet.create({
  cursor: {
    position: "absolute",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 245, 200, 0.2)",
  },
  core: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#ffffaa",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
});
