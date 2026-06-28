import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { WandCursor } from "@/features/wand/components/WandCursor";
import { WandTrail } from "@/features/wand/components/WandTrail";
import { VoicePanel } from "@/features/wand/components/VoicePanel";
import { SpellEffect } from "@/features/wand/components/SpellEffect";
import { GestureHint } from "@/features/wand/components/GestureHint";
import { useWand } from "@/features/wand/hooks/useWand";

export default function HomeScreen() {
  const { state, onTouchStart, onTouchMove, onTouchEnd, onVoiceResult, startListening } = useWand();

  const isDrawing = state.phase === "drawing";
  const showVoice = state.phase === "recognized" || state.phase === "listening";
  const isCasting = state.phase === "casting";

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => state.phase === "idle" || state.phase === "drawing"}
      onResponderGrant={onTouchStart}
      onResponderMove={onTouchMove}
      onResponderRelease={onTouchEnd}
    >
      {/* Rastro ao vivo (durante o desenho) */}
      <WandTrail trail={state.trail} frozen={false} color="rgba(200, 180, 255, 0.8)" />

      {/* Rastro fixo (após reconhecimento) */}
      {state.frozenTrail.length > 0 && (
        <WandTrail
          trail={state.frozenTrail}
          frozen={true}
          color={state.recognizedSpell?.color ?? "#ffffff"}
        />
      )}

      {/* Cursor da bolinha */}
      <WandCursor cursor={state.cursor} visible={isDrawing} />

      {/* Efeito mágico */}
      <SpellEffect spellName={state.castEffect} />

      {/* HUD */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.title}>Varinha Mágica</Text>
        <Text style={styles.subtitle}>
          {isDrawing
            ? "Desenhando..."
            : state.phase === "idle"
            ? "Desenhe um gesto com o dedo"
            : isCasting
            ? "✨ Magia conjurada!"
            : ""}
        </Text>
      </View>

      {/* Guia de gestos (só no idle) */}
      {state.phase === "idle" && <GestureHint />}

      {/* Painel de voz */}
      {showVoice && state.recognizedSpell && (
        <VoicePanel
          spell={state.recognizedSpell}
          phase={state.phase as "recognized" | "listening"}
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
});
