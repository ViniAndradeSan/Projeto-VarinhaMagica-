import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import type { Vector2 } from "../types/wandState";
import { CURSOR_SIZE } from "../constants/world";

type WandCursorProps = {
  cursor: Vector2;
  visible: boolean;
};

export function WandCursor({ cursor, visible }: WandCursorProps) {
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const pulseLoop   = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 200,
        useNativeDriver: true,
      }).start();
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 500, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      Animated.timing(scaleAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          left: cursor.x - CURSOR_SIZE / 2,
          top: cursor.y - CURSOR_SIZE / 2,
        },
      ]}
    >
      {/* Anel pulsante externo */}
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] },
        ]}
      />
      {/* Ponto central */}
      <Animated.View
        style={[styles.dot, { transform: [{ scale: scaleAnim }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    borderRadius: CURSOR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(200, 170, 255, 0.7)",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#e0d0ff",
  },
});
