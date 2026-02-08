/**
 * Voice Recording Modal Component
 *
 * Modal for recording, previewing, and saving voice messages
 * for time capsules.
 */

import { View, Text, Pressable, Modal, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Colors,
  SemanticColors,
  Spacing,
  PRIMARY_COLOR,
} from "@/constants/theme";

// CAPSULE-002: Voice recording state types
export type VoiceRecordingState = "idle" | "recording" | "preview";

// Helper to format duration in mm:ss
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface VoiceRecordingModalProps {
  visible: boolean;
  voiceState: VoiceRecordingState;
  recordingDuration: number;
  voiceDuration: number;
  isPlayingPreview: boolean;
  onClose: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayPreview: () => void;
  onStopPreview: () => void;
  onReRecord: () => void;
  onSave: () => void;
}

export function VoiceRecordingModal({
  visible,
  voiceState,
  recordingDuration,
  voiceDuration,
  isPlayingPreview,
  onClose,
  onStartRecording,
  onStopRecording,
  onPlayPreview,
  onStopPreview,
  onReRecord,
  onSave,
}: VoiceRecordingModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      testID="voice-recording-modal"
    >
      <View style={styles.voiceModalOverlay}>
        <View
          style={[
            styles.voiceModalContent,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.voiceModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable testID="close-voice-modal-button" onPress={onClose}>
              <Text style={styles.backButton}>Cancel</Text>
            </Pressable>
            <ThemedText type="subtitle">Voice Message</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.voiceModalBody}>
            {voiceState === "idle" && (
              <>
                <Text
                  style={[
                    styles.voiceModalInstruction,
                    { color: colors.textSecondary },
                  ]}
                >
                  Tap to start recording your voice message
                </Text>
                <Pressable
                  testID="start-recording-button"
                  style={styles.recordButton}
                  onPress={onStartRecording}
                >
                  <Text style={styles.recordButtonIcon}>🎙️</Text>
                  <Text style={styles.recordButtonText}>Start Recording</Text>
                </Pressable>
                <Text
                  style={[
                    styles.voiceModalSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Maximum 5 minutes
                </Text>
              </>
            )}

            {voiceState === "recording" && (
              <>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text
                    style={[
                      styles.recordingLabel,
                      { color: SemanticColors.error },
                    ]}
                  >
                    Recording
                  </Text>
                </View>
                <Text
                  testID="recording-duration"
                  style={[styles.durationDisplay, { color: colors.text }]}
                >
                  {formatDuration(recordingDuration)}
                </Text>
                <Pressable
                  testID="stop-recording-button"
                  style={styles.stopButton}
                  onPress={onStopRecording}
                >
                  <View style={styles.stopButtonIcon} />
                  <Text style={styles.stopButtonText}>Stop</Text>
                </Pressable>
              </>
            )}

            {voiceState === "preview" && (
              <View testID="voice-preview" style={styles.previewContainer}>
                <Text style={[styles.previewTitle, { color: colors.text }]}>
                  Preview
                </Text>
                <Text
                  style={[
                    styles.previewDuration,
                    { color: colors.textSecondary },
                  ]}
                >
                  Duration: {formatDuration(voiceDuration)}
                </Text>

                <Pressable
                  testID="play-preview-button"
                  style={[
                    styles.playPreviewButton,
                    isPlayingPreview && styles.playPreviewButtonActive,
                  ]}
                  onPress={isPlayingPreview ? onStopPreview : onPlayPreview}
                >
                  <Text style={styles.playPreviewIcon}>
                    {isPlayingPreview ? "⏹️" : "▶️"}
                  </Text>
                  <Text style={styles.playPreviewText}>
                    {isPlayingPreview ? "Stop" : "Play"}
                  </Text>
                </Pressable>

                <View style={styles.previewActions}>
                  <Pressable
                    testID="re-record-button"
                    style={[
                      styles.previewActionButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={onReRecord}
                  >
                    <Text
                      style={[styles.previewActionText, { color: colors.text }]}
                    >
                      Re-record
                    </Text>
                  </Pressable>
                  <Pressable
                    testID="save-voice-button"
                    style={styles.saveVoiceButton}
                    onPress={onSave}
                  >
                    <Text style={styles.saveVoiceButtonText}>
                      Use Recording
                    </Text>
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
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  voiceModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 350,
  },
  voiceModalHeader: {
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
  voiceModalBody: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceModalInstruction: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  voiceModalSubtext: {
    fontSize: 12,
    marginTop: Spacing.md,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SemanticColors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: SemanticColors.error,
    marginRight: Spacing.sm,
  },
  recordingLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  durationDisplay: {
    fontSize: 48,
    fontWeight: "300",
    marginBottom: Spacing.xl,
    fontVariant: ["tabular-nums"],
  },
  stopButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  stopButtonIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  previewContainer: {
    width: "100%",
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  previewDuration: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  playPreviewButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  playPreviewButtonActive: {
    backgroundColor: "#333",
  },
  playPreviewIcon: {
    fontSize: 24,
  },
  playPreviewText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  previewActions: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  previewActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  previewActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveVoiceButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    alignItems: "center",
  },
  saveVoiceButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
