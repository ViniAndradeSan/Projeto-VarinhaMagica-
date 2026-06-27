import { Text, StyleSheet, View } from "react-native";

import { Screen } from "@/components/screen/screen";
import { WandCursor } from "@/features/sensors/components/WandCursor";
import { theme } from "@/styles/theme";
import { useMotion } from "@/features/sensors/hooks/useMotion";

export default function Home() {
  const { x, y } = useMotion();

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.title}>Varinha Magica</Text>
        <Text style={styles.subtitle}>Mova o celular, e conjure seu feitiço</Text>
      </View>
      <WandCursor x={x} y={y} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
  },

  subtitle: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.md,
  },
});
