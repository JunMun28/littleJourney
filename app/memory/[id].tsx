import { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { VideoPlayer } from "@/components/video-player";
import { useOnThisDay } from "@/contexts/on-this-day-context";
import {
  PRIMARY_COLOR,
  SemanticColors,
  ViewerColors,
  Spacing,
} from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Memory detail screen - "Full memory experience" for OTD-002
 * Shows a past memory with context about how many years ago it was.
 */
export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMemory, dismissMemory } = useOnThisDay();

  const memory = id ? getMemory(id) : undefined;

  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    },
    [activeIndex],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleDismiss = useCallback(() => {
    if (id) {
      dismissMemory(id);
      router.back();
    }
  }, [id, dismissMemory]);

  const handleViewEntry = useCallback(() => {
    if (memory) {
      router.push(`/entry/${memory.entry.id}`);
    }
  }, [memory]);

  // Not found state
  if (!memory) {
    return (
      <View style={styles.notFoundContainer}>
        <ThemedText style={styles.notFoundText}>Memory not found</ThemedText>
        <Pressable
          testID="back-button"
          onPress={handleBack}
          style={styles.notFoundBackButton}
        >
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const { entry, yearsAgo } = memory;
  const hasMedia = entry.mediaUris && entry.mediaUris.length > 0;
  const isVideo = entry.type === "video";
  const isMultiPhoto = hasMedia && !isVideo && entry.mediaUris!.length > 1;

  const formattedDate = new Date(entry.date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const yearsAgoText = yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with back button and dismiss */}
      <View style={styles.header}>
        <Pressable
          testID="back-button"
          onPress={handleBack}
          style={styles.backButton}
        >
          <ThemedText style={styles.backButtonIcon}>←</ThemedText>
        </Pressable>
        <View style={styles.headerRight}>
          {isMultiPhoto && (
            <View testID="image-counter" style={styles.imageCounter}>
              <ThemedText style={styles.imageCounterText}>
                {activeIndex + 1}/{entry.mediaUris!.length}
              </ThemedText>
            </View>
          )}
          <Pressable
            testID="dismiss-memory-button"
            onPress={handleDismiss}
            style={styles.dismissButton}
          >
            <ThemedText style={styles.dismissButtonText}>Dismiss</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Memory context banner */}
      <View style={styles.memoryBanner} testID="memory-banner">
        <ThemedText style={styles.memoryBannerIcon}>✨</ThemedText>
        <View>
          <ThemedText style={styles.memoryBannerTitle}>On This Day</ThemedText>
          <ThemedText style={styles.memoryBannerSubtitle}>
            {yearsAgoText} - {formattedDate}
          </ThemedText>
        </View>
      </View>

      {/* Full-screen video player */}
      {hasMedia && isVideo && (
        <View style={styles.videoContainer}>
          <VideoPlayer
            uri={entry.mediaUris![0]}
            aspectRatio={(SCREEN_HEIGHT * 0.6) / SCREEN_WIDTH}
            showControls={true}
          />
        </View>
      )}

      {/* Full-screen image carousel */}
      {hasMedia && !isVideo && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.imageScrollView}
          contentContainerStyle={styles.imageScrollContent}
        >
          {entry.mediaUris!.map((uri, index) => (
            <Image
              key={`${uri}-${index}`}
              source={{ uri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          ))}
        </ScrollView>
      )}

      {/* Caption and details overlay */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailsContent}>
          {entry.caption && (
            <ThemedText style={styles.caption}>{entry.caption}</ThemedText>
          )}
          {entry.createdByName && (
            <ThemedText style={styles.createdBy}>
              Posted by {entry.createdByName}
            </ThemedText>
          )}

          {/* View full entry button */}
          <Pressable
            testID="view-entry-button"
            style={styles.viewEntryButton}
            onPress={handleViewEntry}
          >
            <ThemedText style={styles.viewEntryButtonText}>
              View Full Entry
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ViewerColors.background,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ViewerColors.background,
  },
  notFoundText: {
    color: ViewerColors.text,
    fontSize: 18,
    marginBottom: Spacing.lg,
  },
  notFoundBackButton: {
    padding: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: ViewerColors.buttonBackground,
    borderRadius: Spacing.sm,
  },
  backButtonText: {
    color: ViewerColors.text,
    fontSize: 16,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonIcon: {
    color: ViewerColors.text,
    fontSize: 24,
  },
  imageCounter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    backgroundColor: ViewerColors.overlay,
    borderRadius: Spacing.lg,
  },
  imageCounterText: {
    color: ViewerColors.text,
    fontSize: 14,
  },
  dismissButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: ViewerColors.overlay,
    borderRadius: Spacing.lg,
  },
  dismissButtonText: {
    color: ViewerColors.text,
    fontSize: 14,
  },
  memoryBanner: {
    position: "absolute",
    top: 110,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SemanticColors.goldLight,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    gap: Spacing.md,
  },
  memoryBannerIcon: {
    fontSize: 24,
  },
  memoryBannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  memoryBannerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 170,
  },
  imageScrollView: {
    flex: 1,
    marginTop: 170,
  },
  imageScrollContent: {
    alignItems: "center",
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
  },
  detailsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  detailsContent: {
    padding: Spacing.lg,
    backgroundColor: ViewerColors.overlayStrong,
  },
  caption: {
    color: ViewerColors.text,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  createdBy: {
    color: ViewerColors.textMuted,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  viewEntryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.sm,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  viewEntryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
