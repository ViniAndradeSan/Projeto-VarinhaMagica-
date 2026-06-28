import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { WandCursor } from "@/features/wand/components/WandCursor";
import { WandTrail } from "@/features/wand/components/WandTrail";
import { useWand } from "@/features/wand/hooks/useWand";

export default function HomeScreen() {
  const state = useWand();

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <WandTrail trail={state.trail} />
      <WandCursor cursor={state.cursor} spell={state.spell} />
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.title}>Varinha Mágica</Text>
        <Text style={styles.subtitle}>Balance o pulso para desenhar feitiços.</Text>
        {state.spell ? <Text style={styles.spellText}>{state.spell.name}</Text> : null}
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#14082A",
    overflow: "hidden",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#14082A",
  },
  hud: {
    position: "absolute",
    top: 48,
    left: 24,
    right: 24,
  },
  title: {
    color: "#fbf7ff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 20,
  },
  spellText: {
    marginTop: 18,
    alignSelf: "flex-start",
    color: "#fbe8a6",
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
