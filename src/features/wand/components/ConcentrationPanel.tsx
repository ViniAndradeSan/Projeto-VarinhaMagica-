/**
 * ConcentrationPanel — Painel de canalização da energia.
 * Exibe o nome do feitiço e o anel de progresso animado.
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { SpellDefinition } from "../types/wandState";

type Props = {
  spell: SpellDefinition;
  progress: number; // 0–1
};

const RING_SIZE = 140;
const STROKE_WIDTH = 5;
const RADIUS = (RING_SIZE - STROKE_WIDTH * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ConcentrationPanel({ spell, progress }: Props) {
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.7)).current;
  const strokeAnim  = useRef(new Animated.Value(CIRCUMFERENCE)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  // Atualiza o stroke do SVG conforme o progresso
  useEffect(() => {
    const dashOffset = CIRCUMFERENCE * (1 - progress);
    Animated.timing(strokeAnim, {
      toValue: dashOffset,
      duration: 50,
      useNativeDriver: false, // strokeDashoffset não suporta native driver
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[styles.overlay, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      pointerEvents="none"
    >
      <View style={[styles.card, { borderColor: spell.color + "55" }]}>
        {/* Anel SVG de progresso */}
        <Svg
          width={RING_SIZE}
          height={RING_SIZE}
          style={styles.ring}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        >
          {/* Trilha de fundo */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={spell.color + "22"}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progresso */}
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={spell.color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeAnim}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Emoji central */}
        <Text style={styles.emoji}>{spell.emoji}</Text>

        {/* Nome do feitiço */}
        <Text style={[styles.spellName, { color: spell.color }]}>{spell.name}</Text>

        {/* Instrução */}
        <Text style={styles.instruction}>Mantenha o dedo parado...</Text>

        {/* Porcentagem */}
        <Text style={[styles.percent, { color: spell.color }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: "rgba(8, 3, 20, 0.88)",
    borderWidth: 1,
    minWidth: 220,
  },
  ring: {
    marginBottom: 12,
  },
  emoji: {
    position: "absolute",
    top: 28 + (RING_SIZE / 2) - 22,
    fontSize: 36,
  },
  spellName: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 6,
  },
  instruction: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginBottom: 4,
  },
  percent: {
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.75,
  },
});
