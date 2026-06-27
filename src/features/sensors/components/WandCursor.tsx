import React from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, SharedValue } from "react-native-reanimated";

const SIZE = 20;

type Props = {
  x: SharedValue<number>;
  y: SharedValue<number>;
};

export function WandCursor({ x, y }: Props) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - SIZE / 2 },
      { translateY: y.value - SIZE / 2 },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.cursor, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  cursor: {
    position: "absolute",
    left: 0,
    top: 0,
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