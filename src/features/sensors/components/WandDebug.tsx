import { StyleSheet, Text, View } from "react-native";

import { useAccelerometer } from "@/features/sensors/hooks/useAccelerometer";
import { theme } from "@/styles/theme";

export function WandDebug() {
  const { x, y, z } = useAccelerometer();

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Teste do acelerômetro</Text>
      <Text style={styles.value}>x: {x.toFixed(2)}</Text>
      <Text style={styles.value}>y: {y.toFixed(2)}</Text>
      <Text style={styles.value}>z: {z.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    width: "100%",
    alignItems: "center",
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.sm,
  },
  value: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.md,
    marginBottom: theme.spacing.xs,
  },
});
