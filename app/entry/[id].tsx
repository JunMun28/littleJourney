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
import { useEntries } from "@/contexts/entry-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEntry } = useEntries();
  const entry = getEntry(id);

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

  if (!entry) {
    return (
      <View style={styles.notFoundContainer}>
        <ThemedText style={styles.notFoundText}>Entry not found</ThemedText>
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

  const hasMedia = entry.mediaUris && entry.mediaUris.length > 0;
  const isMultiPhoto = hasMedia && entry.mediaUris!.length > 1;

  const formattedDate = new Date(entry.date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable
          testID="back-button"
          onPress={handleBack}
          style={styles.backButton}
        >
          <ThemedText style={styles.backButtonIcon}>←</ThemedText>
        </Pressable>
        {isMultiPhoto && (
          <View testID="image-counter" style={styles.imageCounter}>
            <ThemedText style={styles.imageCounterText}>
              {activeIndex + 1}/{entry.mediaUris!.length}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Full-screen image carousel */}
      {hasMedia && (
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
          <ThemedText style={styles.date}>{formattedDate}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  notFoundText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 16,
  },
  notFoundBackButton: {
    padding: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
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
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonIcon: {
    color: "#fff",
    fontSize: 24,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  imageCounter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 14,
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    alignItems: "center",
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  detailsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  detailsContent: {
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  caption: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  date: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
});
