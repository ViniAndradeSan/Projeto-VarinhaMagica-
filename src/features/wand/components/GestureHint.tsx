/**
 * GestureHint — Guia visual dos gestos disponíveis.
 * Mostra as formas em miniatura com os nomes dos feitiços.
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Circle as SvgCircle, Polyline } from "react-native-svg";
import { SPELLS } from "../engine/spells";

type Props = { visible: boolean };

export function GestureHint({ visible }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="none">
      <Text style={styles.title}>Gestos Disponíveis</Text>
      <View style={styles.grid}>
        {SPELLS.map((spell) => (
          <View key={spell.name} style={styles.item}>
            <View style={[styles.iconBox, { borderColor: spell.color + "44" }]}>
              <ShapeIcon shape={spell.shape} color={spell.color} />
            </View>
            <Text style={[styles.spellName, { color: spell.color }]}>{spell.name}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

function ShapeIcon({ shape, color }: { shape: string; color: string }) {
  const s = 36;
  const c = s / 2;
  const pad = 5;

  switch (shape) {
    case "circle":
      return (
        <Svg width={s} height={s}>
          <SvgCircle cx={c} cy={c} r={c - pad} fill="none" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case "zigzag":
      return (
        <Svg width={s} height={s}>
          <Polyline
            points={`${pad},${pad} ${s - pad},${pad} ${pad},${s - pad} ${s - pad},${s - pad}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "triangle":
      return (
        <Svg width={s} height={s}>
          <Path
            d={`M ${c} ${pad} L ${s - pad} ${s - pad} L ${pad} ${s - pad} Z`}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "horizontal":
      return (
        <Svg width={s} height={s}>
          <Path d={`M ${pad} ${c} L ${s - pad} ${c}`} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    case "vertical":
      return (
        <Svg width={s} height={s}>
          <Path d={`M ${c} ${pad} L ${c} ${s - pad}`} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 36,
    left: 16,
    right: 16,
    backgroundColor: "rgba(6, 2, 16, 0.82)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(160, 120, 255, 0.15)",
  },
  title: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 8,
  },
  item: {
    alignItems: "center",
    width: 60,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  spellName: {
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
