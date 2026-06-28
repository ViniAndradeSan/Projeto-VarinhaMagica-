import { StyleSheet, Text, View } from "react-native";

// Dicionário de formas e seus gestos
const GESTURE_HINTS = [
  { name: "Lumos", shape: "○", desc: "Círculo" },
  { name: "Expelliarmus", shape: "Z", desc: "Ziguezague" },
  { name: "Alohomora", shape: "△", desc: "Triângulo" },
  { name: "Wingardium Leviosa", shape: "→", desc: "Linha horizontal" },
  { name: "Avada Kedavra", shape: "↓", desc: "Linha vertical" },
];

export function GestureHint() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.title}>Gestos</Text>
      {GESTURE_HINTS.map((h) => (
        <View key={h.name} style={styles.row}>
          <Text style={styles.shape}>{h.shape}</Text>
          <View>
            <Text style={styles.spellName}>{h.name}</Text>
            <Text style={styles.desc}>{h.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 120,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
  },
  title: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 10,
  },
  shape: {
    color: "#fff",
    fontSize: 22,
    width: 28,
    textAlign: "center",
  },
  spellName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "700",
  },
  desc: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },
});
