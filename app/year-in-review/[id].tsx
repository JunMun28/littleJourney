import { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  Dimensions,
  ScrollView,
  Animated,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  ViewerColors,
  Spacing,
  SemanticColors,
  Colors,
} from "@/constants/theme";
import { MILESTONE_TEMPLATES } from "@/contexts/milestone-context";
import {
  useYearInReview,
  MUSIC_LIBRARY,
  TRANSITION_STYLES,
  VIDEO_QUALITIES,
  type ReviewClip,
  type TransitionStyle,
  type VideoQuality,
} from "@/contexts/year-in-review-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Slideshow configuration
const TRANSITION_DURATION = 4000; // 4 seconds per slide
const FADE_DURATION = 500; // 0.5 seconds fade

/**
 * Year in Review preview and customization screen.
 * YIR-001: Auto-generate year in review
 * YIR-002: Customization (add/remove clips, change music/transitions)
 * YIR-003: Music library
 * YIR-004: Export functionality
 */
export default function YearInReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getYearInReview,
    customizeYearInReview,
    resetToAISuggestion,
    getAvailableClipsForReview,
    markAsExported,
  } = useYearInReview();
  const review = id ? getYearInReview(id) : undefined;
  const availableClips = id ? getAvailableClipsForReview(id) : [];

  // Helper to get milestone display name
  const getMilestoneName = useCallback((clip: ReviewClip): string => {
    if (!clip.milestone) return "";
    if (clip.milestone.customTitle) return clip.milestone.customTitle;
    const template = MILESTONE_TEMPLATES.find(
      (t) => t.id === clip.milestone?.templateId,
    );
    return template?.title || "Milestone";
  }, []);

  // Slideshow state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Customization state
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showTransitionPicker, setShowTransitionPicker] = useState(false);
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const [showClipManager, setShowClipManager] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Audio
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Auto-advance slideshow
  useEffect(() => {
    if (!showSlideshow || !isPlaying || !review?.clips.length) return;

    const timer = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        // Change slide
        setCurrentIndex((prev) => (prev + 1) % review.clips.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }).start();
      });
    }, TRANSITION_DURATION);

    return () => clearInterval(timer);
  }, [showSlideshow, isPlaying, review?.clips.length, fadeAnim]);

  // Reset slideshow when closing
  useEffect(() => {
    if (!showSlideshow) {
      setCurrentIndex(0);
      setIsPlaying(false);
      fadeAnim.setValue(1);
      if (sound) {
        sound.stopAsync();
        setIsMusicPlaying(false);
      }
    }
  }, [showSlideshow, fadeAnim, sound]);

  // Handle music toggle
  const handleMusicToggle = useCallback(async () => {
    const selectedTrack = MUSIC_LIBRARY.find(
      (t) => t.id === review?.selectedMusicId,
    );
    if (!selectedTrack?.uri) {
      setIsMusicPlaying((prev) => !prev);
      return;
    }

    if (isMusicPlaying && sound) {
      await sound.pauseAsync();
      setIsMusicPlaying(false);
    } else {
      try {
        if (!sound) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: selectedTrack.uri },
            { isLooping: true, volume: 0.5 },
          );
          setSound(newSound);
          await newSound.playAsync();
        } else {
          await sound.playAsync();
        }
        setIsMusicPlaying(true);
      } catch {
        setIsMusicPlaying(true);
      }
    }
  }, [isMusicPlaying, sound, review?.selectedMusicId]);

  // Change music track
  const handleSelectMusic = useCallback(
    (musicId: string) => {
      if (!id) return;
      customizeYearInReview({ reviewId: id, musicId });
      setShowMusicPicker(false);
    },
    [id, customizeYearInReview],
  );

  // Change transition style
  const handleSelectTransition = useCallback(
    (style: TransitionStyle) => {
      if (!id) return;
      customizeYearInReview({ reviewId: id, transitionStyle: style });
      setShowTransitionPicker(false);
    },
    [id, customizeYearInReview],
  );

  // Change export quality
  const handleSelectQuality = useCallback(
    (quality: VideoQuality) => {
      if (!id) return;
      customizeYearInReview({ reviewId: id, exportQuality: quality });
      setShowQualityPicker(false);
    },
    [id, customizeYearInReview],
  );

  // Remove clip
  const handleRemoveClip = useCallback(
    (clipId: string) => {
      if (!id) return;
      customizeYearInReview({ reviewId: id, removeClipIds: [clipId] });
    },
    [id, customizeYearInReview],
  );

  // Add clip back
  const handleAddClip = useCallback(
    (clipId: string) => {
      if (!id) return;
      customizeYearInReview({ reviewId: id, addClipIds: [clipId] });
    },
    [id, customizeYearInReview],
  );

  // Reset to AI suggestion
  const handleReset = useCallback(() => {
    if (!id) return;
    resetToAISuggestion(id);
  }, [id, resetToAISuggestion]);

  // Export to camera roll
  // Note: True video export would require native video generation (ffmpeg)
  // For now, we save individual photos from the slideshow
  const handleExport = useCallback(async () => {
    if (!review?.clips.length) return;

    setIsExporting(true);
    try {
      // Request media library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Camera roll permission is required to save");
        setIsExporting(false);
        return;
      }

      // Save first photo as representative image
      // Full video export would require ffmpeg or server-side processing
      const firstClip = review.clips[0];
      if (firstClip.photoUri) {
        const asset = await MediaLibrary.createAssetAsync(firstClip.photoUri);

        // Create album if needed
        const album = await MediaLibrary.getAlbumAsync("Little Journey");
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync("Little Journey", asset, false);
        }

        markAsExported(id!, firstClip.photoUri);
        alert(
          "Year in Review cover saved to Photos!\n\nVideo export coming soon.",
        );
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [review, id, markAsExported]);

  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Navigate slides
  const handlePrev = useCallback(() => {
    if (!review?.clips.length) return;
    fadeAnim.setValue(1);
    setCurrentIndex(
      (prev) => (prev - 1 + review.clips.length) % review.clips.length,
    );
  }, [review?.clips.length, fadeAnim]);

  const handleNext = useCallback(() => {
    if (!review?.clips.length) return;
    fadeAnim.setValue(1);
    setCurrentIndex((prev) => (prev + 1) % review.clips.length);
  }, [review?.clips.length, fadeAnim]);

  if (!review) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>
          Year in Review not found
        </ThemedText>
        <Pressable
          testID="back-button"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const selectedMusic = MUSIC_LIBRARY.find(
    (t) => t.id === review.selectedMusicId,
  );
  const selectedTransition = TRANSITION_STYLES.find(
    (t) => t.id === review.transitionStyle,
  );
  const selectedQuality = VIDEO_QUALITIES.find(
    (q) => q.id === review.exportQuality,
  );
  const currentClip = review.clips[currentIndex];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          testID="back-button"
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.headerButtonText}>{"<"}</ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>
          {review.year} Year in Review
        </ThemedText>
        <Pressable
          testID="reset-button"
          style={styles.headerButton}
          onPress={handleReset}
        >
          <ThemedText style={styles.headerButtonText}>Reset</ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {/* Preview Card */}
        <View testID="preview-card" style={styles.previewCard}>
          {review.clips.length > 0 ? (
            <>
              <Image
                source={{ uri: review.clips[0].photoUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.previewOverlay}>
                <ThemedText style={styles.previewYear}>
                  {review.year}
                </ThemedText>
                <ThemedText style={styles.previewClipCount}>
                  {review.clips.length} highlights
                </ThemedText>
              </View>
            </>
          ) : (
            <View style={styles.emptyPreview}>
              <ThemedText style={styles.emptyPreviewText}>
                No highlights selected
              </ThemedText>
            </View>
          )}
        </View>

        {/* Play Button */}
        <Pressable
          testID="play-preview-button"
          style={styles.playButton}
          onPress={() => setShowSlideshow(true)}
          disabled={review.clips.length === 0}
        >
          <ThemedText style={styles.playButtonText}>
            {review.clips.length > 0 ? "▶ Preview" : "No Clips"}
          </ThemedText>
        </Pressable>

        {/* Customization Options */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Customize</ThemedText>

          {/* Music Selection */}
          <Pressable
            testID="music-option"
            style={styles.optionRow}
            onPress={() => setShowMusicPicker(true)}
          >
            <ThemedText style={styles.optionIcon}>🎵</ThemedText>
            <View style={styles.optionContent}>
              <ThemedText style={styles.optionLabel}>Music</ThemedText>
              <ThemedText style={styles.optionValue}>
                {selectedMusic?.name || "None"}
              </ThemedText>
            </View>
            <ThemedText style={styles.optionArrow}>{">"}</ThemedText>
          </Pressable>

          {/* Transition Style */}
          <Pressable
            testID="transition-option"
            style={styles.optionRow}
            onPress={() => setShowTransitionPicker(true)}
          >
            <ThemedText style={styles.optionIcon}>✨</ThemedText>
            <View style={styles.optionContent}>
              <ThemedText style={styles.optionLabel}>Transitions</ThemedText>
              <ThemedText style={styles.optionValue}>
                {selectedTransition?.name || "Fade"}
              </ThemedText>
            </View>
            <ThemedText style={styles.optionArrow}>{">"}</ThemedText>
          </Pressable>

          {/* Export Quality */}
          <Pressable
            testID="quality-option"
            style={styles.optionRow}
            onPress={() => setShowQualityPicker(true)}
          >
            <ThemedText style={styles.optionIcon}>📺</ThemedText>
            <View style={styles.optionContent}>
              <ThemedText style={styles.optionLabel}>Quality</ThemedText>
              <ThemedText style={styles.optionValue}>
                {selectedQuality?.name || "Full HD"}
              </ThemedText>
            </View>
            <ThemedText style={styles.optionArrow}>{">"}</ThemedText>
          </Pressable>

          {/* Manage Clips */}
          <Pressable
            testID="manage-clips-button"
            style={styles.optionRow}
            onPress={() => setShowClipManager(true)}
          >
            <ThemedText style={styles.optionIcon}>🖼️</ThemedText>
            <View style={styles.optionContent}>
              <ThemedText style={styles.optionLabel}>Manage Clips</ThemedText>
              <ThemedText style={styles.optionValue}>
                {review.clips.length} selected
              </ThemedText>
            </View>
            <ThemedText style={styles.optionArrow}>{">"}</ThemedText>
          </Pressable>
        </View>

        {/* Export Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Export</ThemedText>
          <Pressable
            testID="export-button"
            style={[
              styles.exportButton,
              isExporting && styles.exportButtonDisabled,
            ]}
            onPress={handleExport}
            disabled={isExporting || review.clips.length === 0}
          >
            <ThemedText style={styles.exportButtonText}>
              {isExporting ? "Exporting..." : "Save to Photos"}
            </ThemedText>
          </Pressable>
          <ThemedText style={styles.exportNote}>
            Saves as images. Video export coming soon!
          </ThemedText>
        </View>
      </ScrollView>

      {/* Fullscreen Slideshow Modal */}
      <Modal
        visible={showSlideshow}
        animationType="fade"
        onRequestClose={() => setShowSlideshow(false)}
      >
        <View style={styles.slideshowContainer}>
          {currentClip ? (
            <Pressable
              testID="slideshow-tap-area"
              style={styles.slideshowImageContainer}
              onPress={handlePlayPause}
            >
              <Animated.View
                style={[styles.slideshowImageWrapper, { opacity: fadeAnim }]}
              >
                <Image
                  source={{ uri: currentClip.photoUri }}
                  style={styles.slideshowImage}
                  resizeMode="contain"
                  testID="slideshow-image"
                />
              </Animated.View>
            </Pressable>
          ) : null}

          {/* Slideshow Header */}
          <View style={styles.slideshowHeader}>
            <Pressable
              testID="close-slideshow-button"
              style={styles.slideshowCloseButton}
              onPress={() => setShowSlideshow(false)}
            >
              <ThemedText style={styles.slideshowCloseText}>✕</ThemedText>
            </Pressable>

            <View testID="slideshow-counter" style={styles.slideshowCounter}>
              <ThemedText style={styles.slideshowCounterText}>
                {currentIndex + 1} / {review.clips.length}
              </ThemedText>
            </View>

            <Pressable
              testID="slideshow-music-button"
              style={styles.slideshowMusicButton}
              onPress={handleMusicToggle}
            >
              <ThemedText style={styles.slideshowMusicText}>
                {isMusicPlaying ? "🎵" : "🔇"}
              </ThemedText>
            </Pressable>
          </View>

          {/* Slideshow Caption */}
          {currentClip && (
            <View style={styles.slideshowCaption}>
              <ThemedText style={styles.slideshowDate}>
                {new Date(currentClip.entry.date).toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </ThemedText>
              {currentClip.isMilestone && currentClip.milestone && (
                <ThemedText style={styles.slideshowMilestone}>
                  🏆 {getMilestoneName(currentClip)}
                </ThemedText>
              )}
              {currentClip.entry.caption && (
                <ThemedText
                  style={styles.slideshowCaptionText}
                  numberOfLines={2}
                >
                  {currentClip.entry.caption}
                </ThemedText>
              )}
            </View>
          )}

          {/* Slideshow Controls */}
          <View style={styles.slideshowControls}>
            <Pressable
              testID="prev-slide-button"
              style={styles.slideshowNavButton}
              onPress={handlePrev}
            >
              <ThemedText style={styles.slideshowNavText}>‹</ThemedText>
            </Pressable>

            <Pressable
              testID="play-pause-button"
              style={styles.slideshowPlayButton}
              onPress={handlePlayPause}
            >
              <ThemedText style={styles.slideshowPlayText}>
                {isPlaying ? "⏸" : "▶"}
              </ThemedText>
            </Pressable>

            <Pressable
              testID="next-slide-button"
              style={styles.slideshowNavButton}
              onPress={handleNext}
            >
              <ThemedText style={styles.slideshowNavText}>›</ThemedText>
            </Pressable>
          </View>

          {/* Progress dots */}
          <View style={styles.slideshowProgress}>
            {review.clips.slice(0, 20).map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.progressDot,
                  index === currentIndex && styles.progressDotActive,
                ]}
              />
            ))}
            {review.clips.length > 20 && (
              <ThemedText style={styles.progressMore}>
                +{review.clips.length - 20}
              </ThemedText>
            )}
          </View>
        </View>
      </Modal>

      {/* Music Picker Modal */}
      <Modal
        visible={showMusicPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMusicPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerModal}>
            <ThemedText style={styles.pickerTitle}>Select Music</ThemedText>
            {MUSIC_LIBRARY.map((track) => (
              <Pressable
                key={track.id}
                testID={`track-${track.id}`}
                style={[
                  styles.pickerOption,
                  review.selectedMusicId === track.id &&
                    styles.pickerOptionSelected,
                ]}
                onPress={() => handleSelectMusic(track.id)}
              >
                <ThemedText style={styles.pickerOptionIcon}>🎵</ThemedText>
                <View style={styles.pickerOptionContent}>
                  <ThemedText style={styles.pickerOptionText}>
                    {track.name}
                  </ThemedText>
                  <ThemedText style={styles.pickerOptionCategory}>
                    {track.category}
                  </ThemedText>
                </View>
                {review.selectedMusicId === track.id && (
                  <ThemedText style={styles.pickerCheck}>✓</ThemedText>
                )}
              </Pressable>
            ))}
            <Pressable
              testID="close-music-picker"
              style={styles.pickerCloseButton}
              onPress={() => setShowMusicPicker(false)}
            >
              <ThemedText style={styles.pickerCloseText}>Done</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Transition Picker Modal */}
      <Modal
        visible={showTransitionPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTransitionPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerModal}>
            <ThemedText style={styles.pickerTitle}>
              Select Transition
            </ThemedText>
            {TRANSITION_STYLES.map((style) => (
              <Pressable
                key={style.id}
                testID={`transition-${style.id}`}
                style={[
                  styles.pickerOption,
                  review.transitionStyle === style.id &&
                    styles.pickerOptionSelected,
                ]}
                onPress={() => handleSelectTransition(style.id)}
              >
                <ThemedText style={styles.pickerOptionIcon}>✨</ThemedText>
                <View style={styles.pickerOptionContent}>
                  <ThemedText style={styles.pickerOptionText}>
                    {style.name}
                  </ThemedText>
                  <ThemedText style={styles.pickerOptionCategory}>
                    {style.description}
                  </ThemedText>
                </View>
                {review.transitionStyle === style.id && (
                  <ThemedText style={styles.pickerCheck}>✓</ThemedText>
                )}
              </Pressable>
            ))}
            <Pressable
              testID="close-transition-picker"
              style={styles.pickerCloseButton}
              onPress={() => setShowTransitionPicker(false)}
            >
              <ThemedText style={styles.pickerCloseText}>Done</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Quality Picker Modal */}
      <Modal
        visible={showQualityPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowQualityPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerModal}>
            <ThemedText style={styles.pickerTitle}>Select Quality</ThemedText>
            {VIDEO_QUALITIES.map((quality) => (
              <Pressable
                key={quality.id}
                testID={`quality-${quality.id}`}
                style={[
                  styles.pickerOption,
                  review.exportQuality === quality.id &&
                    styles.pickerOptionSelected,
                ]}
                onPress={() => handleSelectQuality(quality.id)}
              >
                <ThemedText style={styles.pickerOptionIcon}>📺</ThemedText>
                <View style={styles.pickerOptionContent}>
                  <ThemedText style={styles.pickerOptionText}>
                    {quality.name}
                  </ThemedText>
                  <ThemedText style={styles.pickerOptionCategory}>
                    {quality.resolution}
                  </ThemedText>
                </View>
                {review.exportQuality === quality.id && (
                  <ThemedText style={styles.pickerCheck}>✓</ThemedText>
                )}
              </Pressable>
            ))}
            <Pressable
              testID="close-quality-picker"
              style={styles.pickerCloseButton}
              onPress={() => setShowQualityPicker(false)}
            >
              <ThemedText style={styles.pickerCloseText}>Done</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Clip Manager Modal */}
      <Modal
        visible={showClipManager}
        animationType="slide"
        onRequestClose={() => setShowClipManager(false)}
      >
        <ThemedView style={styles.clipManagerContainer}>
          <View style={styles.clipManagerHeader}>
            <ThemedText style={styles.clipManagerTitle}>
              Manage Clips
            </ThemedText>
            <Pressable
              testID="close-clip-manager"
              style={styles.clipManagerCloseButton}
              onPress={() => setShowClipManager(false)}
            >
              <ThemedText style={styles.clipManagerCloseText}>Done</ThemedText>
            </Pressable>
          </View>

          <ScrollView style={styles.clipManagerContent}>
            {/* Current clips */}
            <ThemedText style={styles.clipManagerSectionTitle}>
              Selected ({review.clips.length})
            </ThemedText>
            <View style={styles.clipGrid}>
              {review.clips.map((clip) => (
                <View key={clip.id} style={styles.clipItem}>
                  <Image
                    source={{ uri: clip.photoUri }}
                    style={styles.clipThumbnail}
                    resizeMode="cover"
                  />
                  {clip.isMilestone && (
                    <View style={styles.clipMilestoneBadge}>
                      <ThemedText style={styles.clipMilestoneText}>
                        🏆
                      </ThemedText>
                    </View>
                  )}
                  <Pressable
                    testID={`remove-clip-${clip.id}`}
                    style={styles.clipRemoveButton}
                    onPress={() => handleRemoveClip(clip.id)}
                  >
                    <ThemedText style={styles.clipRemoveText}>✕</ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Available to add back */}
            {availableClips.length > 0 && (
              <>
                <ThemedText style={styles.clipManagerSectionTitle}>
                  Available to Add ({availableClips.length})
                </ThemedText>
                <View style={styles.clipGrid}>
                  {availableClips.map((clip) => (
                    <Pressable
                      key={clip.id}
                      testID={`add-clip-${clip.id}`}
                      style={styles.clipItem}
                      onPress={() => handleAddClip(clip.id)}
                    >
                      <Image
                        source={{ uri: clip.photoUri }}
                        style={[
                          styles.clipThumbnail,
                          styles.clipThumbnailDimmed,
                        ]}
                        resizeMode="cover"
                      />
                      <View style={styles.clipAddOverlay}>
                        <ThemedText style={styles.clipAddText}>+</ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerButtonText: {
    color: Colors.light.tint,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
    color: SemanticColors.error,
  },
  backButton: {
    alignSelf: "center",
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.light.tint,
    borderRadius: Spacing.md,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  // Preview card
  previewCard: {
    aspectRatio: 16 / 9,
    borderRadius: Spacing.lg,
    overflow: "hidden",
    backgroundColor: Colors.light.border,
    marginBottom: Spacing.md,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewYear: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
  },
  previewClipCount: {
    color: "#fff",
    fontSize: 16,
    marginTop: Spacing.sm,
  },
  emptyPreview: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyPreviewText: {
    color: Colors.light.textSecondary,
    fontSize: 16,
  },
  playButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  playButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
    color: Colors.light.textSecondary,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionValue: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  optionArrow: {
    fontSize: 18,
    color: Colors.light.textSecondary,
  },
  // Export
  exportButton: {
    backgroundColor: SemanticColors.goldLight,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  exportNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  // Slideshow
  slideshowContainer: {
    flex: 1,
    backgroundColor: ViewerColors.background,
  },
  slideshowImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slideshowImageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  slideshowImage: {
    width: "100%",
    height: "100%",
  },
  slideshowHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  slideshowCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  slideshowCloseText: {
    color: ViewerColors.text,
    fontSize: 20,
  },
  slideshowCounter: {
    backgroundColor: ViewerColors.overlay,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.lg,
  },
  slideshowCounterText: {
    color: ViewerColors.text,
    fontSize: 14,
  },
  slideshowMusicButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  slideshowMusicText: {
    fontSize: 20,
  },
  slideshowCaption: {
    position: "absolute",
    bottom: 150,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: ViewerColors.overlayStrong,
  },
  slideshowDate: {
    color: SemanticColors.goldLight,
    fontSize: 14,
    fontWeight: "600",
  },
  slideshowMilestone: {
    color: SemanticColors.goldLight,
    fontSize: 14,
    marginTop: 4,
  },
  slideshowCaptionText: {
    color: ViewerColors.text,
    fontSize: 16,
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  slideshowControls: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xl,
  },
  slideshowNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  slideshowNavText: {
    color: ViewerColors.text,
    fontSize: 32,
    marginTop: -4,
  },
  slideshowPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ViewerColors.buttonBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  slideshowPlayText: {
    color: ViewerColors.text,
    fontSize: 28,
  },
  slideshowProgress: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
    paddingHorizontal: Spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ViewerColors.overlay,
  },
  progressDotActive: {
    backgroundColor: SemanticColors.goldLight,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressMore: {
    color: ViewerColors.text,
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  // Picker modals
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: "#f5f5f5",
    borderRadius: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pickerOptionSelected: {
    backgroundColor: SemanticColors.goldLight,
    borderWidth: 2,
    borderColor: "#DAA520",
  },
  pickerOptionIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  pickerOptionContent: {
    flex: 1,
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#333",
  },
  pickerOptionCategory: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  pickerCheck: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
  },
  pickerCloseButton: {
    backgroundColor: "#333",
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  pickerCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Clip manager
  clipManagerContainer: {
    flex: 1,
  },
  clipManagerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  clipManagerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  clipManagerCloseButton: {
    padding: Spacing.sm,
  },
  clipManagerCloseText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: "600",
  },
  clipManagerContent: {
    flex: 1,
    padding: Spacing.md,
  },
  clipManagerSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  clipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  clipItem: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm * 3) / 4,
    aspectRatio: 1,
    borderRadius: Spacing.sm,
    overflow: "hidden",
    position: "relative",
  },
  clipThumbnail: {
    width: "100%",
    height: "100%",
  },
  clipThumbnailDimmed: {
    opacity: 0.5,
  },
  clipMilestoneBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 2,
  },
  clipMilestoneText: {
    fontSize: 12,
  },
  clipRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,59,48,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  clipRemoveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  clipAddOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  clipAddText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});
