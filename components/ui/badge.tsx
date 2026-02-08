/**
 * Badge Component
 *
 * For streaks, achievements, and status indicators with animated entrance.
 */

import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import Animated, { ZoomIn, useReducedMotion } from "react-native-reanimated";
import { type LucideIcon } from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Primary,
  Secondary,
  Semantic,
  Accent,
  Neutral,
  Spacing,
  Radius,
  FontWeight,
} from "@/constants/design-tokens";

type BadgeVariant = "primary" | "success" | "warning" | "gold" | "neutral";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  /** Badge text content */
  children: string;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size preset */
  size?: BadgeSize;
  /** Optional Lucide icon */
  icon?: LucideIcon;
  /** Animate entrance */
  animate?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

export function Badge({
  children,
  variant = "primary",
  size = "md",
  icon: IconComponent,
  animate = true,
  style,
  testID,
}: BadgeProps) {
  const colorScheme = useColorScheme() ?? "light";
  const reduceMotion = useReducedMotion();
  const variantStyles = getVariantStyles(variant, colorScheme);
  const sizeStyles = getSizeStyles(size);

  const Wrapper = animate && !reduceMotion ? Animated.View : View;
  const enteringAnimation =
    animate && !reduceMotion ? ZoomIn.springify().damping(12) : undefined;

  return (
    <Wrapper
      entering={enteringAnimation}
      style={[
        styles.badge,
        variantStyles.container,
        sizeStyles.container,
        style,
      ]}
      testID={testID}
    >
      {IconComponent && (
        <IconComponent
          size={sizeStyles.iconSize}
          color={variantStyles.textColor}
          style={styles.icon}
        />
      )}
      <Text style={[sizeStyles.text, { color: variantStyles.textColor }]}>
        {children}
      </Text>
    </Wrapper>
  );
}

function getVariantStyles(
  variant: BadgeVariant,
  colorScheme: "light" | "dark",
) {
  const isDark = colorScheme === "dark";

  const variants = {
    primary: {
      container: {
        backgroundColor: isDark ? Primary[400] : Primary[500],
      } as ViewStyle,
      textColor: "#FFFFFF",
    },
    success: {
      container: {
        backgroundColor: isDark ? Secondary[400] : Secondary[500],
      } as ViewStyle,
      textColor: "#FFFFFF",
    },
    warning: {
      container: {
        backgroundColor: isDark ? Semantic.warning : Semantic.warning,
      } as ViewStyle,
      textColor: "#FFFFFF",
    },
    gold: {
      container: {
        backgroundColor: Accent.gold,
      } as ViewStyle,
      textColor: "#FFFFFF",
    },
    neutral: {
      container: {
        backgroundColor: isDark ? Neutral[700] : Neutral[200],
      } as ViewStyle,
      textColor: isDark ? Neutral[200] : Neutral[700],
    },
  };

  return variants[variant];
}

function getSizeStyles(size: BadgeSize) {
  const sizes = {
    sm: {
      container: {
        paddingVertical: 2,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radius.xs,
      } as ViewStyle,
      text: {
        fontSize: 10,
        fontWeight: FontWeight.semibold,
      },
      iconSize: 10,
    },
    md: {
      container: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radius.sm,
      } as ViewStyle,
      text: {
        fontSize: 12,
        fontWeight: FontWeight.semibold,
      },
      iconSize: 12,
    },
    lg: {
      container: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.sm,
      } as ViewStyle,
      text: {
        fontSize: 14,
        fontWeight: FontWeight.semibold,
      },
      iconSize: 14,
    },
  };

  return sizes[size];
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 4,
  },
});
