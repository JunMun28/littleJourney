/**
 * Typical Age Card Component
 *
 * Displays typical developmental age range for a milestone.
 */

import { View, Text, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, SemanticColors, Spacing } from "@/constants/theme";
import {
  getTypicalAgeRange,
  isWithinTypicalRange,
} from "@/contexts/milestone-context";

interface TypicalAgeCardProps {
  templateId: string;
  childBirthDate: string;
  celebrationDate: Date;
}

export function TypicalAgeCard({
  templateId,
  childBirthDate,
  celebrationDate,
}: TypicalAgeCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const typicalRange = getTypicalAgeRange(templateId);
  if (!typicalRange) return null;

  // Calculate child age at celebration date
  const birthDate = new Date(childBirthDate);
  const childAgeMonths = Math.floor(
    (celebrationDate.getTime() - birthDate.getTime()) /
      (1000 * 60 * 60 * 24 * 30.44),
  );
  const withinRange = isWithinTypicalRange(templateId, childAgeMonths);

  return (
    <View
      testID="typical-range-card"
      style={[
        styles.typicalRangeCard,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      <Text style={[styles.typicalRangeTitle, { color: colors.text }]}>
        📈 Developmental Range
      </Text>
      <Text style={[styles.typicalRangeValue, { color: colors.textSecondary }]}>
        Typical range: {typicalRange.min}-{typicalRange.max} months
      </Text>
      <View style={styles.ageIndicatorRow}>
        <Text style={[styles.childAgeText, { color: colors.text }]}>
          Your child: {childAgeMonths} months
        </Text>
        {withinRange ? (
          <View
            style={[
              styles.rangeBadge,
              { backgroundColor: SemanticColors.success },
            ]}
          >
            <Text style={styles.rangeBadgeText}>✓ Within range</Text>
          </View>
        ) : (
          <View
            style={[
              styles.rangeBadge,
              { backgroundColor: colors.backgroundTertiary },
            ]}
          >
            <Text
              style={[styles.rangeBadgeText, { color: colors.textSecondary }]}
            >
              Outside typical range
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.typicalRangeDisclaimer, { color: colors.textMuted }]}
      >
        Every child develops at their own pace. These ranges are for reference
        only and do not indicate any concerns.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  typicalRangeCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  typicalRangeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  typicalRangeValue: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  ageIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  childAgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  rangeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rangeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  typicalRangeDisclaimer: {
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 16,
  },
});
