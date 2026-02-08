/**
 * Modal Header Component
 *
 * Reusable header for modals with cancel/title/action pattern.
 */

import {
  View,
  Pressable,
  Text,
  StyleSheet,
  type ViewStyle,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Typography,
  Spacing,
} from "@/constants/design-tokens";

export interface ModalHeaderProps {
  /** Modal title */
  title: string;
  /** Called when cancel/close is pressed */
  onClose: () => void;
  /** Called when action button is pressed */
  onAction?: () => void;
  /** Label for the action button */
  actionLabel?: string;
  /** Disables the action button */
  actionDisabled?: boolean;
  /** Visual variant for the action button */
  variant?: "default" | "destructive";
  /** Additional container styles */
  style?: ViewStyle;
}

export function ModalHeader({
  title,
  onClose,
  onAction,
  actionLabel = "Save",
  actionDisabled = false,
  variant = "default",
  style,
}: ModalHeaderProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  const actionColor =
    variant === "destructive"
      ? "#EF4444"
      : actionDisabled
        ? colors.textMuted
        : Primary[500];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
        style,
      ]}
    >
      <Pressable onPress={onClose} hitSlop={8}>
        <Text style={[styles.cancelText, { color: Primary[500] }]}>Cancel</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {onAction ? (
        <Pressable onPress={onAction} disabled={actionDisabled} hitSlop={8}>
          <Text
            style={[
              styles.actionText,
              { color: actionColor },
              actionDisabled && styles.actionDisabled,
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelText: {
    ...Typography.body,
    minWidth: 50,
  },
  title: {
    ...Typography.bodySemibold,
    fontSize: 17,
  },
  actionText: {
    ...Typography.bodySemibold,
    minWidth: 50,
    textAlign: "right",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  placeholder: {
    minWidth: 50,
  },
});
