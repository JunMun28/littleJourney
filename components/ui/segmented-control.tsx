/**
 * Segmented Control Component
 *
 * A control that allows selection from a set of mutually exclusive options.
 */

import {
  View,
  Pressable,
  Text,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Typography,
  Spacing,
  Radius,
} from "@/constants/design-tokens";

export interface SegmentOption<T extends string> {
  /** Unique value for this option */
  value: T;
  /** Display label */
  label: string;
  /** Optional badge text (e.g., "Save 33%") */
  badge?: string;
}

export interface SegmentedControlProps<T extends string> {
  /** Available options */
  options: SegmentOption<T>[];
  /** Currently selected value */
  value: T;
  /** Called when selection changes */
  onValueChange: (value: T) => void;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  haptic = true,
  style,
}: SegmentedControlProps<T>) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  const handlePress = (optionValue: T) => {
    if (optionValue !== value) {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onValueChange(optionValue);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundTertiary },
        style,
      ]}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              isSelected && [
                styles.optionSelected,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => handlePress(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                { color: colors.textSecondary },
                isSelected && [
                  styles.optionTextSelected,
                  { color: colors.text },
                ],
              ]}
            >
              {option.label}
            </Text>
            {option.badge && (
              <Text style={[styles.badge, { color: Primary[500] }]}>
                {option.badge}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: Radius.sm,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    borderRadius: Radius.xs + 2,
  },
  optionSelected: {
    // backgroundColor set dynamically
  },
  optionText: {
    ...Typography.bodyMedium,
    fontSize: 15,
  },
  optionTextSelected: {
    fontWeight: "600",
  },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
