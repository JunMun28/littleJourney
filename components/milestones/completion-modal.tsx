/**
 * Completion Modal Component
 *
 * Modal for marking a milestone as completed with celebration date and notes.
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
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Spacing,
} from "@/constants/theme";
import {
  MILESTONE_TEMPLATES,
  type Milestone,
} from "@/contexts/milestone-context";
import { useCommunity } from "@/contexts/community-context";
import { TypicalAgeCard } from "./typical-age-card";
import { CommunityStatsCard } from "./community-stats-card";

interface CompletionModalProps {
  visible: boolean;
  milestone: Milestone | null;
  celebrationDate: Date;
  completionNotes: string;
  showDatePicker: boolean;
  childBirthDate?: string;
  onDateChange: (date: Date) => void;
  onNotesChange: (notes: string) => void;
  onShowDatePicker: (show: boolean) => void;
  onComplete: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function CompletionModal({
  visible,
  milestone,
  celebrationDate,
  completionNotes,
  showDatePicker,
  childBirthDate,
  onDateChange,
  onNotesChange,
  onShowDatePicker,
  onComplete,
  onDelete,
  onClose,
}: CompletionModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { getMilestoneStatistics, communityDataSharingEnabled } =
    useCommunity();

  if (!milestone) return null;

  const title =
    milestone.customTitle ??
    MILESTONE_TEMPLATES.find((t) => t.id === milestone.templateId)?.title ??
    "Milestone";

  const stats =
    milestone.templateId && communityDataSharingEnabled
      ? getMilestoneStatistics(milestone.templateId)
      : null;

  return (
    <Modal visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={[styles.fullModal, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[styles.fullModalHeader, { borderBottomColor: colors.border }]}
        >
          <Pressable onPress={onClose}>
            <Text style={styles.backButton}>Cancel</Text>
          </Pressable>
          <ThemedText type="subtitle">Mark as Completed</ThemedText>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.formContainer}>
          <Text style={[styles.completionTitle, { color: colors.text }]}>
            {title}
          </Text>

          {/* AIDETECT-007: Typical Age Range Card */}
          {milestone.templateId && childBirthDate && (
            <TypicalAgeCard
              templateId={milestone.templateId}
              childBirthDate={childBirthDate}
              celebrationDate={celebrationDate}
            />
          )}

          {/* COMMUNITY-002: Community Statistics */}
          {stats && <CommunityStatsCard stats={stats} />}

          <Text style={[styles.label, { color: colors.text }]}>
            Celebration Date
          </Text>
          <Pressable
            style={[styles.dateButton, { borderColor: colors.inputBorder }]}
            onPress={() => onShowDatePicker(true)}
          >
            <Text style={[styles.dateButtonText, { color: colors.text }]}>
              {celebrationDate.toLocaleDateString("en-SG")}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={celebrationDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, date) => {
                onShowDatePicker(Platform.OS === "ios");
                if (date) onDateChange(date);
              }}
            />
          )}

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.background,
                color: colors.text,
              },
            ]}
            value={completionNotes}
            onChangeText={onNotesChange}
            placeholder="Add notes about this milestone..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
          />

          <Pressable style={styles.submitButton} onPress={onComplete}>
            <Text style={styles.submitButtonText}>Complete Milestone</Text>
          </Pressable>

          <Pressable
            style={[styles.deleteButton, { borderColor: SemanticColors.error }]}
            onPress={onDelete}
          >
            <Text
              style={[styles.deleteButtonText, { color: SemanticColors.error }]}
            >
              Delete Milestone
            </Text>
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
  completionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
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
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
