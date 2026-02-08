/**
 * Animated Button Component
 *
 * A polished button with press animations, haptic feedback,
 * and multiple variants for the Little Journey design system.
 */

import { useCallback } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Primary,
  ThemeColors,
  Shadows,
  Typography,
  ButtonTokens,
} from "@/constants/design-tokens";
import { buttonPressIn, buttonPressOut } from "@/utils/animations";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  /** Button text content */
  children: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  haptic = true,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  style,
  ...rest
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const scale = useSharedValue(1);

  // Get colors based on variant and theme
  const variantColors = getVariantColors(variant, colorScheme);

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
      scale.value = buttonPressIn();
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPressIn?.(e);
    },
    [haptic, onPressIn, scale],
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) => {
      scale.value = buttonPressOut();
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sizeStyles = ButtonTokens.sizes[size];
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        {
          backgroundColor: variantColors.background,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          minHeight: sizeStyles.minHeight,
          opacity: isDisabled ? 0.5 : 1,
        },
        variant === "ghost" && styles.ghost,
        variant === "secondary" && {
          borderWidth: 1,
          borderColor: ThemeColors[colorScheme].border,
        },
        fullWidth && styles.fullWidth,
        variant !== "ghost" && Shadows.sm,
        animatedStyle,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantColors.text}
          testID="button-loading"
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              size === "sm" ? Typography.buttonSmall : Typography.button,
              { color: variantColors.text },
              leftIcon ? styles.textWithLeftIcon : undefined,
              rightIcon ? styles.textWithRightIcon : undefined,
            ]}
          >
            {children}
          </Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
}

function getVariantColors(
  variant: ButtonVariant,
  colorScheme: "light" | "dark",
) {
  const colors = ThemeColors[colorScheme];

  switch (variant) {
    case "primary":
      return {
        background: Primary[500],
        text: "#FFFFFF",
        pressedBackground: Primary[600],
      };
    case "secondary":
      return {
        background: colors.backgroundSecondary,
        text: colors.text,
        pressedBackground: colors.backgroundTertiary,
      };
    case "ghost":
      return {
        background: "transparent",
        text: Primary[500],
        pressedBackground: Primary[50],
      };
    case "danger":
      return {
        background: "#EF4444",
        text: "#FFFFFF",
        pressedBackground: "#DC2626",
      };
    default:
      return {
        background: Primary[500],
        text: "#FFFFFF",
        pressedBackground: Primary[600],
      };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  fullWidth: {
    width: "100%",
  },
  textWithLeftIcon: {
    marginLeft: 8,
  },
  textWithRightIcon: {
    marginRight: 8,
  },
});
