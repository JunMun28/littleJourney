/**
 * Skeleton Loading Component
 *
 * Animated placeholder content for loading states.
 * Provides a smooth pulse effect for better perceived performance.
 */

import { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemeColors, Radius, Spacing } from "@/constants/design-tokens";

interface SkeletonProps {
  /** Width of the skeleton (number or percentage string) */
  width?: number | `${number}%`;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  radius?: keyof typeof Radius | number;
  /** Make it circular (overrides radius) */
  circle?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility role */
  accessibilityRole?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * Basic skeleton element with pulse animation
 */
export function Skeleton({
  width = "100%",
  height = 16,
  radius = "sm",
  circle = false,
  style,
  testID,
  accessibilityRole,
  accessibilityLabel,
}: SkeletonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];
  const pulseProgress = useSharedValue(0);

  const borderRadius = circle
    ? height / 2
    : typeof radius === "number"
      ? radius
      : Radius[radius];

  useEffect(() => {
    pulseProgress.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite repeat
      true, // Reverse for smooth pulse
    );
  }, [pulseProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseProgress.value, [0, 1], [0.4, 0.8]),
  }));

  const computedWidth = typeof width === "number" ? width : width;

  return (
    <Animated.View
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: computedWidth,
          height,
          borderRadius,
          backgroundColor: colors.backgroundTertiary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * Skeleton for text lines
 */
interface SkeletonTextProps {
  /** Number of lines to show */
  lines?: number;
  /** Width of the last line (percentage) */
  lastLineWidth?: `${number}%`;
  /** Line height */
  lineHeight?: number;
  /** Gap between lines */
  gap?: number;
  /** Additional styles for container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  lineHeight = 14,
  gap = 8,
  style,
  testID,
}: SkeletonTextProps) {
  return (
    <View testID={testID} style={[styles.textContainer, { gap }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : "100%"}
          height={lineHeight}
          radius="xs"
        />
      ))}
    </View>
  );
}

/**
 * Skeleton for avatar/profile image
 */
interface SkeletonAvatarProps {
  /** Size of the avatar */
  size?: number;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function SkeletonAvatar({ size = 48, style, testID }: SkeletonAvatarProps) {
  return <Skeleton width={size} height={size} circle style={style} testID={testID} />;
}

interface SkeletonCardProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * Pre-composed skeleton for a card with image
 */
export function SkeletonCard({ testID }: SkeletonCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  return (
    <View
      testID={testID}
      style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}
    >
      {/* Image placeholder */}
      <Skeleton width="100%" height={200} radius="md" />

      {/* Content */}
      <View style={styles.cardContent}>
        <SkeletonText lines={2} lastLineWidth="80%" />

        {/* Meta row */}
        <View style={styles.cardMeta}>
          <Skeleton width={80} height={12} radius="xs" />
          <Skeleton width={60} height={12} radius="xs" />
        </View>
      </View>
    </View>
  );
}

interface SkeletonFeedProps {
  count?: number;
  testID?: string;
}

/**
 * Skeleton for entry feed
 */
export function SkeletonFeed({ count = 3, testID }: SkeletonFeedProps) {
  return (
    <View testID={testID} style={styles.feedContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

interface SkeletonStatCardProps {
  testID?: string;
}

/**
 * Skeleton for streak/goal cards
 */
export function SkeletonStatCard({ testID }: SkeletonStatCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  return (
    <View
      testID={testID}
      style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}
    >
      <View style={styles.statCardRow}>
        <Skeleton width={40} height={40} circle />
        <View style={styles.statCardInfo}>
          <Skeleton width={120} height={18} radius="sm" />
          <Skeleton
            width={80}
            height={14}
            radius="xs"
            style={{ marginTop: 4 }}
          />
        </View>
      </View>
      <Skeleton
        width="100%"
        height={8}
        radius="full"
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    flexDirection: "column",
  },
  card: {
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  cardContent: {
    padding: Spacing.lg,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  feedContainer: {
    padding: Spacing.lg,
  },
  statCard: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCardInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
});
