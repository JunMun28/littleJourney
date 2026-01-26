/**
 * ExportModal Component (YIR-004)
 *
 * Modal for Year in Review video export with quality selection,
 * progress tracking, and success/error states.
 */

import { useCallback } from "react";
import { Modal, View, Pressable, StyleSheet, Share } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, SemanticColors } from "@/constants/theme";
import {
  VIDEO_QUALITIES,
  type VideoQuality,
} from "@/contexts/year-in-review-context";

export type ExportStatus =
  | "idle"
  | "preparing"
  | "rendering"
  | "saving"
  | "complete"
  | "error";

export interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: () => void;
  onCancel: () => void;
  status: ExportStatus;
  progress: number;
  error: string | null;
  currentQuality: VideoQuality;
  onQualityChange: (quality: VideoQuality) => void;
  outputPath?: string | null;
}

export function ExportModal({
  visible,
  onClose,
  onExport,
  onCancel,
  status,
  progress,
  error,
  currentQuality,
  onQualityChange,
  outputPath,
}: ExportModalProps) {
  const isProcessing =
    status === "preparing" || status === "rendering" || status === "saving";

  const handleShare = useCallback(async () => {
    if (outputPath) {
      try {
        await Share.share({
          url: outputPath,
          message: "Check out my Year in Review! 🎬",
        });
      } catch {
        // Ignore share errors
      }
    }
  }, [outputPath]);

  const getStatusMessage = () => {
    switch (status) {
      case "preparing":
        return "Preparing images...";
      case "rendering":
        return "Creating your video...";
      case "saving":
        return "Saving to camera roll...";
      case "complete":
        return "Export complete!";
      case "error":
        return "Export failed";
      default:
        return "Export Video";
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={
        status === "idle" || status === "error" ? onClose : undefined
      }
      testID="export-modal"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              {status === "complete" ? "Success!" : "Export Video"}
            </ThemedText>
            {(status === "idle" || status === "error") && (
              <Pressable
                testID="close-button"
                style={styles.closeButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </Pressable>
            )}
          </View>

          {/* Content based on status */}
          {status === "idle" && (
            <View style={styles.content}>
              {/* Quality Selector */}
              <ThemedText style={styles.sectionLabel}>Video Quality</ThemedText>
              <View
                testID="quality-selector"
                style={styles.qualitySelector}
                accessible
                accessibilityRole="radiogroup"
              >
                {VIDEO_QUALITIES.map((quality) => (
                  <Pressable
                    key={quality.id}
                    testID={`quality-${quality.id}`}
                    style={[
                      styles.qualityOption,
                      currentQuality === quality.id &&
                        styles.qualityOptionSelected,
                    ]}
                    onPress={() => onQualityChange(quality.id)}
                    accessibilityRole="radio"
                    accessibilityState={{
                      selected: currentQuality === quality.id,
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.qualityName,
                        currentQuality === quality.id &&
                          styles.qualityNameSelected,
                      ]}
                    >
                      {quality.name}
                    </ThemedText>
                    <ThemedText style={styles.qualityResolution}>
                      {quality.resolution}
                    </ThemedText>
                    {quality.id === "1080p" && (
                      <ThemedText style={styles.qualityNote}>
                        Best quality
                      </ThemedText>
                    )}
                    {quality.id === "720p" && (
                      <ThemedText style={styles.qualityNote}>
                        Smaller file
                      </ThemedText>
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Export Button */}
              <Pressable
                testID="export-button"
                style={styles.exportButton}
                onPress={onExport}
                accessibilityRole="button"
                accessibilityState={{ disabled: false }}
              >
                <ThemedText style={styles.exportButtonText}>
                  Start Export
                </ThemedText>
              </Pressable>
            </View>
          )}

          {isProcessing && (
            <View style={styles.content}>
              {/* Progress Status */}
              <View style={styles.progressContainer}>
                <ThemedText style={styles.statusText}>
                  {getStatusMessage()}
                </ThemedText>

                {/* Progress Bar */}
                <View
                  testID="progress-bar"
                  style={styles.progressBarContainer}
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: 100,
                    now: progress,
                  }}
                >
                  <View
                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                  />
                </View>

                {/* Progress Percentage */}
                <ThemedText style={styles.progressText}>{progress}%</ThemedText>
              </View>

              {/* Cancel Button (not during saving) */}
              {status !== "saving" ? (
                <Pressable
                  testID="cancel-button"
                  style={styles.cancelButton}
                  onPress={onCancel}
                  accessibilityRole="button"
                >
                  <ThemedText style={styles.cancelButtonText}>
                    Cancel
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  testID="cancel-button"
                  style={[styles.cancelButton, styles.cancelButtonDisabled]}
                  disabled
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                >
                  <ThemedText style={styles.cancelButtonTextDisabled}>
                    Cancel
                  </ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {status === "complete" && (
            <View style={styles.content}>
              {/* Success Icon */}
              <View testID="success-icon" style={styles.successIcon}>
                <ThemedText style={styles.successIconText}>🎉</ThemedText>
              </View>

              <ThemedText style={styles.successText}>
                Your Year in Review video has been saved to your camera roll!
              </ThemedText>

              {/* Progress Bar at 100% */}
              <View
                testID="progress-bar"
                style={styles.progressBarContainer}
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: 100,
                  now: 100,
                }}
              >
                <View style={[styles.progressBarFill, { width: "100%" }]} />
              </View>
              <ThemedText style={styles.progressText}>100%</ThemedText>

              {/* Action Buttons */}
              <View style={styles.completeActions}>
                <Pressable
                  testID="share-button"
                  style={styles.shareButton}
                  onPress={handleShare}
                  accessibilityRole="button"
                >
                  <ThemedText style={styles.shareButtonText}>Share</ThemedText>
                </Pressable>

                <Pressable
                  testID="done-button"
                  style={styles.doneButton}
                  onPress={onClose}
                  accessibilityRole="button"
                >
                  <ThemedText style={styles.doneButtonText}>Done</ThemedText>
                </Pressable>
              </View>
            </View>
          )}

          {status === "error" && (
            <View style={styles.content}>
              {/* Error Icon */}
              <View testID="error-icon" style={styles.errorIcon}>
                <ThemedText style={styles.errorIconText}>⚠️</ThemedText>
              </View>

              <ThemedText style={styles.errorTitle}>Export Failed</ThemedText>
              <ThemedText style={styles.errorText}>
                {error || "An unexpected error occurred"}
              </ThemedText>

              {/* Action Buttons */}
              <View style={styles.errorActions}>
                <Pressable
                  testID="retry-button"
                  style={styles.retryButton}
                  onPress={onExport}
                  accessibilityRole="button"
                >
                  <ThemedText style={styles.retryButtonText}>
                    Try Again
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    minHeight: 300,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    position: "relative",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    position: "absolute",
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#666",
  },
  content: {
    padding: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  qualitySelector: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  qualityOption: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  qualityOptionSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: `${Colors.light.tint}10`,
  },
  qualityName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  qualityNameSelected: {
    color: Colors.light.tint,
  },
  qualityResolution: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  qualityNote: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  exportButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: Spacing.md,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: SemanticColors.error,
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButtonTextDisabled: {
    color: Colors.light.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  successIcon: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  successIconText: {
    fontSize: 64,
  },
  successText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  completeActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  shareButton: {
    flex: 1,
    backgroundColor: Colors.light.border,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
  },
  shareButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  doneButton: {
    flex: 1,
    backgroundColor: Colors.light.tint,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorIcon: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  errorIconText: {
    fontSize: 64,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: SemanticColors.error,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  errorActions: {
    marginTop: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
