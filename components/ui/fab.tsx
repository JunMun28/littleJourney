/**
 * Floating Action Button (FAB) Component
 *
 * A polished FAB with entrance animation, press feedback,
 * and haptic feedback for the Little Journey design system.
 */

import { useCallback } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  type ViewStyle,
  type PressableProps,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Primary, Shadows, ThemeColors } from "@/constants/design-tokens";
import {
  fabPressIn,
  fabPressOut,
  fabEntering,
  fabExiting,
} from "@/utils/animations";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FABSize = "sm" | "md" | "lg";
type FABVariant = "primary" | "secondary";

interface FABProps extends Omit<PressableProps, "style"> {
  /** Icon or text content (typically a "+" or icon component) */
  icon?: React.ReactNode;
  /** Optional label for extended FAB */
  label?: string;
  /** Size of the FAB */
  size?: FABSize;
  /** Visual variant */
  variant?: FABVariant;
  /** Position from bottom */
  bottom?: number;
  /** Position from right */
  right?: number;
  /** Enable entrance animation */
  animateEntrance?: boolean;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

const SIZE_MAP: Record<FABSize, { size: number; iconSize: number }> = {
  sm: { size: 44, iconSize: 24 },
  md: { size: 56, iconSize: 32 },
  lg: { size: 64, iconSize: 36 },
};

export function FAB({
  icon,
  label,
  size = "md",
  variant = "primary",
  bottom = 24,
  right = 24,
  animateEntrance = true,
  haptic = true,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: FABProps) {
  const colorScheme = useColorScheme() ?? "light";
  const scale = useSharedValue(1);

  const variantColors = getVariantColors(variant, colorScheme);
  const sizeConfig = SIZE_MAP[size];

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
      scale.value = fabPressIn();
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPressIn?.(e);
    },
    [haptic, onPressIn, scale],
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) => {
      scale.value = fabPressOut();
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isExtended = !!label;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      entering={animateEntrance ? fabEntering : undefined}
      exiting={fabExiting}
      style={[
        styles.base,
        Shadows.lg,
        {
          backgroundColor: variantColors.background,
          bottom,
          right,
          width: isExtended ? "auto" : sizeConfig.size,
          height: sizeConfig.size,
          borderRadius: isExtended ? sizeConfig.size / 2 : sizeConfig.size / 2,
          paddingHorizontal: isExtended ? 20 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
      {...rest}
    >
      {icon || (
        <Text
          style={[
            styles.defaultIcon,
            {
              fontSize: sizeConfig.iconSize,
              color: variantColors.text,
            },
          ]}
        >
          +
        </Text>
      )}
      {label && (
        <Text style={[styles.label, { color: variantColors.text }]}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

function getVariantColors(variant: FABVariant, colorScheme: "light" | "dark") {
  const colors = ThemeColors[colorScheme];

  switch (variant) {
    case "secondary":
      return {
        background: colors.card,
        text: colors.text,
      };
    case "primary":
    default:
      return {
        background: Primary[500],
        text: "#FFFFFF",
      };
  }
}

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  defaultIcon: {
    fontWeight: "400",
    marginTop: -2, // Optical adjustment for "+"
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
