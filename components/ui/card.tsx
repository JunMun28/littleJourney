/**
 * Animated Card Component
 *
 * A polished card with press animations and consistent styling
 * for the Little Journey design system.
 */

import { useCallback, type ReactNode } from "react";
import { Pressable, View, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Shadows,
  Radius,
  Spacing,
} from "@/constants/design-tokens";
import { cardPressIn, cardPressOut, Entering } from "@/utils/animations";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = "default" | "elevated" | "outlined" | "highlighted";

interface CardProps {
  /** Card content */
  children: ReactNode;
  /** Visual variant */
  variant?: CardVariant;
  /** Press handler (makes card interactive) */
  onPress?: () => void;
  /** Enable haptic feedback on press */
  haptic?: boolean;
  /** Animate entrance */
  animateEntrance?: boolean;
  /** Index for staggered entrance animation */
  enterIndex?: number;
  /** Custom padding */
  padding?: keyof typeof Spacing | number;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function Card({
  children,
  variant = "default",
  onPress,
  haptic = true,
  animateEntrance = false,
  enterIndex = 0,
  padding = "lg",
  style,
  testID,
}: CardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const scale = useSharedValue(1);

  const isInteractive = !!onPress;

  const handlePressIn = useCallback(() => {
    if (isInteractive) {
      scale.value = cardPressIn();
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [haptic, isInteractive, scale]);

  const handlePressOut = useCallback(() => {
    if (isInteractive) {
      scale.value = cardPressOut();
    }
  }, [isInteractive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const paddingValue = typeof padding === "number" ? padding : Spacing[padding];
  const variantStyles = getVariantStyles(variant, colors);

  const cardContent = (
    <View style={[styles.inner, { padding: paddingValue }]}>{children}</View>
  );

  // Non-interactive card
  if (!isInteractive) {
    const CardWrapper = animateEntrance ? Animated.View : View;
    return (
      <CardWrapper
        style={[styles.base, variantStyles, style]}
        {...(animateEntrance
          ? { entering: Entering.listItem(enterIndex) }
          : {})}
        testID={testID}
      >
        {cardContent}
      </CardWrapper>
    );
  }

  // Interactive card
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      style={[styles.base, variantStyles, animatedStyle, style]}
      entering={animateEntrance ? Entering.listItem(enterIndex) : undefined}
      testID={testID}
    >
      {cardContent}
    </AnimatedPressable>
  );
}

/**
 * Card Header component for consistent header styling
 */
interface CardHeaderProps {
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function CardHeader({ children, style, testID }: CardHeaderProps) {
  return <View testID={testID} style={[styles.header, style]}>{children}</View>;
}

/**
 * Card Footer component for actions
 */
interface CardFooterProps {
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function CardFooter({ children, style, testID }: CardFooterProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  return (
    <View
      testID={testID}
      style={[styles.footer, { borderTopColor: colors.borderLight }, style]}
    >
      {children}
    </View>
  );
}

function getVariantStyles(
  variant: CardVariant,
  colors: (typeof ThemeColors)["light"],
): ViewStyle {
  const baseStyles: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: Radius.md,
    overflow: "hidden",
  };

  switch (variant) {
    case "elevated":
      return {
        ...baseStyles,
        ...Shadows.md,
      };
    case "outlined":
      return {
        ...baseStyles,
        borderWidth: 1,
        borderColor: colors.cardBorder,
      };
    case "highlighted":
      return {
        ...baseStyles,
        borderWidth: 2,
        borderColor: colors.tint,
        ...Shadows.sm,
      };
    default:
      return {
        ...baseStyles,
        ...Shadows.sm,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  inner: {
    // Padding applied dynamically
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
});
