import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { theme } from "@/styles/theme";

type ScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
  safe?: boolean;
  statusBarStyle?: "light" | "dark" | "auto";
  padding?: boolean;
};

export function Screen({
  children,
  style,
  safe = true,
  statusBarStyle = "light",
  padding = true,
}: ScreenProps) {
  const Container = safe ? SafeAreaView : View;

  return (
    <Container style={[styles.base, padding && styles.padding, style]}>
      <StatusBar style={statusBarStyle} />
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  padding: {
    padding: theme.spacing.md,
  },
});