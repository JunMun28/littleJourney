/**
 * Chip Component
 *
 * For selectable filters with toggle states and multi-select support.
 */

import { useCallback } from "react";
import { Pressable, Text, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { X, type LucideIcon } from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Spacing,
  Radius,
  FontWeight,
} from "@/constants/design-tokens";
import { buttonPressIn, buttonPressOut } from "@/utils/animations";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChipProps {
  /** Chip label */
  label: string;
  /** Selected state */
  selected?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Optional Lucide icon */
  icon?: LucideIcon;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon: IconComponent,
  dismissible = false,
  onDismiss,
  disabled = false,
  style,
  testID,
}: ChipProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = buttonPressIn();
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [disabled, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = buttonPressOut();
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chipStyles = selected
    ? {
        backgroundColor: Primary[500],
        borderColor: Primary[500],
      }
    : {
        backgroundColor: "transparent",
        borderColor: colors.border,
      };

  const textColor = selected ? "#FFFFFF" : colors.text;
  const iconColor = selected ? "#FFFFFF" : colors.icon;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.chip,
        chipStyles,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      testID={testID}
    >
      {IconComponent && (
        <IconComponent size={16} color={iconColor} style={styles.icon} />
      )}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {dismissible && (
        <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismissButton}>
          <X size={14} color={iconColor} />
        </Pressable>
      )}
    </AnimatedPressable>
  );
}

/**
 * Chip Group for multi-select behavior
 */
interface ChipGroupProps {
  /** Available options */
  options: { value: string; label: string; icon?: LucideIcon }[];
  /** Selected values */
  selected: string[];
  /** Change handler */
  onChange: (selected: string[]) => void;
  /** Allow multiple selection */
  multiSelect?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

export function ChipGroup({
  options,
  selected,
  onChange,
  multiSelect = false,
  style,
}: ChipGroupProps) {
  const handlePress = useCallback(
    (value: string) => {
      if (multiSelect) {
        if (selected.includes(value)) {
          onChange(selected.filter((v) => v !== value));
        } else {
          onChange([...selected, value]);
        }
      } else {
        onChange(selected.includes(value) ? [] : [value]);
      }
    },
    [multiSelect, onChange, selected],
  );

  return (
    <Animated.View style={[styles.group, style]}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          icon={option.icon}
          selected={selected.includes(option.value)}
          onPress={() => handlePress(option.value)}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    minHeight: 36,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  dismissButton: {
    marginLeft: Spacing.xs,
  },
  group: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
});
