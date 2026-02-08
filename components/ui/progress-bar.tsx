/**
 * Animated Progress Bar Component
 *
 * A smooth, animated progress bar for the Little Journey design system.
 * Used for monthly goals, upload progress, storage usage, etc.
 */

import { useEffect } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Primary, Semantic, ThemeColors } from "@/constants/design-tokens";
import { SPRING_GENTLE } from "@/utils/animations";

type ProgressVariant = "primary" | "success" | "warning" | "error";
type ProgressSize = "sm" | "md" | "lg";

interface ProgressBarProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Visual variant */
  variant?: ProgressVariant;
  /** Auto-switch to success variant when complete */
  successOnComplete?: boolean;
  /** Size preset */
  size?: ProgressSize;
  /** Show track background */
  showTrack?: boolean;
  /** Animate changes */
  animated?: boolean;
  /** Additional styles for container */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

const SIZE_MAP: Record<ProgressSize, number> = {
  sm: 4,
  md: 8,
  lg: 12,
};

export function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  successOnComplete = false,
  size = "md",
  showTrack = true,
  animated = true,
  style,
  testID,
}: ProgressBarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const progress = useSharedValue(0);

  // Clamp and normalize progress
  const normalizedValue = Math.max(0, Math.min(value, max));
  const percentage = (normalizedValue / max) * 100;

  // Determine color based on variant and completion
  const isComplete = percentage >= 100;
  const activeVariant = successOnComplete && isComplete ? "success" : variant;
  const fillColor = getVariantColor(activeVariant);

  // Animate progress changes
  useEffect(() => {
    if (animated) {
      progress.value = withSpring(percentage, {
        ...SPRING_GENTLE,
        stiffness: 80, // Slower for progress bars
      });
    } else {
      progress.value = percentage;
    }
  }, [percentage, animated, progress]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const height = SIZE_MAP[size];
  const borderRadius = height / 2;

  return (
    <View
      style={[
        styles.container,
        { height, borderRadius },
        showTrack && { backgroundColor: colors.backgroundTertiary },
        style,
      ]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max,
        now: normalizedValue,
      }}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: fillColor, borderRadius },
          animatedFillStyle,
        ]}
      />
    </View>
  );
}

/**
 * Circular Progress indicator
 * For smaller inline progress indicators
 */
interface CircularProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Size of the circle */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  variant?: ProgressVariant;
  /** Show percentage text */
  showLabel?: boolean;
}

export function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  variant = "primary",
}: CircularProgressProps) {
  // Circular progress would need react-native-svg
  // This is a placeholder that shows a mini bar version
  return (
    <View style={{ width: size, height: size, justifyContent: "center" }}>
      <ProgressBar
        value={value}
        variant={variant}
        size="sm"
        style={{ width: size }}
      />
    </View>
  );
}

function getVariantColor(variant: ProgressVariant): string {
  switch (variant) {
    case "success":
      return Semantic.success;
    case "warning":
      return Semantic.warning;
    case "error":
      return Semantic.error;
    case "primary":
    default:
      return Primary[500];
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
