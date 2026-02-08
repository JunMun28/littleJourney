/**
 * Create Capsule Modal Component
 *
 * Full-screen modal for creating a new time capsule with letter,
 * voice/video attachments, and unlock date selection.
 */

import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Colors,
  SemanticColors,
  Spacing,
  PRIMARY_COLOR,
} from "@/constants/theme";
import { PRESET_UNLOCK_AGES } from "@/contexts/time-capsule-context";
import { TemplateSelector, type CapsuleTemplate } from "./template-selector";
import { formatDuration } from "./voice-recording-modal";

type UnlockOption = "age" | "custom";

interface CreateCapsuleModalProps {
  visible: boolean;
  letterContent: string;
  unlockOption: UnlockOption;
  selectedAge: number;
  customDate: Date;
  showDatePicker: boolean;
  voiceUri: string | null;
  voiceDuration: number;
  videoUri: string | null;
  videoDuration: number;
  isValid: boolean;
  onLetterChange: (content: string) => void;
  onUnlockOptionChange: (option: UnlockOption) => void;
  onAgeChange: (age: number) => void;
  onCustomDateChange: (date: Date) => void;
  onShowDatePicker: (show: boolean) => void;
  onSelectTemplate: (template: CapsuleTemplate) => void;
  onOpenVoiceModal: () => void;
  onRemoveVoice: () => void;
  onOpenVideoModal: () => void;
  onRemoveVideo: () => void;
  onSave: () => void;
  onClose: () => void;
}

export function CreateCapsuleModal({
  visible,
  letterContent,
  unlockOption,
  selectedAge,
  customDate,
  showDatePicker,
  voiceUri,
  voiceDuration,
  videoUri,
  videoDuration,
  isValid,
  onLetterChange,
  onUnlockOptionChange,
  onAgeChange,
  onCustomDateChange,
  onShowDatePicker,
  onSelectTemplate,
  onOpenVoiceModal,
  onRemoveVoice,
  onOpenVideoModal,
  onRemoveVideo,
  onSave,
  onClose,
}: CreateCapsuleModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const renderAgeSelector = () => (
    <View testID="age-selector" style={styles.ageSelector}>
      {PRESET_UNLOCK_AGES.map((age) => (
        <Pressable
          key={age}
          testID={`age-option-${age}`}
          style={[
            styles.ageOption,
            selectedAge === age && styles.ageOptionActive,
            { borderColor: colors.border },
          ]}
          onPress={() => onAgeChange(age)}
        >
          <Text
            style={[
              styles.ageOptionText,
              { color: selectedAge === age ? "#fff" : colors.text },
            ]}
          >
            {age}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={[styles.fullModal, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[styles.fullModalHeader, { borderBottomColor: colors.border }]}
        >
          <Pressable testID="cancel-create-button" onPress={onClose}>
            <Text style={styles.backButton}>Cancel</Text>
          </Pressable>
          <ThemedText type="subtitle">Write Letter</ThemedText>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.formContainer}>
          {/* CAPSULE-008: Template Selector */}
          <Text style={[styles.label, { color: colors.text }]}>
            Use a Template
          </Text>
          <TemplateSelector onSelectTemplate={onSelectTemplate} />

          <Text style={[styles.label, { color: colors.text }]}>
            Your Letter *
          </Text>
          <TextInput
            testID="letter-content-input"
            style={[
              styles.letterInput,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.background,
                color: colors.text,
              },
            ]}
            value={letterContent}
            onChangeText={onLetterChange}
            placeholder="Dear child, ..."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />

          {/* CAPSULE-002: Voice Message Section */}
          <Text style={[styles.label, { color: colors.text }]}>
            Voice Message (Optional)
          </Text>
          {voiceUri ? (
            <View
              testID="voice-attached-indicator"
              style={[
                styles.voiceAttachedContainer,
                { borderColor: colors.border },
              ]}
            >
              <View style={styles.voiceAttachedInfo}>
                <Text style={styles.voiceIcon}>🎙️</Text>
                <View>
                  <Text
                    style={[styles.voiceAttachedText, { color: colors.text }]}
                  >
                    Voice message attached
                  </Text>
                  <Text
                    style={[
                      styles.voiceDurationText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatDuration(voiceDuration)}
                  </Text>
                </View>
              </View>
              <Pressable
                testID="remove-voice-button"
                onPress={onRemoveVoice}
                style={styles.removeVoiceButton}
              >
                <Text style={styles.removeVoiceText}>✕</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              testID="add-voice-message-button"
              style={[styles.addVoiceButton, { borderColor: colors.border }]}
              onPress={onOpenVoiceModal}
            >
              <Text style={styles.addVoiceIcon}>🎙️</Text>
              <Text style={[styles.addVoiceText, { color: colors.text }]}>
                Add Voice Message
              </Text>
              <Text
                style={[
                  styles.addVoiceSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Up to 5 minutes
              </Text>
            </Pressable>
          )}

          {/* CAPSULE-003: Video Message Section */}
          <Text style={[styles.label, { color: colors.text }]}>
            Video Message (Optional)
          </Text>
          {videoUri ? (
            <View
              testID="video-attached-indicator"
              style={[
                styles.videoAttachedContainer,
                { borderColor: colors.border },
              ]}
            >
              <View style={styles.videoAttachedInfo}>
                <Text style={styles.videoIcon}>🎬</Text>
                <View>
                  <Text
                    style={[styles.videoAttachedText, { color: colors.text }]}
                  >
                    Video message attached
                  </Text>
                  <Text
                    style={[
                      styles.videoDurationText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatDuration(videoDuration)}
                  </Text>
                </View>
              </View>
              <Pressable
                testID="remove-video-button"
                onPress={onRemoveVideo}
                style={styles.removeVideoButton}
              >
                <Text style={styles.removeVideoText}>✕</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              testID="add-video-message-button"
              style={[styles.addVideoButton, { borderColor: colors.border }]}
              onPress={onOpenVideoModal}
            >
              <Text style={styles.addVideoIcon}>🎬</Text>
              <Text style={[styles.addVideoText, { color: colors.text }]}>
                Add Video Message
              </Text>
              <Text
                style={[
                  styles.addVideoSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Up to 2 minutes
              </Text>
            </Pressable>
          )}

          <Text style={[styles.label, { color: colors.text }]}>
            When to Unlock
          </Text>
          <View style={styles.unlockOptionRow}>
            <Pressable
              testID="unlock-option-age"
              style={[
                styles.unlockOptionButton,
                unlockOption === "age" && styles.unlockOptionButtonActive,
                { borderColor: colors.border },
              ]}
              onPress={() => onUnlockOptionChange("age")}
            >
              <Text
                style={[
                  styles.unlockOptionText,
                  { color: unlockOption === "age" ? "#fff" : colors.text },
                ]}
              >
                At Age
              </Text>
            </Pressable>
            <Pressable
              testID="unlock-option-custom"
              style={[
                styles.unlockOptionButton,
                unlockOption === "custom" && styles.unlockOptionButtonActive,
                { borderColor: colors.border },
              ]}
              onPress={() => onUnlockOptionChange("custom")}
            >
              <Text
                style={[
                  styles.unlockOptionText,
                  { color: unlockOption === "custom" ? "#fff" : colors.text },
                ]}
              >
                Custom Date
              </Text>
            </Pressable>
          </View>

          {unlockOption === "age" && (
            <>
              <Text
                style={[styles.helperText, { color: colors.textSecondary }]}
              >
                Select the age when your child can read this letter:
              </Text>
              {renderAgeSelector()}
            </>
          )}

          {unlockOption === "custom" && (
            <>
              <Text
                style={[styles.helperText, { color: colors.textSecondary }]}
              >
                Choose a specific date for the letter to unlock:
              </Text>
              <Pressable
                testID="custom-date-button"
                style={[styles.dateButton, { borderColor: colors.inputBorder }]}
                onPress={() => onShowDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {customDate.toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  testID="unlock-date-picker"
                  value={customDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    onShowDatePicker(Platform.OS === "ios");
                    if (date) onCustomDateChange(date);
                  }}
                />
              )}
            </>
          )}

          <View style={styles.infoBox}>
            <Text style={[styles.infoIcon]}>🔒</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Once saved, the letter will be sealed and cannot be edited.
              Content stays hidden until the unlock date.
            </Text>
          </View>

          <Pressable
            testID="save-capsule-button"
            style={[
              styles.submitButton,
              !isValid && styles.submitButtonDisabled,
            ]}
            onPress={onSave}
            disabled={!isValid}
          >
            <Text style={styles.submitButtonText}>Seal & Save</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullModal: {
    flex: 1,
  },
  fullModalHeader: {
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
  formContainer: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  letterInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 200,
    marginBottom: Spacing.xl,
  },
  helperText: {
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  unlockOptionRow: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  unlockOptionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  unlockOptionButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  unlockOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  ageSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.xl,
  },
  ageOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ageOptionActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  ageOptionText: {
    fontSize: 18,
    fontWeight: "700",
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dateButtonText: {
    fontSize: 16,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: SemanticColors.infoLight,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.xl,
    alignItems: "flex-start",
  },
  infoIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Voice message styles
  addVoiceButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.lg,
    alignItems: "center",
    borderStyle: "dashed",
    marginBottom: Spacing.xl,
  },
  addVoiceIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  addVoiceText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addVoiceSubtext: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  voiceAttachedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: SemanticColors.successLight,
    borderColor: SemanticColors.success,
  },
  voiceAttachedInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  voiceAttachedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  voiceDurationText: {
    fontSize: 12,
    marginTop: 2,
  },
  removeVoiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeVoiceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Video message styles
  addVideoButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.lg,
    alignItems: "center",
    borderStyle: "dashed",
    marginBottom: Spacing.xl,
  },
  addVideoIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  addVideoText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addVideoSubtext: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  videoAttachedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: "#E8F4FD",
    borderColor: "#4A90D9",
  },
  videoAttachedInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  videoIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  videoAttachedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  videoDurationText: {
    fontSize: 12,
    marginTop: 2,
  },
  removeVideoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeVideoText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
