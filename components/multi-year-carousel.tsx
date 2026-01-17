import { useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, SemanticColors, Spacing } from "@/constants/theme";
import type { Memory } from "@/contexts/on-this-day-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_WIDTH = SCREEN_WIDTH - 32; // Account for padding

interface MemoryGroup {
  year: number;
  yearsAgo: number;
  memories: Memory[];
}

interface MultiYearCarouselProps {
  memoryGroups: MemoryGroup[];
  onMemoryPress: (memory: Memory) => void;
  onDismiss: () => void;
}

/**
 * OTD-003: Multi-year memories carousel
 * Shows memories grouped by year with swipeable pages.
 */
export function MultiYearCarousel({
  memoryGroups,
  onMemoryPress,
  onDismiss,
}: MultiYearCarouselProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const scrollRef = useRef<ScrollView>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(contentOffsetX / CAROUSEL_WIDTH);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < memoryGroups.length) {
        setActiveIndex(newIndex);
      }
    },
    [activeIndex, memoryGroups.length],
  );

  if (memoryGroups.length === 0) {
    return null;
  }

  const yearsAgoText = (yearsAgo: number) => {
    return yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`;
  };

  const memoriesCountText = (count: number) => {
    return count === 1 ? "1 memory" : `${count} memories`;
  };

  return (
    <View style={styles.container} testID="multi-year-carousel">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.icon}>✨</ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            On This Day
          </ThemedText>
        </View>
        <Pressable
          testID="dismiss-memories"
          style={styles.dismissButton}
          onPress={onDismiss}
          hitSlop={12}
        >
          <ThemedText style={[styles.dismissText, { color: colors.textMuted }]}>
            Dismiss
          </ThemedText>
        </Pressable>
      </View>

      {/* Swipeable years carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CAROUSEL_WIDTH}
        snapToAlignment="start"
      >
        {memoryGroups.map((group, groupIndex) => (
          <View
            key={group.year}
            style={[styles.yearPage, { width: CAROUSEL_WIDTH }]}
            testID={`year-page-${group.year}`}
          >
            {/* Year header */}
            <View style={styles.yearHeader}>
              <ThemedText style={styles.yearLabel}>
                {yearsAgoText(group.yearsAgo)}
              </ThemedText>
              {group.memories.length > 1 && (
                <ThemedText style={[styles.memoryCount, { color: colors.textMuted }]}>
                  {memoriesCountText(group.memories.length)}
                </ThemedText>
              )}
            </View>

            {/* Memories grid for this year */}
            <View style={styles.memoriesGrid}>
              {group.memories.slice(0, 4).map((memory) => (
                <Pressable
                  key={memory.id}
                  testID={`memory-card-${memory.id}`}
                  style={styles.memoryCard}
                  onPress={() => onMemoryPress(memory)}
                >
                  {memory.entry.mediaUris && memory.entry.mediaUris.length > 0 ? (
                    <Image
                      source={{ uri: memory.entry.mediaUris[0] }}
                      style={styles.memoryImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.memoryPlaceholder,
                        { backgroundColor: colors.backgroundTertiary },
                      ]}
                    >
                      <ThemedText style={styles.placeholderIcon}>✏️</ThemedText>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Year indicator dots */}
      {memoryGroups.length > 1 && (
        <View style={styles.indicators} testID="year-indicators">
          {memoryGroups.map((group, index) => (
            <View
              key={group.year}
              style={[
                styles.indicator,
                index === activeIndex
                  ? styles.indicatorActive
                  : { backgroundColor: colors.textMuted },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SemanticColors.goldLight,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  title: {
    fontWeight: "600",
  },
  dismissButton: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  dismissText: {
    fontSize: 14,
  },
  scrollView: {
    marginHorizontal: -Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  yearPage: {
    paddingRight: Spacing.lg,
  },
  yearHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  memoryCount: {
    fontSize: 14,
  },
  memoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  memoryCard: {
    borderRadius: 8,
    overflow: "hidden",
  },
  memoryImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  memoryPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 24,
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: "#333",
    width: 12,
  },
});
