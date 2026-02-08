/**
 * Milestone Card Component
 *
 * Displays a milestone with title, description, date, and completion status.
 */

import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Colors,
  SemanticColors,
  Spacing,
} from "@/constants/theme";
import { Primary } from "@/constants/design-tokens";
import {
  MILESTONE_TEMPLATES,
  LANGUAGE_LABELS,
  type Milestone,
} from "@/contexts/milestone-context";

// Calculate days until milestone and format countdown text
function getCountdownText(milestoneDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const milestone = new Date(milestoneDate);
  milestone.setHours(0, 0, 0, 0);

  const diffTime = milestone.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else {
    return `in ${diffDays} days`;
  }
}

interface MilestoneCardProps {
  milestone: Milestone;
  onPress: (milestone: Milestone) => void;
}

export function MilestoneCard({ milestone, onPress }: MilestoneCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const template = MILESTONE_TEMPLATES.find(
    (t) => t.id === milestone.templateId,
  );
  const title = milestone.customTitle ?? template?.title ?? "Milestone";
  const description =
    milestone.customDescription ?? template?.description ?? "";
  const localTitle = template?.titleLocal;

  // SGLOCAL-002: Format first word display with language tag
  const firstWordDisplay = milestone.firstWordData
    ? `"${milestone.firstWordData.word}"${milestone.firstWordData.romanization ? ` (${milestone.firstWordData.romanization})` : ""}`
    : null;
  const languageTag = milestone.firstWordData
    ? LANGUAGE_LABELS[milestone.firstWordData.language].split(" ")[0]
    : null;

  return (
    <Card
      variant={milestone.isCompleted ? "elevated" : "default"}
      onPress={() => onPress(milestone)}
      padding="lg"
      style={styles.card}
    >
      <View style={styles.header}>
        <ThemedText type="subheading" style={styles.title}>
          {title}
          {localTitle && (
            <ThemedText style={[styles.localTitle, { color: colors.textSecondary }]}>
              {" "}
              ({localTitle})
            </ThemedText>
          )}
        </ThemedText>
        {milestone.isCompleted && (
          <View
            style={[
              styles.completedBadge,
              { backgroundColor: SemanticColors.success },
            ]}
          >
            <ThemedText type="label" style={styles.completedBadgeText}>
              Completed
            </ThemedText>
          </View>
        )}
      </View>

      {/* SGLOCAL-002: Display first word with language tag */}
      {firstWordDisplay && (
        <View style={styles.firstWordContainer}>
          <ThemedText type="bodyMedium" style={styles.firstWordText}>
            {firstWordDisplay}
          </ThemedText>
          {languageTag && (
            <View
              style={[
                styles.languageTag,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <ThemedText type="label" style={styles.languageTagText}>
                {languageTag}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {description && !firstWordDisplay && (
        <ThemedText
          type="body"
          style={[styles.description, { color: colors.textSecondary }]}
        >
          {description}
        </ThemedText>
      )}

      <ThemedText type="caption" style={[styles.date, { color: Primary[500] }]}>
        {milestone.isCompleted && milestone.celebrationDate
          ? `Celebrated: ${new Date(milestone.celebrationDate).toLocaleDateString("en-SG")}`
          : `${new Date(milestone.milestoneDate).toLocaleDateString("en-SG")} · ${getCountdownText(milestone.milestoneDate)}`}
      </ThemedText>

      {milestone.notes && (
        <ThemedText
          type="caption"
          style={[styles.notes, { color: colors.textMuted }]}
        >
          {milestone.notes}
        </ThemedText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
  },
  localTitle: {
    fontWeight: "400",
  },
  completedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: "#fff",
  },
  description: {
    marginBottom: Spacing.sm,
  },
  date: {
    fontWeight: "500",
  },
  notes: {
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  // SGLOCAL-002: First word display styles
  firstWordContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  firstWordText: {},
  languageTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageTagText: {
    textTransform: "none",
  },
});
