/**
 * GestureHint — Guia visual dos gestos disponíveis.
 *
 * Fluxos dos gestos:
 * - circle:     Inicia no canto inferior direito, faz o círculo no sentido anti-horário
 * - zigzag (Z): Inicia no canto superior esquerdo, faz o Z (→ diagonal ↙ →)
 * - triangle:   Inicia no topo, traço para baixo-direita, traço para a esquerda, sobe para o topo
 * - horizontal: Sempre da esquerda para a direita (ou de baixo para cima — aqui usamos L→R)
 * - vertical:   Sempre da direita para a esquerda (ou de cima para baixo — aqui usamos top→bottom)
 */

import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Polyline } from "react-native-svg";
import { SPELLS } from "../engine/spells";
import type { SpellShape } from "../types/wandState";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

type Props = { visible: boolean };

export function GestureHint({ visible }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dashAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      dashAnim.setValue(0);
      loopRef.current = Animated.loop(
        Animated.timing(dashAnim, {
          toValue: -14,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      loopRef.current = null;
    }

    return () => {
      loopRef.current?.stop();
      loopRef.current = null;
    };
  }, [visible, dashAnim]);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
  }, [visible, fadeAnim]);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
      pointerEvents="none"
    >
      <Text style={styles.title}>Gestos Disponíveis</Text>
      <View style={styles.grid}>
        {SPELLS.map((spell) => (
          <View key={spell.name} style={styles.item}>
            <View style={[styles.iconBox, { borderColor: spell.color + "44" }]}>
              <ArrowIcon
                shape={spell.shape as SpellShape}
                color={spell.color}
                dashOffset={dashAnim}
              />
            </View>
            <Text style={[styles.spellName, { color: spell.color }]}>
              {spell.name}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

type ArrowProps = {
  shape: SpellShape;
  color: string;
  dashOffset: Animated.Value;
};

function ArrowIcon({ shape, color, dashOffset }: ArrowProps) {
  const s = 36;   // tamanho total da caixa
  const c = s / 2; // centro = 18
  const pad = 5;   // margem interna

  const dashProps = {
    strokeDasharray: "6,4",
    strokeDashoffset: dashOffset,
  };

  switch (shape) {
    /**
     * CIRCLE
     * Fluxo: inicia no canto inferior direito (s-pad, s-pad),
     * percorre o arco no sentido anti-horário e volta ao ponto de partida.
     * A seta estática aponta para cima-esquerda indicando continuação do ciclo.
     */
case "circle": {
  // Centro do círculo = centro do ícone
  // Início no ponto inferior: (c, s - pad)
  const r = c - pad; // raio = 12
  const startX = c;
  const startY = s - pad;
  
  return (
    <Svg width={s} height={s}>
      <AnimatedPath
        d={[
          `M ${startX},${startY}`,
          // Sobe pela esquerda (sweep-flag = 1 indo para o topo)
          `A ${r} ${r} 0 0 1 ${c},${pad}`,
          // Desce pela direita voltando para a base
          `A ${r} ${r} 0 0 1 ${startX},${startY}`,
        ].join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        {...dashProps}
      />
      {/* Seta estática na parte inferior apontando para a esquerda 
          (indicando que o movimento começa indo para o sentido horário) */}
      <Path
        d={`M ${startX + 5},${startY - 4} L ${startX},${startY} L ${startX + 4},${startY + 5}`}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}



    /**
     * ZIGZAG (Z)
     * Fluxo: inicia no canto superior esquerdo (pad, pad),
     * vai para o canto superior direito (s-pad, pad) — traço horizontal,
     * diagonal até o canto inferior esquerdo (pad, s-pad) — traço em Z,
     * termina no canto inferior direito (s-pad, s-pad) — traço horizontal.
     * Seta estática no final (canto inferior direito) aponta para a direita.
     */
    case "zigzag":
      return (
        <Svg width={s} height={s}>
          <AnimatedPolyline
            points={`${pad},${pad} ${s - pad},${pad} ${pad},${s - pad} ${s - pad},${s - pad}`}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...dashProps}
          />
          {/* Seta no final: canto inferior direito, aponta para a direita */}
          <Path
            d={`M ${s - pad - 6},${s - pad - 4} L ${s - pad},${s - pad} L ${s - pad - 6},${s - pad + 4}`}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    /**
     * TRIANGLE
     * Fluxo: inicia no topo do triângulo (c, pad),
     * traço para baixo-direita até (s-pad, s-pad),
     * traço para a esquerda até (pad, s-pad),
     * traço diagonal subindo para fechar no topo (c, pad).
     * Seta estática no topo, apontando para cima-direita (chegando do lado esquerdo).
     */
    case "triangle":
      return (
        <Svg width={s} height={s}>
          <AnimatedPath
            d={`M ${c},${pad} L ${s - pad},${s - pad} L ${pad},${s - pad} Z`}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            {...dashProps}
          />
          {/* Seta no topo: chegando da esquerda, subindo para o ápice */}
          <Path
            d={`M ${c - 5},${pad + 6} L ${c},${pad} L ${c + 4},${pad + 5}`}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    /**
     * HORIZONTAL
     * Fluxo: sempre da esquerda para a direita (ou de baixo para cima).
     * Aqui representado como L → R (linha horizontal no centro).
     * Seta estática no final direito, apontando para a direita.
     */
    case "horizontal":
      return (
        <Svg width={s} height={s}>
          <AnimatedPath
            d={`M ${pad} ${c} L ${s - pad} ${c}`}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            {...dashProps}
          />
          {/* Seta apontando para a direita */}
          <Path
            d={`M ${s - pad - 6} ${c - 5} L ${s - pad} ${c} L ${s - pad - 6} ${c + 5}`}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    /**
     * VERTICAL
     * Fluxo: da direita para a esquerda (ou de cima para baixo).
     * Aqui representado como Top → Bottom (linha vertical no centro).
     * Seta estática no final inferior, apontando para baixo.
     */
    case "vertical":
      return (
        <Svg width={s} height={s}>
          <AnimatedPath
            d={`M ${c} ${pad} L ${c} ${s - pad}`}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            {...dashProps}
          />
          {/* Seta apontando para baixo */}
          <Path
            d={`M ${c - 5} ${s - pad - 6} L ${c} ${s - pad} L ${c + 5} ${s - pad - 6}`}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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