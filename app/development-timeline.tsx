import { useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Svg, Line, Circle, Rect, Text as SvgText, G } from "react-native-svg";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useChild } from "@/contexts/child-context";
import {
  useMilestones,
  MILESTONE_TEMPLATES,
  type Milestone,
} from "@/contexts/milestone-context";
import { useEntries } from "@/contexts/entry-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Spacing,
  Shadows,
} from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TIMELINE_HEIGHT = 400;
const TIMELINE_MARGIN = 40;
const TIMELINE_WIDTH = SCREEN_WIDTH - TIMELINE_MARGIN * 2;

// Calculate child's age in months from birth date
function calculateAgeInMonths(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

// Calculate age at milestone date in months
function calculateMilestoneAgeInMonths(
  dateOfBirth: string,
  milestoneDate: string,
): number {
  const birth = new Date(dateOfBirth);
  const milestone = new Date(milestoneDate);
  const months =
    (milestone.getFullYear() - birth.getFullYear()) * 12 +
    (milestone.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

// Get position on timeline (0-1) for a given age in months
function getTimelinePosition(ageMonths: number, maxMonths: number): number {
  return Math.min(1, Math.max(0, ageMonths / maxMonths));
}

interface TimelinePoint {
  milestone: Milestone;
  template?: (typeof MILESTONE_TEMPLATES)[number];
  ageMonths: number;
  position: number;
  hasLinkedEntry: boolean;
}

export default function DevelopmentTimelineScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  const { child } = useChild();
  const { milestones, completedMilestones } = useMilestones();
  const { entries } = useEntries();

  // Calculate current age and determine timeline range
  const childAgeMonths = child?.dateOfBirth
    ? calculateAgeInMonths(child.dateOfBirth)
    : 12;

  // Timeline shows from 0 to max(currentAge + 6 months, 24 months) to give room for future
  const maxTimelineMonths = Math.max(24, childAgeMonths + 6);

  // Calculate timeline points for all milestones
  const timelinePoints: TimelinePoint[] = useMemo(() => {
    if (!child?.dateOfBirth) return [];

    return milestones.map((milestone) => {
      const date = milestone.celebrationDate || milestone.milestoneDate;
      const ageMonths = calculateMilestoneAgeInMonths(child.dateOfBirth, date);
      const template = MILESTONE_TEMPLATES.find(
        (t) => t.id === milestone.templateId,
      );
      const hasLinkedEntry = entries.some(
        (e) => e.milestoneId === milestone.id,
      );

      return {
        milestone,
        template,
        ageMonths,
        position: getTimelinePosition(ageMonths, maxTimelineMonths),
        hasLinkedEntry,
      };
    });
  }, [milestones, child?.dateOfBirth, maxTimelineMonths, entries]);

  // Generate age axis labels (every 3 months)
  const ageAxisLabels = useMemo(() => {
    const labels: { month: number; label: string }[] = [];
    for (let m = 0; m <= maxTimelineMonths; m += 3) {
      if (m === 0) {
        labels.push({ month: 0, label: "Birth" });
      } else if (m === 12) {
        labels.push({ month: 12, label: "1 yr" });
      } else if (m === 24) {
        labels.push({ month: 24, label: "2 yrs" });
      } else if (m === 36) {
        labels.push({ month: 36, label: "3 yrs" });
      } else {
        labels.push({ month: m, label: `${m}m` });
      }
    }
    return labels;
  }, [maxTimelineMonths]);

  const handleMilestonePress = (milestone: Milestone) => {
    // Find linked entry if exists
    const linkedEntry = entries.find((e) => e.milestoneId === milestone.id);
    if (linkedEntry) {
      router.push(`/entry/${linkedEntry.id}`);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📈</Text>
      <ThemedText type="subtitle" style={styles.emptyStateTitle}>
        No milestones yet
      </ThemedText>
      <ThemedText
        style={[styles.emptyStateText, { color: colors.textSecondary }]}
      >
        Track milestones to see them on your timeline
      </ThemedText>
      <Pressable style={styles.emptyStateButton} onPress={() => router.back()}>
        <Text style={styles.emptyStateButtonText}>Add Milestone</Text>
      </Pressable>
    </View>
  );

  const renderTimeline = () => {
    const chartPadding = 20;
    const chartHeight = TIMELINE_HEIGHT - 60;
    const lineY = chartHeight / 2;

    return (
      <View style={styles.timelineContainer} testID="development-timeline">
        <Svg
          width={TIMELINE_WIDTH}
          height={TIMELINE_HEIGHT}
          style={styles.timelineSvg}
        >
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={TIMELINE_WIDTH}
            height={TIMELINE_HEIGHT}
            fill={colorScheme === "dark" ? "#1c1c1e" : "#fafafa"}
            rx={12}
          />

          {/* Timeline axis line */}
          <Line
            x1={chartPadding}
            y1={lineY}
            x2={TIMELINE_WIDTH - chartPadding}
            y2={lineY}
            stroke={colors.border}
            strokeWidth={2}
          />

          {/* Age axis labels and tick marks */}
          <G testID="age-axis">
            {ageAxisLabels.map(({ month, label }) => {
              const x =
                chartPadding +
                (month / maxTimelineMonths) *
                  (TIMELINE_WIDTH - chartPadding * 2);
              return (
                <G key={month}>
                  <Line
                    x1={x}
                    y1={lineY - 5}
                    x2={x}
                    y2={lineY + 5}
                    stroke={colors.border}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={x}
                    y={lineY + 25}
                    fontSize={10}
                    fill={colors.textSecondary}
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                </G>
              );
            })}
          </G>

          {/* Current age marker */}
          {child?.dateOfBirth && (
            <G>
              <Line
                x1={
                  chartPadding +
                  (childAgeMonths / maxTimelineMonths) *
                    (TIMELINE_WIDTH - chartPadding * 2)
                }
                y1={lineY - 30}
                x2={
                  chartPadding +
                  (childAgeMonths / maxTimelineMonths) *
                    (TIMELINE_WIDTH - chartPadding * 2)
                }
                y2={lineY + 10}
                stroke={PRIMARY_COLOR}
                strokeWidth={2}
                strokeDasharray="4,2"
              />
              <SvgText
                x={
                  chartPadding +
                  (childAgeMonths / maxTimelineMonths) *
                    (TIMELINE_WIDTH - chartPadding * 2)
                }
                y={lineY - 35}
                fontSize={10}
                fill={PRIMARY_COLOR}
                textAnchor="middle"
                fontWeight="600"
              >
                Today
              </SvgText>
            </G>
          )}

          {/* Milestone points */}
          {timelinePoints.map((point, index) => {
            const x =
              chartPadding +
              point.position * (TIMELINE_WIDTH - chartPadding * 2);
            const isCompleted = point.milestone.isCompleted;
            const color = isCompleted
              ? SemanticColors.success
              : colors.textSecondary;

            // Offset vertically to avoid overlap
            const yOffset = (index % 3) * 25 - 25;

            return (
              <G key={point.milestone.id}>
                {/* Line connecting to axis */}
                <Line
                  x1={x}
                  y1={lineY}
                  x2={x}
                  y2={lineY - 40 + yOffset}
                  stroke={color}
                  strokeWidth={1}
                  strokeDasharray={isCompleted ? undefined : "2,2"}
                />
                {/* Milestone circle */}
                <Circle
                  cx={x}
                  cy={lineY - 50 + yOffset}
                  r={isCompleted ? 12 : 8}
                  fill={isCompleted ? color : "transparent"}
                  stroke={color}
                  strokeWidth={2}
                  onPress={() => handleMilestonePress(point.milestone)}
                />
                {/* Entry link indicator */}
                {point.hasLinkedEntry && isCompleted && (
                  <Circle cx={x} cy={lineY - 50 + yOffset} r={4} fill="white" />
                )}
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  const renderLegend = () => (
    <View style={styles.legend} testID="timeline-legend">
      <View style={styles.legendItem}>
        <View
          style={[
            styles.legendCircle,
            styles.legendCircleFilled,
            { backgroundColor: SemanticColors.success },
          ]}
        />
        <Text style={[styles.legendText, { color: colors.text }]}>
          Completed
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendCircle, { borderColor: colors.textSecondary }]}
        />
        <Text style={[styles.legendText, { color: colors.text }]}>
          Upcoming
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[
            styles.legendCircle,
            styles.legendCircleFilled,
            { backgroundColor: SemanticColors.success },
          ]}
        >
          <View style={styles.legendInnerCircle} />
        </View>
        <Text style={[styles.legendText, { color: colors.text }]}>
          With Entry
        </Text>
      </View>
    </View>
  );

  const renderMilestoneList = () => (
    <View style={styles.milestoneList}>
      <Text style={[styles.listTitle, { color: colors.text }]}>
        All Milestones ({milestones.length})
      </Text>
      {timelinePoints
        .sort((a, b) => a.ageMonths - b.ageMonths)
        .map((point) => {
          const title =
            point.milestone.customTitle ?? point.template?.title ?? "Milestone";
          const isCompleted = point.milestone.isCompleted;

          return (
            <Pressable
              key={point.milestone.id}
              style={[
                styles.listItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={() => handleMilestonePress(point.milestone)}
            >
              <View
                style={[
                  styles.listItemDot,
                  {
                    backgroundColor: isCompleted
                      ? SemanticColors.success
                      : colors.background,
                    borderColor: isCompleted
                      ? SemanticColors.success
                      : colors.textSecondary,
                  },
                ]}
              />
              <View style={styles.listItemContent}>
                <Text
                  style={[
                    styles.listItemTitle,
                    { color: colors.text },
                    !isCompleted && { opacity: 0.7 },
                  ]}
                >
                  {title}
                </Text>
                <Text
                  style={[styles.listItemAge, { color: colors.textSecondary }]}
                >
                  {point.ageMonths === 0
                    ? "Birth"
                    : point.ageMonths < 12
                      ? `${point.ageMonths} months`
                      : point.ageMonths === 12
                        ? "1 year"
                        : `${Math.floor(point.ageMonths / 12)} yr ${point.ageMonths % 12}m`}
                </Text>
              </View>
              {point.hasLinkedEntry && (
                <Text style={styles.listItemEntryBadge}>📷</Text>
              )}
              {isCompleted && (
                <Text
                  style={[
                    styles.listItemStatus,
                    { color: SemanticColors.success },
                  ]}
                >
                  ✓
                </Text>
              )}
            </Pressable>
          );
        })}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Child Info Header */}
        {child && (
          <View
            style={[
              styles.childHeader,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.childAvatar}>
              <Text style={styles.childAvatarText}>
                {child.name?.charAt(0) || "👶"}
              </Text>
            </View>
            <View style={styles.childInfo}>
              <Text style={[styles.childName, { color: colors.text }]}>
                {child.name}
              </Text>
              <Text style={[styles.childAge, { color: colors.textSecondary }]}>
                {childAgeMonths < 12
                  ? `${childAgeMonths} months old`
                  : `${Math.floor(childAgeMonths / 12)} year${Math.floor(childAgeMonths / 12) > 1 ? "s" : ""} ${childAgeMonths % 12} months old`}
              </Text>
            </View>
            <View style={styles.childStats}>
              <Text style={[styles.statNumber, { color: PRIMARY_COLOR }]}>
                {completedMilestones.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                completed
              </Text>
            </View>
          </View>
        )}

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Development Timeline
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Milestones plotted on age axis
          </Text>
        </View>

        {milestones.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderTimeline()}
            {renderLegend()}
            {renderMilestoneList()}
          </>
        )}
      </ScrollView>

      {/* Back button */}
      <Pressable
        style={[styles.backButton, Shadows.small]}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  childHeader: {
    flexDirection: "row",
    alignItems: "center",
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  childAvatarText: {
    fontSize: 24,
    color: "#fff",
  },
  childInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
  },
  childAge: {
    fontSize: 14,
    marginTop: 2,
  },
  childStats: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  timelineContainer: {
    marginHorizontal: TIMELINE_MARGIN / 2,
    marginBottom: Spacing.md,
  },
  timelineSvg: {
    borderRadius: 12,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  legendCircleFilled: {
    borderWidth: 0,
  },
  legendInnerCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  legendText: {
    fontSize: 12,
  },
  milestoneList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  listItemDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: Spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  listItemAge: {
    fontSize: 12,
    marginTop: 2,
  },
  listItemEntryBadge: {
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  listItemStatus: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    minHeight: 300,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyStateText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  emptyStateButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "#fff",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
});
