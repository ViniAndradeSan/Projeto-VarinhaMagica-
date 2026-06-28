/**
 * SpellEffect — Efeito visual após conjuração bem-sucedida.
 * Anéis expansivos + partículas + nome do feitiço em destaque.
 */

import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { SPELLS } from "../engine/spells";

type Props = { spellName: string | null };

export function SpellEffect({ spellName }: Props) {
  const scale1  = useRef(new Animated.Value(0)).current;
  const scale2  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse   = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const spell = SPELLS.find((s) => s.name === spellName);

  useEffect(() => {
    loopRef.current?.stop();

    if (!spellName) {
      [scale1, scale2, opacity, pulse].forEach((a) => a.setValue(0));
      return;
    }

    opacity.setValue(0);
    scale1.setValue(0);
    scale2.setValue(0);
    pulse.setValue(1);

    Animated.parallel([
      Animated.spring(scale1, { toValue: 1, friction: 3.5, tension: 60, useNativeDriver: true }),
      Animated.spring(scale2, { toValue: 1, friction: 4.5, tension: 50, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start(() => {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.07, duration: 650, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 650, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    });

    return () => loopRef.current?.stop();
  }, [spellName]);

  if (!spellName || !spell) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Anel externo expansivo */}
      <Animated.View
        style={[
          styles.ringOuter,
          {
            borderColor: spell.glowColor,
            transform: [{ scale: Animated.multiply(scale1, pulse) }],
            opacity,
          },
        ]}
      />
      {/* Anel interno */}
      <Animated.View
        style={[
          styles.ringInner,
          {
            borderColor: spell.color,
            transform: [{ scale: scale2 }],
            opacity: opacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
          },
        ]}
      />

      {/* Card do feitiço */}
      <Animated.View
        style={[styles.card, { transform: [{ scale: scale1 }], opacity }]}
      >
        <Text style={[styles.name, { color: spell.color, textShadowColor: spell.glowColor }]}>
          {spell.name}
        </Text>
        <Text style={styles.desc}>{spell.description}</Text>
      </Animated.View>

      {/* Partículas */}
      {Array.from({ length: 14 }).map((_, i) => (
        <SparkParticle key={i} index={i} color={spell.glowColor} />
      ))}
    </View>
  );
}

// ─── Partícula ────────────────────────────────────────────────────────────────

function SparkParticle({ index, color }: { index: number; color: string }) {
  const anim    = useRef(new Animated.Value(0)).current;
  const angle   = useRef((index / 14) * Math.PI * 2).current;
  const radius  = useRef(100 + (index % 4) * 28).current;

  useEffect(() => {
    const delay = (index % 5) * 110;
    const loop  = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          backgroundColor: color,
          opacity: anim,
          transform: [
            { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * radius] }) },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * radius] }) },
            { scale: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1.6, 0.15] }) },
          ],
        },
      ]}
      pointerEvents="none"
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
  },
  ringInner: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  card: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    ...Platform.select({
      ios: {
        shadowColor: "#a78bfa",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  name: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  desc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  spark: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
});
