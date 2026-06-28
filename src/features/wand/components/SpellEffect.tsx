import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SPELLS } from "../engine/spells";

type SpellEffectProps = {
  spellName: string | null;
};

export function SpellEffect({ spellName }: SpellEffectProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const spell = SPELLS.find((s) => s.name === spellName);

  useEffect(() => {
    if (!spellName) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Pulsação
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    });

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [spellName]);

  if (!spellName || !spell) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Anel externo pulsante */}
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: spell.color,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            opacity: opacityAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.innerRing,
          {
            borderColor: spell.color,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />

      {/* Nome do feitiço */}
      <Animated.View
        style={[
          styles.labelWrap,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <Text style={[styles.spellName, { color: spell.color }]}>{spell.name}</Text>
        <Text style={styles.spellDesc}>{spell.description}</Text>
      </Animated.View>

      {/* Partículas simples */}
      {Array.from({ length: 12 }).map((_, i) => (
        <SparkParticle key={i} index={i} color={spell.color} />
      ))}
    </View>
  );
}

function SparkParticle({ index, color }: { index: number; color: string }) {
  const angle = (index / 12) * Math.PI * 2;
  const radius = 120 + Math.random() * 60;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.random() * 400;
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const tx = Math.cos(angle) * radius;
  const ty = Math.sin(angle) * radius;

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          backgroundColor: color,
          opacity: anim,
          transform: [
            { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, tx] }) },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, ty] }) },
            { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.5, 0.3] }) },
          ],
        },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
  },
  innerRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    opacity: 0.5,
  },
  labelWrap: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  spellName: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "rgba(255,255,255,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  spellDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 6,
  },
  spark: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
