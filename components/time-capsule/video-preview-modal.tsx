/**
 * Video Preview Modal Components
 *
 * Modals for selecting video source and previewing video messages.
 */

import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Video, ResizeMode } from "expo-av";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, Spacing, PRIMARY_COLOR } from "@/constants/theme";
import { formatDuration } from "./voice-recording-modal";

// Video Source Selection Modal
interface VideoSourceModalProps {
  visible: boolean;
  onRecordVideo: () => void;
  onSelectVideo: () => void;
  onClose: () => void;
}

export function VideoSourceModal({
  visible,
  onRecordVideo,
  onSelectVideo,
  onClose,
}: VideoSourceModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      testID="video-source-modal"
    >
      <View style={styles.videoSourceModalOverlay}>
        <View
          style={[
            styles.videoSourceModalContent,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.videoSourceTitle, { color: colors.text }]}>
            Add Video Message
          </Text>

          <Pressable
            testID="record-video-button"
            style={[styles.videoSourceOption, { borderColor: colors.border }]}
            onPress={onRecordVideo}
          >
            <Text style={styles.videoSourceIcon}>📹</Text>
            <View>
              <Text
                style={[styles.videoSourceOptionTitle, { color: colors.text }]}
              >
                Record Video
              </Text>
              <Text
                style={[
                  styles.videoSourceOptionSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Use camera to record a new video
              </Text>
            </View>
          </Pressable>

          <Pressable
            testID="select-video-button"
            style={[styles.videoSourceOption, { borderColor: colors.border }]}
            onPress={onSelectVideo}
          >
            <Text style={styles.videoSourceIcon}>📁</Text>
            <View>
              <Text
                style={[styles.videoSourceOptionTitle, { color: colors.text }]}
              >
                Choose from Library
              </Text>
              <Text
                style={[
                  styles.videoSourceOptionSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Select an existing video
              </Text>
            </View>
          </Pressable>

          <Pressable
            testID="cancel-video-source-button"
            style={styles.videoSourceCancelButton}
            onPress={onClose}
          >
            <Text style={styles.videoSourceCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Video Preview Modal
interface VideoPreviewModalProps {
  visible: boolean;
  videoUri: string | null;
  videoDuration: number;
  isPlayingVideo: boolean;
  onPlayVideo: () => Promise<void>;
  onPauseVideo: () => Promise<void>;
  onChangeVideo: () => void;
  onSave: () => void;
  onClose: () => void;
  videoRef: React.RefObject<Video | null>;
  onPlaybackStatusUpdate: (status: {
    isLoaded: boolean;
    didJustFinish?: boolean;
  }) => void;
}

export function VideoPreviewModal({
  visible,
  videoUri,
  videoDuration,
  isPlayingVideo,
  onPlayVideo,
  onPauseVideo,
  onChangeVideo,
  onSave,
  onClose,
  videoRef,
  onPlaybackStatusUpdate,
}: VideoPreviewModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      testID="video-preview-modal"
    >
      <View style={styles.videoModalOverlay}>
        <View
          style={[
            styles.videoModalContent,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.videoModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable testID="close-video-modal-button" onPress={onClose}>
              <Text style={styles.backButton}>Cancel</Text>
            </Pressable>
            <ThemedText type="subtitle">Video Preview</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.videoModalBody}>
            {videoUri && (
              <View testID="video-preview" style={styles.videoPreviewContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: videoUri }}
                  style={styles.videoPlayer}
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                  onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                />

                <Text
                  style={[
                    styles.videoPreviewDuration,
                    { color: colors.textSecondary },
                  ]}
                >
                  Duration: {formatDuration(videoDuration)}
                </Text>

                <Pressable
                  testID="play-video-button"
                  style={[
                    styles.playVideoButton,
                    isPlayingVideo && styles.playVideoButtonActive,
                  ]}
                  onPress={isPlayingVideo ? onPauseVideo : onPlayVideo}
                >
                  <Text style={styles.playVideoIcon}>
                    {isPlayingVideo ? "⏸️" : "▶️"}
                  </Text>
                  <Text style={styles.playVideoText}>
                    {isPlayingVideo ? "Pause" : "Play"}
                  </Text>
                </Pressable>

                <View style={styles.videoPreviewActions}>
                  <Pressable
                    testID="change-video-button"
                    style={[
                      styles.videoPreviewActionButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={onChangeVideo}
                  >
                    <Text
                      style={[
                        styles.videoPreviewActionText,
                        { color: colors.text },
                      ]}
                    >
                      Change Video
                    </Text>
                  </Pressable>
                  <Pressable
                    testID="save-video-button"
                    style={styles.saveVideoButton}
                    onPress={onSave}
                  >
                    <Text style={styles.saveVideoButtonText}>Use Video</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Video Source Modal styles
  videoSourceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  videoSourceModalContent: {
    borderRadius: 16,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 340,
  },
  videoSourceTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  videoSourceOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  videoSourceIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  videoSourceOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  videoSourceOptionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  videoSourceCancelButton: {
    marginTop: Spacing.md,
    alignItems: "center",
    padding: Spacing.md,
  },
  videoSourceCancelText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  // Video Preview Modal styles
  videoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  videoModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 500,
  },
  videoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  videoModalBody: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPreviewContainer: {
    width: "100%",
    alignItems: "center",
  },
  videoPlayer: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  videoPreviewDuration: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  playVideoButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  playVideoButtonActive: {
    backgroundColor: "#333",
  },
  playVideoIcon: {
    fontSize: 24,
  },
  playVideoText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  videoPreviewActions: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  videoPreviewActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  videoPreviewActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveVideoButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    alignItems: "center",
  },
  saveVideoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
