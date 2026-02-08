import { View, StyleSheet } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { Flame } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { Entering } from "@/utils/animations";
import { Primary, Spacing, Radius, Shadows } from "@/constants/design-tokens";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  // Don't show if no streak yet
  if (currentStreak === 0 && longestStreak === 0) return null;

  const isOnFire = currentStreak >= 7;
  const hasStreak = currentStreak > 0;
  const streakLabel =
    currentStreak === 0
      ? "Start your streak today!"
      : currentStreak === 1
        ? "1 day streak"
        : `${currentStreak} day streak`;

  // Flame color based on streak length
  const flameColor = isOnFire
    ? "#FF6B35"
    : hasStreak
      ? Primary[500]
      : colors.textMuted;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(0)}
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary },
        Shadows.sm,
      ]}
      testID="streak-card"
    >
      <View style={styles.main}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isOnFire
                ? "#FFF0E6"
                : hasStreak
                  ? Primary[100]
                  : colors.backgroundTertiary,
            },
          ]}
        >
          <Flame
            size={28}
            color={flameColor}
            fill={isOnFire ? "#FF6B35" : undefined}
          />
        </View>
        <View style={styles.info}>
          <ThemedText type="subtitle" style={styles.label}>
            {streakLabel}
          </ThemedText>
          {longestStreak > 0 && (
            <ThemedText style={[styles.best, { color: colors.textSecondary }]}>
              Best: {longestStreak} {longestStreak === 1 ? "day" : "days"}
            </ThemedText>
          )}
        </View>
      </View>
      {currentStreak === 0 && longestStreak > 0 && (
        <ThemedText style={[styles.encourage, { color: colors.textSecondary }]}>
          Add an entry to start a new streak!
        </ThemedText>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  main: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  best: {
    fontSize: 13,
    marginTop: 2,
  },
  encourage: {
    fontSize: 13,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
