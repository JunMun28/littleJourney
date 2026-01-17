import { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Modal,
} from "react-native";
import { Audio } from "expo-av";

import { ThemedText } from "@/components/themed-text";
import { ViewerColors, Spacing, SemanticColors } from "@/constants/theme";
import type { Memory } from "@/contexts/on-this-day-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Slideshow configuration
const TRANSITION_DURATION = 4000; // 4 seconds per slide
const FADE_DURATION = 500; // 0.5 seconds fade transition

// Available background music tracks (royalty-free placeholder URLs)
// In production, these would be actual bundled audio files
const MUSIC_TRACKS = [
  { id: "gentle", name: "Gentle Memories", uri: null }, // Placeholder for bundled asset
  { id: "playful", name: "Playful Moments", uri: null },
  { id: "nostalgic", name: "Nostalgic Journey", uri: null },
];

interface MemorySlideshowProps {
  /** List of memories to display in slideshow */
  memories: Memory[];
  /** Callback when slideshow is closed */
  onClose: () => void;
  /** Whether the slideshow modal is visible */
  visible: boolean;
}

/**
 * Full-screen memory slideshow with auto-transition and background music.
 * OTD-006: Auto-playing slideshow for memory viewing.
 */
export function MemorySlideshow({
  memories,
  onClose,
  visible,
}: MemorySlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(MUSIC_TRACKS[0]);
  const [showMusicPicker, setShowMusicPicker] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Get photos from memories (only photo entries with media)
  const photos = memories
    .filter(
      (m) =>
        m.entry.type === "photo" &&
        m.entry.mediaUris &&
        m.entry.mediaUris.length > 0,
    )
    .flatMap((m) => {
      const entry = m.entry;
      return (entry.mediaUris || []).map((uri, index) => ({
        uri,
        caption: entry.caption,
        date: entry.date,
        yearsAgo: m.yearsAgo,
        memoryId: m.id,
        photoIndex: index,
      }));
    });

  // Auto-advance slideshow
  useEffect(() => {
    if (!visible || !isPlaying || photos.length <= 1) return;

    const timer = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        // Change slide
        setCurrentIndex((prev) => (prev + 1) % photos.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }).start();
      });
    }, TRANSITION_DURATION);

    return () => clearInterval(timer);
  }, [visible, isPlaying, photos.length, fadeAnim]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setCurrentIndex(0);
      setIsPlaying(true);
      fadeAnim.setValue(1);
    }
  }, [visible, fadeAnim]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Handle tap to toggle play/pause
  const handleTap = useCallback(() => {
    handlePlayPause();
  }, [handlePlayPause]);

  // Handle exit
  const handleExit = useCallback(() => {
    if (sound) {
      sound.stopAsync();
    }
    onClose();
  }, [onClose, sound]);

  // Handle music toggle
  const handleMusicToggle = useCallback(async () => {
    if (!selectedTrack.uri) {
      // No actual audio file - just toggle the state for UI demonstration
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
        // Audio not available - just update state
        setIsMusicPlaying(true);
      }
    }
  }, [isMusicPlaying, sound, selectedTrack.uri]);

  // Handle music track selection
  const handleSelectTrack = useCallback(
    async (track: (typeof MUSIC_TRACKS)[0]) => {
      setSelectedTrack(track);
      setShowMusicPicker(false);

      // Stop current sound if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      // Start new track if music was playing
      if (isMusicPlaying && track.uri) {
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: track.uri },
            { isLooping: true, volume: 0.5 },
          );
          setSound(newSound);
          await newSound.playAsync();
        } catch {
          // Audio not available
        }
      }
    },
    [isMusicPlaying, sound],
  );

  // Navigate to next/prev slide
  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    fadeAnim.setValue(1);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length, fadeAnim]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    fadeAnim.setValue(1);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length, fadeAnim]);

  // No photos to show
  if (photos.length === 0) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        onRequestClose={handleExit}
      >
        <View style={styles.container}>
          <StatusBar barStyle="light-content" />
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No photos to display in slideshow
            </ThemedText>
            <Pressable
              testID="close-slideshow-button"
              style={styles.closeEmptyButton}
              onPress={handleExit}
            >
              <ThemedText style={styles.closeEmptyButtonText}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  const currentPhoto = photos[currentIndex];
  const yearsAgoText =
    currentPhoto.yearsAgo === 1
      ? "1 year ago"
      : `${currentPhoto.yearsAgo} years ago`;
  const formattedDate = new Date(currentPhoto.date).toLocaleDateString(
    "en-SG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleExit}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Fullscreen image with fade animation */}
        <Pressable
          testID="slideshow-tap-area"
          style={styles.imageContainer}
          onPress={handleTap}
        >
          <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
            <Image
              source={{ uri: currentPhoto.uri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
              testID="slideshow-image"
            />
          </Animated.View>
        </Pressable>

        {/* Header with exit button */}
        <View style={styles.header}>
          <Pressable
            testID="exit-slideshow-button"
            style={styles.exitButton}
            onPress={handleExit}
          >
            <ThemedText style={styles.exitButtonText}>✕</ThemedText>
          </Pressable>

          {/* Photo counter */}
          <View testID="slideshow-counter" style={styles.counter}>
            <ThemedText style={styles.counterText}>
              {currentIndex + 1} / {photos.length}
            </ThemedText>
          </View>

          {/* Music button */}
          <Pressable
            testID="music-button"
            style={styles.musicButton}
            onPress={() => setShowMusicPicker(true)}
          >
            <ThemedText style={styles.musicButtonText}>
              {isMusicPlaying ? "🎵" : "🔇"}
            </ThemedText>
          </Pressable>
        </View>

        {/* Caption and date overlay */}
        <View style={styles.captionOverlay}>
          <View style={styles.dateContainer}>
            <ThemedText style={styles.yearsAgoText}>{yearsAgoText}</ThemedText>
            <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
          </View>
          {currentPhoto.caption && (
            <ThemedText style={styles.captionText} numberOfLines={3}>
              {currentPhoto.caption}
            </ThemedText>
          )}
        </View>

        {/* Playback controls */}
        <View style={styles.controls}>
          {/* Previous button */}
          <Pressable
            testID="prev-slide-button"
            style={styles.navButton}
            onPress={handlePrev}
          >
            <ThemedText style={styles.navButtonText}>‹</ThemedText>
          </Pressable>

          {/* Play/Pause button */}
          <Pressable
            testID="play-pause-button"
            style={styles.playPauseButton}
            onPress={handlePlayPause}
          >
            <ThemedText style={styles.playPauseText}>
              {isPlaying ? "⏸" : "▶"}
            </ThemedText>
          </Pressable>

          {/* Next button */}
          <Pressable
            testID="next-slide-button"
            style={styles.navButton}
            onPress={handleNext}
          >
            <ThemedText style={styles.navButtonText}>›</ThemedText>
          </Pressable>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {photos.map((_, index) => (
            <View
              key={`indicator-${index}`}
              style={[
                styles.progressDot,
                index === currentIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Music picker modal */}
        <Modal
          visible={showMusicPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMusicPicker(false)}
        >
          <View style={styles.musicPickerOverlay}>
            <View style={styles.musicPickerModal}>
              <ThemedText style={styles.musicPickerTitle}>
                Background Music
              </ThemedText>

              {/* Music on/off toggle */}
              <Pressable
                testID="toggle-music-button"
                style={[
                  styles.musicOption,
                  isMusicPlaying && styles.musicOptionActive,
                ]}
                onPress={handleMusicToggle}
              >
                <ThemedText style={styles.musicOptionIcon}>
                  {isMusicPlaying ? "🔊" : "🔇"}
                </ThemedText>
                <ThemedText style={styles.musicOptionText}>
                  {isMusicPlaying ? "Music On" : "Music Off"}
                </ThemedText>
              </Pressable>

              {/* Track selection */}
              {MUSIC_TRACKS.map((track) => (
                <Pressable
                  key={track.id}
                  testID={`track-${track.id}`}
                  style={[
                    styles.musicOption,
                    selectedTrack.id === track.id && styles.musicOptionSelected,
                  ]}
                  onPress={() => handleSelectTrack(track)}
                >
                  <ThemedText style={styles.musicOptionIcon}>🎵</ThemedText>
                  <ThemedText style={styles.musicOptionText}>
                    {track.name}
                  </ThemedText>
                  {selectedTrack.id === track.id && (
                    <ThemedText style={styles.selectedIcon}>✓</ThemedText>
                  )}
                </Pressable>
              ))}

              <Pressable
                testID="close-music-picker"
                style={styles.closeMusicPickerButton}
                onPress={() => setShowMusicPicker(false)}
              >
                <ThemedText style={styles.closeMusicPickerText}>
                  Done
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ViewerColors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    color: ViewerColors.text,
    fontSize: 18,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  closeEmptyButton: {
    backgroundColor: ViewerColors.buttonBackground,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
  },
  closeEmptyButtonText: {
    color: ViewerColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  exitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  exitButtonText: {
    color: ViewerColors.text,
    fontSize: 20,
  },
  counter: {
    backgroundColor: ViewerColors.overlay,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.lg,
  },
  counterText: {
    color: ViewerColors.text,
    fontSize: 14,
  },
  musicButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  musicButtonText: {
    fontSize: 20,
  },
  captionOverlay: {
    position: "absolute",
    bottom: 150,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: ViewerColors.overlayStrong,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  yearsAgoText: {
    color: SemanticColors.goldLight,
    fontSize: 14,
    fontWeight: "600",
  },
  dateText: {
    color: ViewerColors.textMuted,
    fontSize: 14,
  },
  captionText: {
    color: ViewerColors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  controls: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: ViewerColors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: {
    color: ViewerColors.text,
    fontSize: 32,
    marginTop: -4,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ViewerColors.buttonBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseText: {
    color: ViewerColors.text,
    fontSize: 28,
  },
  progressContainer: {
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
  // Music picker styles
  musicPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  musicPickerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  musicPickerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  musicOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: "#f5f5f5",
    borderRadius: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  musicOptionActive: {
    backgroundColor: "#E8F4FF",
    borderWidth: 2,
    borderColor: "#4A90D9",
  },
  musicOptionSelected: {
    backgroundColor: SemanticColors.goldLight,
    borderWidth: 2,
    borderColor: "#DAA520",
  },
  musicOptionIcon: {
    fontSize: 20,
  },
  musicOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  selectedIcon: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
  },
  closeMusicPickerButton: {
    backgroundColor: "#333",
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  closeMusicPickerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
