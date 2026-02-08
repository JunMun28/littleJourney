import { useState } from "react";
import { View, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useOnThisDay, type Memory } from "@/contexts/on-this-day-context";
import { Colors, PRIMARY_COLOR } from "@/constants/theme";
import { Entering } from "@/utils/animations";
import {
  Primary,
  Secondary,
  Spacing,
  Radius,
  Shadows,
} from "@/constants/design-tokens";

interface OnThisDayCardProps {
  memories: Memory[];
  onPress: (memory: Memory) => void;
  onDismiss: (memoryId: string) => void;
}

function yearsAgoText(yearsAgo: number): string {
  return yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`;
}

export function OnThisDayCard({
  memories,
  onPress,
  onDismiss,
}: OnThisDayCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();
  const { getMemoriesByYear } = useOnThisDay();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  if (memories.length === 0) return null;

  const memoryGroups = getMemoriesByYear();
  const hasMultipleYears = memoryGroups.length > 1;

  const activeYear = selectedYear ?? memoryGroups[0]?.year ?? null;
  const activeGroup = memoryGroups.find((g) => g.year === activeYear);
  const activeMemories = activeGroup?.memories ?? memories;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(2)}
      style={styles.container}
      testID="on-this-day-card"
    >
      <LinearGradient
        colors={[Primary[100], Secondary[100], "#FFF5E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconContainer}>
              <Sparkles size={20} color={Primary[500]} />
            </View>
            <ThemedText type="subtitle" style={styles.title}>
              On This Day
            </ThemedText>
          </View>
          <Pressable
            testID="dismiss-all-memories"
            style={styles.dismiss}
            onPress={() => memories.forEach((m) => onDismiss(m.id))}
            hitSlop={12}
          >
            <ThemedText
              style={[styles.dismissText, { color: colors.textMuted }]}
            >
              Dismiss
            </ThemedText>
          </Pressable>
        </View>

        {hasMultipleYears && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.yearTabsContainer}
            contentContainerStyle={styles.yearTabsContent}
            testID="year-tabs"
          >
            {memoryGroups.map((group) => {
              const isActive = group.year === activeYear;
              return (
                <Pressable
                  key={group.year}
                  onPress={() => setSelectedYear(group.year)}
                  style={[
                    styles.yearTab,
                    {
                      backgroundColor: isActive
                        ? PRIMARY_COLOR
                        : colors.backgroundSecondary,
                    },
                  ]}
                  testID={`year-tab-${group.year}`}
                >
                  <ThemedText
                    style={[
                      styles.yearTabText,
                      isActive && styles.yearTabTextActive,
                    ]}
                  >
                    {yearsAgoText(group.yearsAgo)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <ThemedText style={styles.subtitle}>
          {hasMultipleYears
            ? `${activeMemories.length} ${activeMemories.length === 1 ? "memory" : "memories"} from ${activeGroup?.yearsAgo ?? 1} ${activeGroup?.yearsAgo === 1 ? "year" : "years"} ago`
            : memories.length === 1
              ? "A memory from the past"
              : `${memories.length} memories from the past`}
        </ThemedText>

        <View style={styles.memories}>
          {activeMemories.slice(0, 3).map((memory) => (
            <Pressable
              key={memory.id}
              style={styles.memory}
              onPress={() => onPress(memory)}
              testID={`memory-item-${memory.id}`}
            >
              {memory.entry.mediaUris && memory.entry.mediaUris.length > 0 ? (
                <Image
                  source={{ uri: memory.entry.mediaUris[0] }}
                  style={styles.image}
                />
              ) : (
                <View
                  style={[
                    styles.textPlaceholder,
                    { backgroundColor: colors.backgroundTertiary },
                  ]}
                >
                  <ThemedText style={styles.placeholderIcon}>✏️</ThemedText>
                </View>
              )}
              {!hasMultipleYears && (
                <ThemedText style={styles.yearsText}>
                  {yearsAgoText(memory.yearsAgo)}
                </ThemedText>
              )}
            </Pressable>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadows.md,
  },
  gradient: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  title: {
    fontWeight: "600",
  },
  dismiss: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dismissText: {
    fontSize: 14,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 12,
  },
  yearTabsContainer: {
    marginBottom: 8,
    marginHorizontal: -4,
  },
  yearTabsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  yearTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  yearTabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  yearTabTextActive: {
    color: "#fff",
  },
  memories: {
    flexDirection: "row",
    gap: 12,
  },
  memory: {
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  textPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  placeholderIcon: {
    fontSize: 24,
  },
  yearsText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
