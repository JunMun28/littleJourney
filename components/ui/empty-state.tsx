/**
 * EmptyState Component
 *
 * Displays an empty state with Lottie illustration, title, description, and action.
 */

import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import LottieView from "lottie-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemeColors, Spacing, Typography } from "@/constants/design-tokens";
import { Button } from "./button";

interface EmptyStateProps {
  /** Lottie animation source */
  animation?: object;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button handler */
  onAction?: () => void;
  /** Whether animation should loop */
  loop?: boolean;
  /** Animation size */
  animationSize?: number;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

export function EmptyState({
  animation,
  title,
  description,
  actionLabel,
  onAction,
  loop = true,
  animationSize = 200,
  style,
  testID,
}: EmptyStateProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(400)}
      style={[styles.container, style]}
      testID={testID}
    >
      {animation && (
        <View
          style={[
            styles.animationContainer,
            { width: animationSize, height: animationSize },
          ]}
        >
          <LottieView
            source={animation}
            style={styles.animation}
            autoPlay={!reduceMotion}
            loop={loop}
            speed={reduceMotion ? 0 : 1}
          />
        </View>
      )}

      <Text
        style={[Typography.subheading, styles.title, { color: colors.text }]}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={[
            Typography.body,
            styles.description,
            { color: colors.textSecondary },
          ]}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button onPress={onAction}>{actionLabel}</Button>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing["4xl"],
  },
  animationContainer: {
    marginBottom: Spacing.xl,
  },
  animation: {
    width: "100%",
    height: "100%",
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: Spacing.md,
  },
});
