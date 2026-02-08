/**
 * Community Stats Card Component
 *
 * Displays community statistics for milestone completion.
 */

import { View, Text, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { PRIMARY_COLOR, Colors, Spacing } from "@/constants/theme";
import { type MilestoneStatistics } from "@/contexts/community-context";

interface CommunityStatsCardProps {
  stats: MilestoneStatistics;
}

export function CommunityStatsCard({ stats }: CommunityStatsCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.statisticsCard,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      <Text style={[styles.statisticsTitle, { color: colors.text }]}>
        📊 Community Statistics
      </Text>
      <Text style={[styles.statisticsRange, { color: colors.textSecondary }]}>
        Typical range: {stats.typicalRangeMonths.min}-
        {stats.typicalRangeMonths.max} months
      </Text>
      <View style={styles.distributionContainer}>
        {stats.distribution.map((bucket) => (
          <View key={bucket.ageMonths} style={styles.distributionBar}>
            <View
              style={[
                styles.barFill,
                {
                  height: `${bucket.percentage}%`,
                  backgroundColor: PRIMARY_COLOR,
                },
              ]}
            />
            <Text style={[styles.barLabel, { color: colors.textMuted }]}>
              {bucket.ageMonths}m
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.statisticsDisclaimer, { color: colors.textMuted }]}>
        Every child develops at their own pace. These statistics are for
        reference only.
      </Text>
      <Text style={[styles.statisticsDataPoints, { color: colors.textMuted }]}>
        Based on {stats.totalDataPoints.toLocaleString()} families
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statisticsCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statisticsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  statisticsRange: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  distributionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 60,
    marginBottom: Spacing.md,
  },
  distributionBar: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  barFill: {
    width: "80%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  statisticsDisclaimer: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  statisticsDataPoints: {
    fontSize: 11,
    textAlign: "center",
  },
});
