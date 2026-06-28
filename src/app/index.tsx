/**
 * HomeScreen — Varinha Mágica v5
 * ================================
 * Tela principal. Zero sensores. Tudo via toque nativo.
 * Render: SVG trails + Animated overlays + safe area.
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useWand,
  WandCursor,
  WandTrail,
  SpellEffect,
  GestureHint,
} from "@/features/wand";

export default function HomeScreen() {
  // [M04] useWindowDimensions: reativo a rotação de tela.
  // Dimensions.get("window") é estático — não atualiza ao girar o celular.
  // useWindowDimensions re-renderiza automaticamente quando as dimensões mudam.
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const { state, onTouchStart, onTouchMove, onTouchEnd } = useWand();
  const { top } = useSafeAreaInsets();

  const isDrawing = state.phase === "drawing";
  const isCasting = state.phase === "casting";
  const isError = state.phase === "error";
  const isIdle = state.phase === "idle";

  // ── Shake + fade de erro ────────────────────────────────────────────────
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isError) return;
    errorOpacity.setValue(1);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 9,   duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9,  duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5,   duration: 35, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 30, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(errorOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [isError, state.timestamp]);

  // ── Subtítulo dinâmico ──────────────────────────────────────────────────
  const subtitle =
    isDrawing ? "Desenhando o feitiço..." :
    isCasting ? "✨ Magia conjurada!" :
    isError ? "Tente novamente." :
    isIdle ? "Desenhe um gesto com o dedo" : "";

  const confidenceLabel = isCasting
    ? `Confiança: ${Math.round(state.lastConfidence * 100)}%`
    : "";

  // [M01] expo-status-bar: o estilo muda com base na fase do app.
  // casting → light (fundo escuro com efeito brilhante)
  // error   → light (fundo vermelho escuro)
  // drawing → light (fundo escuro enquanto desenha)
  // idle    → auto  (segue o tema do sistema)
  const statusBarStyle =
    isCasting || isError || isDrawing ? "light" : "auto";

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() =>
        state.phase === "idle" ||
        state.phase === "drawing" ||
        state.phase === "casting"
      }
      onResponderGrant={onTouchStart}
      onResponderMove={onTouchMove}
      onResponderRelease={onTouchEnd}
      onResponderTerminate={onTouchEnd}
    >
      {/* ── Rastro ao vivo ──────────────────────────────────────────────── */}
      <WandTrail
        trail={state.trail}
        frozen={false}
        color="rgba(190, 160, 255, 0.9)"
        width={SCREEN_W}
        height={SCREEN_H}
      />

      {/* ── Rastro congelado (cor do feitiço) ───────────────────────────── */}
      {state.frozenTrail.length > 0 && !isError && (
        <WandTrail
          trail={state.frozenTrail}
          frozen={true}
          color={state.recognizedSpell?.color ?? "#ffffff"}
          width={SCREEN_W}
          height={SCREEN_H}
        />
      )}

      {/* ── Rastro de erro (vermelho com shake) ─────────────────────────── */}
      {isError && state.frozenTrail.length > 0 && (
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <WandTrail
            trail={state.frozenTrail}
            frozen={true}
            color="#ff3b30"
            width={SCREEN_W}
            height={SCREEN_H}
          />
        </Animated.View>
      )}

      {/* ── Cursor da varinha ────────────────────────────────────────────── */}
      <WandCursor cursor={state.cursor} visible={isDrawing} />

      {/* ── Efeito mágico ───────────────────────────────────────────────── */}
      <SpellEffect spellName={state.castEffect} />

      {/* ── HUD superior ────────────────────────────────────────────────── */}
      <View style={[styles.hud, { top: top + 14 }]} pointerEvents="none">
        <Text style={styles.title}>Varinha Mágica</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {!!confidenceLabel && (
          <Text style={styles.confidence}>{confidenceLabel}</Text>
        )}
      </View>

      {/* ── Banner de erro crítico ───────────────────────────────────────── */}
      {isError && (
        <Animated.View
          style={[styles.errorBanner, { opacity: errorOpacity }]}
          pointerEvents="none"
        >
          <Text style={styles.errorIcon}>✗</Text>
          <Text style={styles.errorTitle}>Magia Falhou</Text>
          <Text style={styles.errorSub}>
            O traçado não corresponde a nenhum feitiço conhecido.{"\n"}
            Tente com mais precisão.
          </Text>
        </Animated.View>
      )}

      {/* ── Guia de gestos ──────────────────────────────────────────────── */}
      <GestureHint visible={isIdle} />


      <StatusBar style={statusBarStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050211",
    overflow: "hidden",
  },
  hud: {
    position: "absolute",
    left: 24,
    right: 24,
  },
  title: {
    color: "#f0ebff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
  confidence: {
    color: "rgba(200,180,255,0.55)",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  errorBanner: {
    position: "absolute",
    top: "36%",
    left: 36,
    right: 36,
    backgroundColor: "rgba(255, 48, 40, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.35)",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 36,
    color: "#ff3b30",
    fontWeight: "900",
    marginBottom: 8,
  },
  errorTitle: {
    color: "#ff6b6b",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1,
  },
  errorSub: {
    color: "rgba(255,190,180,0.65)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
