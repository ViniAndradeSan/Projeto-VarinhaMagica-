import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WandCursor } from "@/features/wand/components/WandCursor";
import { WandTrail } from "@/features/wand/components/WandTrail";
import { VoicePanel } from "@/features/wand/components/VoicePanel";
import { SpellEffect } from "@/features/wand/components/SpellEffect";
import { GestureHint } from "@/features/wand/components/GestureHint";
import { useWand } from "@/features/wand/hooks/useWand";

export default function HomeScreen() {
  const { state, onTouchStart, onTouchMove, onTouchEnd, onVoiceResult, startListening } = useWand();

  const isDrawing   = state.phase === "drawing";
  const showVoice   = state.phase === "recognized" || state.phase === "listening";
  const isCasting   = state.phase === "casting";
  const isError     = state.phase === "error";

  // Animação de shake para o rastro de erro
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isError) {
      errorOpacity.setValue(1);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 7, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -7, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
      // Fade out da mensagem de erro
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(errorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [isError]);

  const subtitleText = isDrawing
    ? "Desenhando..."
    : state.phase === "idle"
    ? "Desenhe um gesto com o dedo"
    : isCasting
    ? "✨ Magia conjurada!"
    : "";

  const feedbackText = state.voiceFeedback;

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => state.phase === "idle" || state.phase === "drawing"}
      onResponderGrant={onTouchStart}
      onResponderMove={onTouchMove}
      onResponderRelease={onTouchEnd}
    >
      {/* Rastro ao vivo */}
      <WandTrail trail={state.trail} frozen={false} color="rgba(200, 180, 255, 0.8)" />

      {/* Rastro congelado após reconhecimento (cor do feitiço) */}
      {state.frozenTrail.length > 0 && !isError && (
        <WandTrail
          trail={state.frozenTrail}
          frozen={true}
          color={state.recognizedSpell?.color ?? "#ffffff"}
        />
      )}

      {/* Rastro de erro — vermelho com shake */}
      {isError && state.frozenTrail.length > 0 && (
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <WandTrail trail={state.frozenTrail} frozen={true} color="#ff3b30" />
        </Animated.View>
      )}

      {/* Cursor */}
      <WandCursor cursor={state.cursor} visible={isDrawing} />

      {/* Efeito mágico */}
      <SpellEffect spellName={state.castEffect} />

      {/* HUD */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.title}>Varinha Mágica</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>
        {feedbackText ? <Text style={styles.feedback}>{feedbackText}</Text> : null}
      </View>

      {/* Banner de erro centralizado */}
      {isError && (
        <Animated.View
          style={[styles.errorBanner, { opacity: errorOpacity }]}
          pointerEvents="none"
        >
          <Text style={styles.errorIcon}>✗</Text>
          <Text style={styles.errorTitle}>Gesto não reconhecido</Text>
          <Text style={styles.errorSub}>Tente um círculo, Z, triângulo,{"\n"}linha horizontal ou vertical</Text>
        </Animated.View>
      )}

      {/* Guia de gestos */}
      {state.phase === "idle" && <GestureHint />}

      {/* Painel de voz */}
      {showVoice && state.recognizedSpell && (
        <VoicePanel
          spell={state.recognizedSpell}
          phase={state.phase as "recognized" | "listening"}
          voiceCaption={state.voiceCaption}
          onStartListening={startListening}
          onResult={onVoiceResult}
        />
      )}

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0418",
    overflow: "hidden",
  },
  hud: {
    position: "absolute",
    top: 52,
    left: 24,
    right: 24,
  },
  title: {
    color: "#f5f0ff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 20,
  },
  feedback: {
    color: "rgba(173, 209, 255, 0.95)",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  errorBanner: {
    position: "absolute",
    top: "38%",
    left: 40,
    right: 40,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.5)",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  errorSub: {
    color: "rgba(255,180,180,0.75)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});
