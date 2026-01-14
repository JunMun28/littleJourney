import { useState, useRef, useCallback } from "react";
import { View, Pressable, StyleSheet, Dimensions } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";

import { ThemedText } from "@/components/themed-text";

interface VideoPlayerProps {
  uri: string;
  aspectRatio?: number;
  onPress?: () => void;
  autoPlay?: boolean;
  showControls?: boolean;
}

export function VideoPlayer({
  uri,
  aspectRatio = 16 / 9,
  onPress,
  autoPlay = false,
  showControls = true,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  }, [isPlaying]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      togglePlayback();
    }
  }, [onPress, togglePlayback]);

  return (
    <Pressable
      testID="video-container"
      onPress={handlePress}
      style={[styles.container, { aspectRatio }]}
    >
      <Video
        ref={videoRef}
        testID="video-player"
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={autoPlay}
        isLooping
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {/* Controls Overlay */}
      {showControls && (
        <View testID="controls-overlay" style={styles.controlsOverlay}>
          {!isPlaying && (
            <View testID="play-button" style={styles.playButton}>
              <ThemedText style={styles.playIcon}>▶</ThemedText>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    color: "#fff",
    fontSize: 24,
    marginLeft: 4, // Optical centering for play icon
  },
});
