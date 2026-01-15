import { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Pressable,
  Image,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useEntriesFlat } from "@/hooks/use-entries";
import { type Entry, type EntryType } from "@/contexts/entry-context";
import { PRIMARY_COLOR, Colors, Spacing, Shadows } from "@/constants/theme";

type FilterType = "all" | EntryType;

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
        <ThemedText style={styles.resultCaption} numberOfLines={2}>
          {entry.caption || "No caption"}
        </ThemedText>
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
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const filteredEntries = useMemo(() => {
    if (!query.trim()) return [];

    const searchLower = query.toLowerCase().trim();

    return entries.filter((entry) => {
      // Filter by type
      if (filterType !== "all" && entry.type !== filterType) {
        return false;
      }

      // Search in caption
      if (entry.caption?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in tags
      if (entry.tags?.some((tag) => tag.toLowerCase().includes(searchLower))) {
        return true;
      }

      return false;
    });
  }, [entries, query, filterType]);

  const handleEntryPress = useCallback(
    (entryId: string) => {
      router.push(`/entry/${entryId}`);
    },
    [router],
  );

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
      <View style={styles.filterRow}>
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
      </View>

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
  resultCaption: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.xs,
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
});
