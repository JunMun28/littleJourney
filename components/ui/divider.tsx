/**
 * Divider Component
 *
 * A horizontal separator line.
 */

import { View, StyleSheet, type ViewStyle } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemeColors, Spacing } from "@/constants/design-tokens";

export interface DividerProps {
  /** Vertical margin around the divider */
  spacing?: "none" | "sm" | "md" | "lg";
  /** Additional styles */
  style?: ViewStyle;
}

const spacingValues = {
  none: 0,
  sm: Spacing.sm,
  md: Spacing.md,
  lg: Spacing.lg,
};

export function Divider({ spacing = "none", style }: DividerProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const marginValue = spacingValues[spacing];

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.border,
          marginVertical: marginValue,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
