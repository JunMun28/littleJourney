/**
 * Switch Row Component
 *
 * A settings row with a label, optional description, and a Switch control.
 */

import { View, Text, Switch, StyleSheet, type ViewStyle } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Typography,
  Spacing,
} from "@/constants/design-tokens";

export interface SwitchRowProps {
  /** Main label text */
  label: string;
  /** Optional description text below the label */
  description?: string;
  /** Current switch value */
  value: boolean;
  /** Called when switch value changes */
  onValueChange: (value: boolean) => void;
  /** Disables the switch */
  disabled?: boolean;
  /** Test ID for the switch */
  testID?: string;
  /** Show border at bottom */
  showBorder?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
}

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  testID,
  showBorder = true,
  style,
}: SwitchRowProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        showBorder && { borderBottomWidth: StyleSheet.hairlineWidth },
        { borderBottomColor: colors.border },
        style,
      ]}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: Primary[500] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  label: {
    ...Typography.body,
  },
  description: {
    ...Typography.caption,
    marginTop: 2,
  },
});
