import { View, StyleSheet } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { Target, Sparkles } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, SemanticColors } from "@/constants/theme";
import { Entering } from "@/utils/animations";
import { Primary, Spacing, Radius, Shadows } from "@/constants/design-tokens";

interface MonthlyGoalCardProps {
  currentCount: number;
  goalCount: number;
  isGoalMet: boolean;
  progressPercent: number;
  monthName: string;
}

export function MonthlyGoalCard({
  currentCount,
  goalCount,
  isGoalMet,
  progressPercent,
  monthName,
}: MonthlyGoalCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  const statusText = isGoalMet
    ? "Goal reached!"
    : `${currentCount} of ${goalCount} entries`;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(1)}
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary },
        isGoalMet && styles.containerComplete,
        Shadows.sm,
      ]}
      testID="monthly-goal-card"
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isGoalMet
                ? SemanticColors.successLight
                : Primary[100],
            },
          ]}
        >
          {isGoalMet ? (
            <Sparkles size={24} color={SemanticColors.success} />
          ) : (
            <Target size={24} color={Primary[500]} />
          )}
        </View>
        <View style={styles.info}>
          <ThemedText type="subtitle" style={styles.title}>
            {monthName} Goal
          </ThemedText>
          <ThemedText style={[styles.status, { color: colors.textSecondary }]}>
            {statusText}
          </ThemedText>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <ProgressBar
          value={progressPercent}
          successOnComplete
          size="md"
          style={styles.progressBar}
          testID="monthly-goal-progress"
        />
        <ThemedText style={[styles.percent, { color: colors.textSecondary }]}>
          {progressPercent}%
        </ThemedText>
      </View>
      {isGoalMet && (
        <ThemedText
          style={[styles.celebration, { color: SemanticColors.success }]}
        >
          Badge unlocked!
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
  containerComplete: {
    borderWidth: 1,
    borderColor: SemanticColors.successLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  status: {
    fontSize: 13,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
  },
  percent: {
    fontSize: 12,
    fontWeight: "500",
    minWidth: 36,
    textAlign: "right",
  },
  celebration: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
