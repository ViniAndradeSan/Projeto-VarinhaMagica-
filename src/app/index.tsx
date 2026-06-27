import { Text, StyleSheet, View } from "react-native";

import { Screen } from "@/components/Screen";
import { WandDebug } from "@/features/sensors/components/WandDebug";
import { theme } from "@/styles/theme";

export default function Home() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Varinha Magica</Text>
        <Text style={styles.subtitle}>
          Mova o celular, e conjure seu feitiço
        </Text>
        <WandDebug />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
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