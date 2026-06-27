import React from "react";
import { View, StyleSheet } from "react-native";
import { Vector2 } from "../types/motion";

const SIZE = 20;

type Props = {
  position: Vector2;
};

export function WandCursor({ position }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.cursor,
        {
          left: 0,
          top: 0,
          transform: [
            { translateX: position.x - SIZE / 2 },
            { translateY: position.y - SIZE / 2 },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  cursor: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "#ffffff",
    shadowColor: "#a6e3ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
