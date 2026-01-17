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
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

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
 * OTD-004: Create Then vs Now comparisons
 */
export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMemory, dismissMemory, createThenVsNow } = useOnThisDay();

  const memory = id ? getMemory(id) : undefined;

  const [activeIndex, setActiveIndex] = useState(0);

  // OTD-004: Then vs Now state
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const [currentPhotoUri, setCurrentPhotoUri] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [caption, setCaption] = useState("");
  const [showSavedMessage, setShowSavedMessage] = useState(false);

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

  // OTD-004: Then vs Now handlers
  const handleCreateThenVsNow = useCallback(() => {
    setShowPhotoSourceModal(true);
  }, []);

  const handleCancelPhotoSource = useCallback(() => {
    setShowPhotoSourceModal(false);
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setCurrentPhotoUri(result.assets[0].uri);
      setShowPhotoSourceModal(false);
      setShowComparison(true);
    }
  }, []);

  const handleChooseFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Media library permission is required.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setCurrentPhotoUri(result.assets[0].uri);
      setShowPhotoSourceModal(false);
      setShowComparison(true);
    }
  }, []);

  const handleCancelComparison = useCallback(() => {
    setShowComparison(false);
    setCurrentPhotoUri(null);
    setCaption("");
  }, []);

  const handleSaveComparison = useCallback(() => {
    if (!id || !currentPhotoUri) return;

    createThenVsNow({
      memoryId: id,
      currentPhotoUri,
      caption: caption || undefined,
    });

    setShowSavedMessage(true);
    setTimeout(() => {
      setShowSavedMessage(false);
      setShowComparison(false);
      setCurrentPhotoUri(null);
      setCaption("");
    }, 2000);
  }, [id, currentPhotoUri, caption, createThenVsNow]);

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

          {/* Action buttons */}
          <View style={styles.actionButtons}>
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

            {/* OTD-004: Then vs Now button - only for photos */}
            {hasMedia && !isVideo && (
              <Pressable
                testID="then-vs-now-button"
                style={styles.thenVsNowButton}
                onPress={handleCreateThenVsNow}
              >
                <ThemedText style={styles.thenVsNowButtonText}>
                  📸 Create Then vs Now
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* OTD-004: Photo Source Modal */}
      <Modal
        visible={showPhotoSourceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelPhotoSource}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoSourceModal}>
            <ThemedText style={styles.photoSourceTitle}>
              Add Current Photo
            </ThemedText>
            <ThemedText style={styles.photoSourceSubtitle}>
              Take or select a photo to compare with the memory
            </ThemedText>

            <Pressable
              testID="take-photo-button"
              style={styles.photoSourceOption}
              onPress={handleTakePhoto}
            >
              <ThemedText style={styles.photoSourceOptionIcon}>📷</ThemedText>
              <ThemedText style={styles.photoSourceOptionText}>
                Take Photo
              </ThemedText>
            </Pressable>

            <Pressable
              testID="choose-library-button"
              style={styles.photoSourceOption}
              onPress={handleChooseFromLibrary}
            >
              <ThemedText style={styles.photoSourceOptionIcon}>🖼️</ThemedText>
              <ThemedText style={styles.photoSourceOptionText}>
                Choose from Library
              </ThemedText>
            </Pressable>

            <Pressable
              testID="cancel-photo-source-button"
              style={styles.cancelButton}
              onPress={handleCancelPhotoSource}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* OTD-004: Then vs Now Comparison Modal */}
      <Modal
        visible={showComparison}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCancelComparison}
      >
        <View style={styles.comparisonContainer} testID="then-vs-now-preview">
          <StatusBar barStyle="light-content" />

          {/* Header */}
          <View style={styles.comparisonHeader}>
            <Pressable
              testID="cancel-comparison-button"
              onPress={handleCancelComparison}
              style={styles.comparisonCancelButton}
            >
              <ThemedText style={styles.comparisonCancelText}>✕</ThemedText>
            </Pressable>
            <ThemedText style={styles.comparisonTitle}>Then vs Now</ThemedText>
            <View style={{ width: 44 }} />
          </View>

          {/* Side by side photos */}
          <View style={styles.comparisonPhotos}>
            <View style={styles.comparisonPhotoWrapper}>
              <ThemedText style={styles.comparisonLabel}>Then</ThemedText>
              <Image
                source={{ uri: entry.mediaUris?.[0] }}
                style={styles.comparisonPhoto}
                resizeMode="cover"
              />
              <ThemedText style={styles.comparisonDate}>
                {formattedDate}
              </ThemedText>
            </View>
            <View style={styles.comparisonPhotoWrapper}>
              <ThemedText style={styles.comparisonLabel}>Now</ThemedText>
              {currentPhotoUri && (
                <Image
                  source={{ uri: currentPhotoUri }}
                  style={styles.comparisonPhoto}
                  resizeMode="cover"
                />
              )}
              <ThemedText style={styles.comparisonDate}>Today</ThemedText>
            </View>
          </View>

          {/* Caption input */}
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />
          </View>

          {/* Save button */}
          {showSavedMessage ? (
            <View style={styles.savedMessage}>
              <ThemedText style={styles.savedMessageText}>
                ✓ Comparison Saved!
              </ThemedText>
            </View>
          ) : (
            <Pressable
              testID="save-comparison-button"
              style={styles.saveButton}
              onPress={handleSaveComparison}
            >
              <ThemedText style={styles.saveButtonText}>
                Save Comparison
              </ThemedText>
            </Pressable>
          )}
        </View>
      </Modal>
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
  actionButtons: {
    gap: Spacing.sm,
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
  // OTD-004: Then vs Now styles
  thenVsNowButton: {
    backgroundColor: SemanticColors.goldLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.sm,
    alignItems: "center",
  },
  thenVsNowButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  photoSourceModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  photoSourceTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  photoSourceSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  photoSourceOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: "#f5f5f5",
    borderRadius: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  photoSourceOptionIcon: {
    fontSize: 24,
  },
  photoSourceOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  // Comparison modal styles
  comparisonContainer: {
    flex: 1,
    backgroundColor: ViewerColors.background,
  },
  comparisonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  comparisonCancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  comparisonCancelText: {
    color: ViewerColors.text,
    fontSize: 20,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: ViewerColors.text,
  },
  comparisonPhotos: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    flex: 1,
    paddingTop: Spacing.lg,
  },
  comparisonPhotoWrapper: {
    width: (SCREEN_WIDTH - Spacing.md * 3) / 2,
    alignItems: "center",
  },
  comparisonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: ViewerColors.text,
    marginBottom: Spacing.sm,
  },
  comparisonPhoto: {
    width: (SCREEN_WIDTH - Spacing.md * 3) / 2,
    height: ((SCREEN_WIDTH - Spacing.md * 3) / 2) * 1.3,
    borderRadius: Spacing.md,
    backgroundColor: "#333",
  },
  comparisonDate: {
    fontSize: 12,
    color: ViewerColors.textMuted,
    marginTop: Spacing.sm,
  },
  captionContainer: {
    padding: Spacing.lg,
  },
  captionInput: {
    backgroundColor: "#333",
    color: ViewerColors.text,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.sm,
    alignItems: "center",
    marginBottom: 40,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  savedMessage: {
    backgroundColor: SemanticColors.successLight,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.sm,
    alignItems: "center",
    marginBottom: 40,
  },
  savedMessageText: {
    color: SemanticColors.success,
    fontSize: 16,
    fontWeight: "600",
  },
});
