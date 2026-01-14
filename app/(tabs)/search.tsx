import { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  useEntries,
  type Entry,
  type EntryType,
} from "@/contexts/entry-context";
import { useThemeColor } from "@/hooks/use-theme-color";

const PRIMARY_COLOR = "#0a7ea4";

type FilterType = "all" | EntryType;

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function FilterChip({ label, isActive, onPress }: FilterChipProps) {
  return (
    <Pressable
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={onPress}
    >
      <ThemedText
        style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface SearchResultCardProps {
  entry: Entry;
  onPress: () => void;
}

function SearchResultCard({ entry, onPress }: SearchResultCardProps) {
  const textColor = useThemeColor({}, "text");

  return (
    <Pressable style={styles.resultCard} onPress={onPress}>
      {entry.type === "photo" && entry.mediaUris?.[0] && (
        <Image
          source={{ uri: entry.mediaUris[0] }}
          style={styles.resultThumbnail}
        />
      )}
      {entry.type === "video" && (
        <View style={[styles.resultThumbnail, styles.videoPlaceholder]}>
          <ThemedText style={styles.videoIcon}>🎬</ThemedText>
        </View>
      )}
      {entry.type === "text" && (
        <View style={[styles.resultThumbnail, styles.textPlaceholder]}>
          <ThemedText style={styles.textIcon}>📝</ThemedText>
        </View>
      )}
      <View style={styles.resultContent}>
        <ThemedText style={styles.resultCaption} numberOfLines={2}>
          {entry.caption || "No caption"}
        </ThemedText>
        <ThemedText style={[styles.resultDate, { color: textColor }]}>
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
  const { entries } = useEntries();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

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
          <ThemedText style={styles.emptyText}>
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
        <ThemedText style={styles.emptyText}>
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
              backgroundColor,
              color: textColor,
              borderColor: textColor + "30",
            },
          ]}
          placeholder="Search memories..."
          placeholderTextColor={textColor + "60"}
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
        />
        <FilterChip
          label="Photos"
          isActive={filterType === "photo"}
          onPress={() => setFilterType("photo")}
        />
        <FilterChip
          label="Videos"
          isActive={filterType === "video"}
          onPress={() => setFilterType("video")}
        />
        <FilterChip
          label="Text"
          isActive={filterType === "text"}
          onPress={() => setFilterType("text")}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
  },
  filterChipActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  resultsList: {
    padding: 16,
    gap: 12,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  resultThumbnail: {
    width: 80,
    height: 80,
  },
  videoPlaceholder: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  videoIcon: {
    fontSize: 28,
  },
  textPlaceholder: {
    backgroundColor: "#e8e8e8",
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
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 4,
  },
  tag: {
    backgroundColor: PRIMARY_COLOR + "20",
    paddingHorizontal: 8,
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
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
});
