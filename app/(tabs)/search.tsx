import { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Pressable,
  Image,
  useColorScheme,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useEntriesFlat } from "@/hooks/use-entries";
import { type Entry, type EntryType } from "@/contexts/entry-context";
import { PRIMARY_COLOR, Colors, Spacing, Shadows } from "@/constants/theme";
import { sortByRelevance } from "@/utils/search-relevance";

type FilterType = "all" | EntryType;
type MilestoneFilter = "all" | "milestones";

interface DateRange {
  year: number;
  month: number; // 0-11
}

// Helper to get month name
function getMonthName(month: number): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[month];
}

// Helper to format date range for display
function formatDateRange(dateRange: DateRange | null): string {
  if (!dateRange) return "Date Range";
  return `${getMonthName(dateRange.month)} ${dateRange.year}`;
}

// Generate months for selection (last 24 months)
function generateMonthOptions(): DateRange[] {
  const months: DateRange[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
    });
  }
  return months;
}

// Check if entry date falls within selected month
function isInDateRange(entryDate: string, dateRange: DateRange): boolean {
  const date = new Date(entryDate);
  return (
    date.getFullYear() === dateRange.year && date.getMonth() === dateRange.month
  );
}

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: (typeof Colors)["light"];
}

function FilterChip({ label, isActive, onPress, colors }: FilterChipProps) {
  return (
    <Pressable
      style={[
        styles.filterChip,
        { backgroundColor: colors.backgroundTertiary },
        isActive && styles.filterChipActive,
      ]}
      onPress={onPress}
    >
      <ThemedText
        style={[
          styles.filterChipText,
          { color: colors.textSecondary },
          isActive && styles.filterChipTextActive,
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface SearchResultCardProps {
  entry: Entry;
  onPress: () => void;
  colors: (typeof Colors)["light"];
}

function SearchResultCard({ entry, onPress, colors }: SearchResultCardProps) {
  return (
    <Pressable
      style={[
        styles.resultCard,
        { backgroundColor: colors.backgroundSecondary },
        Shadows.small,
      ]}
      onPress={onPress}
    >
      {entry.type === "photo" && entry.mediaUris?.[0] && (
        <Image
          source={{ uri: entry.mediaUris[0] }}
          style={styles.resultThumbnail}
        />
      )}
      {entry.type === "video" && (
        <View
          style={[
            styles.resultThumbnail,
            styles.videoPlaceholder,
            { backgroundColor: colors.backgroundTertiary },
          ]}
        >
          <ThemedText style={styles.videoIcon}>🎬</ThemedText>
        </View>
      )}
      {entry.type === "text" && (
        <View
          style={[
            styles.resultThumbnail,
            styles.textPlaceholder,
            { backgroundColor: colors.backgroundTertiary },
          ]}
        >
          <ThemedText style={styles.textIcon}>📝</ThemedText>
        </View>
      )}
      <View style={styles.resultContent}>
        <View style={styles.captionRow}>
          <ThemedText style={styles.resultCaption} numberOfLines={2}>
            {entry.caption || "No caption"}
          </ThemedText>
          {entry.milestoneId && (
            <ThemedText style={styles.milestoneIndicator}>⭐</ThemedText>
          )}
        </View>
        <ThemedText
          style={[styles.resultDate, { color: colors.textSecondary }]}
        >
          {new Date(entry.date).toLocaleDateString("en-SG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </ThemedText>
        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagRow}>
            {entry.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <ThemedText style={styles.tagText}>{tag}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const { entries } = useEntriesFlat();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [milestoneFilter, setMilestoneFilter] =
    useState<MilestoneFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | null>(null);
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const filteredEntries = useMemo(() => {
    if (!query.trim()) return [];

    // Apply type, milestone, and date filters first
    let filtered = entries;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((entry) => entry.type === filterType);
    }

    // Filter by milestone (SEARCH-005)
    if (milestoneFilter === "milestones") {
      filtered = filtered.filter((entry) => entry.milestoneId);
    }

    // Filter by date range
    if (dateRange) {
      filtered = filtered.filter((entry) =>
        isInDateRange(entry.date, dateRange),
      );
    }

    // Sort by relevance (SEARCH-007) - this also filters entries without matches
    return sortByRelevance(filtered, query);
  }, [entries, query, filterType, milestoneFilter, dateRange]);

  const handleEntryPress = useCallback(
    (entryId: string) => {
      router.push(`/entry/${entryId}`);
    },
    [router],
  );

  const handleOpenDateModal = useCallback(() => {
    setTempDateRange(dateRange);
    setShowDateModal(true);
  }, [dateRange]);

  const handleApplyDateRange = useCallback(() => {
    setDateRange(tempDateRange);
    setShowDateModal(false);
  }, [tempDateRange]);

  const handleClearDateRange = useCallback(() => {
    setDateRange(null);
    setTempDateRange(null);
    setShowDateModal(false);
  }, []);

  const renderEmptyState = () => {
    if (!query.trim()) {
      return (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            Search Your Memories
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
            Search through captions and tags to find your precious moments
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <ThemedText style={styles.emptyIcon}>😕</ThemedText>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          No Results
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
          Try different keywords or filters
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.inputBorder,
            },
          ]}
          placeholder="Search memories..."
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <FilterChip
          label="All"
          isActive={filterType === "all"}
          onPress={() => setFilterType("all")}
          colors={colors}
        />
        <FilterChip
          label="Photos"
          isActive={filterType === "photo"}
          onPress={() => setFilterType("photo")}
          colors={colors}
        />
        <FilterChip
          label="Videos"
          isActive={filterType === "video"}
          onPress={() => setFilterType("video")}
          colors={colors}
        />
        <FilterChip
          label="Text"
          isActive={filterType === "text"}
          onPress={() => setFilterType("text")}
          colors={colors}
        />
        <FilterChip
          label="Milestones"
          isActive={milestoneFilter === "milestones"}
          onPress={() =>
            setMilestoneFilter((prev) =>
              prev === "milestones" ? "all" : "milestones",
            )
          }
          colors={colors}
        />
        <FilterChip
          label={formatDateRange(dateRange)}
          isActive={dateRange !== null}
          onPress={handleOpenDateModal}
          colors={colors}
        />
      </ScrollView>

      {/* Results */}
      {filteredEntries.length > 0 ? (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultCard
              entry={item}
              onPress={() => handleEntryPress(item.id)}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Date Range Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Filter by Date
            </ThemedText>

            <ScrollView style={styles.monthList}>
              {monthOptions.map((option) => {
                const isSelected =
                  tempDateRange?.year === option.year &&
                  tempDateRange?.month === option.month;
                const testId = `month-${option.year}-${String(option.month + 1).padStart(2, "0")}`;
                return (
                  <Pressable
                    key={testId}
                    testID={testId}
                    style={[
                      styles.monthOption,
                      { borderColor: colors.border },
                      isSelected && styles.monthOptionSelected,
                    ]}
                    onPress={() => setTempDateRange(option)}
                  >
                    <ThemedText
                      style={[
                        styles.monthOptionText,
                        isSelected && styles.monthOptionTextSelected,
                      ]}
                    >
                      {getMonthName(option.month)} {option.year}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.clearButton]}
                onPress={handleClearDateRange}
              >
                <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.applyButton]}
                onPress={handleApplyDateRange}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  filterChipText: {
    fontSize: 14,
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  resultsList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  resultCard: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  resultThumbnail: {
    width: 80,
    height: 80,
  },
  videoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  videoIcon: {
    fontSize: 28,
  },
  textPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  textIcon: {
    fontSize: 28,
  },
  resultContent: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  captionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  resultCaption: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  milestoneIndicator: {
    fontSize: 14,
    marginLeft: Spacing.xs,
  },
  resultDate: {
    fontSize: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: PRIMARY_COLOR + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    color: PRIMARY_COLOR,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
  // Date range modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    maxHeight: "70%",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  monthList: {
    maxHeight: 300,
  },
  monthOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  monthOptionSelected: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  monthOptionText: {
    fontSize: 16,
  },
  monthOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  clearButtonText: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  applyButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
