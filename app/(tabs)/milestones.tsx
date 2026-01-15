import { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  useMilestones,
  MILESTONE_TEMPLATES,
  type Milestone,
  type MilestoneTemplate,
} from "@/contexts/milestone-context";
import { useChild } from "@/contexts/child-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Shadows,
  Spacing,
} from "@/constants/theme";

type ModalState = "closed" | "selectTemplate" | "addCustom" | "complete";

export default function MilestonesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const {
    milestones,
    upcomingMilestones,
    completedMilestones,
    addMilestone,
    completeMilestone,
    deleteMilestone,
  } = useMilestones();
  const { child } = useChild();

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [milestoneDate, setMilestoneDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Completion modal state
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null,
  );
  const [celebrationDate, setCelebrationDate] = useState(new Date());
  const [showCelebrationDatePicker, setShowCelebrationDatePicker] =
    useState(false);
  const [completionNotes, setCompletionNotes] = useState("");

  // Filter templates by child's cultural tradition
  const relevantTemplates = useMemo(() => {
    const tradition = child?.culturalTradition;
    return MILESTONE_TEMPLATES.filter(
      (t) =>
        t.culturalTradition === "universal" ||
        t.culturalTradition === tradition ||
        tradition === "none",
    );
  }, [child?.culturalTradition]);

  const handleAddFromTemplate = (template: MilestoneTemplate) => {
    if (!child) return;

    // Calculate date if daysFromBirth is specified
    let date = milestoneDate;
    if (template.daysFromBirth && child.dateOfBirth) {
      const birthDate = new Date(child.dateOfBirth);
      date = new Date(birthDate);
      date.setDate(birthDate.getDate() + template.daysFromBirth);
    }

    addMilestone({
      templateId: template.id,
      childId: "child-1", // TODO: Get from child context
      milestoneDate: date.toISOString().split("T")[0],
    });
    setModalState("closed");
  };

  const handleAddCustom = () => {
    if (!customTitle.trim()) return;

    addMilestone({
      childId: "child-1", // TODO: Get from child context
      milestoneDate: milestoneDate.toISOString().split("T")[0],
      customTitle: customTitle.trim(),
      customDescription: customDescription.trim() || undefined,
    });
    setModalState("closed");
    setCustomTitle("");
    setCustomDescription("");
    setMilestoneDate(new Date());
  };

  const handleOpenCompletion = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setCelebrationDate(new Date());
    setCompletionNotes("");
    setModalState("complete");
  };

  const handleCompleteMilestone = () => {
    if (!selectedMilestone) return;

    completeMilestone(selectedMilestone.id, {
      celebrationDate: celebrationDate.toISOString().split("T")[0],
      notes: completionNotes.trim() || undefined,
    });
    setModalState("closed");
    setSelectedMilestone(null);
    setCompletionNotes("");
  };

  const handleDeleteMilestone = () => {
    if (!selectedMilestone) return;

    deleteMilestone(selectedMilestone.id);
    setModalState("closed");
    setSelectedMilestone(null);
    setCompletionNotes("");
  };

  const renderMilestoneCard = ({ item }: { item: Milestone }) => {
    const template = MILESTONE_TEMPLATES.find((t) => t.id === item.templateId);
    const title = item.customTitle ?? template?.title ?? "Milestone";
    const description = item.customDescription ?? template?.description ?? "";
    const localTitle = template?.titleLocal;

    return (
      <Pressable
        style={[
          styles.milestoneCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          Shadows.small,
        ]}
        onPress={() => handleOpenCompletion(item)}
      >
        <View style={styles.milestoneHeader}>
          <Text style={[styles.milestoneTitle, { color: colors.text }]}>
            {title}
            {localTitle && (
              <Text
                style={[styles.localTitle, { color: colors.textSecondary }]}
              >
                {" "}
                ({localTitle})
              </Text>
            )}
          </Text>
          {item.isCompleted && (
            <View
              style={[
                styles.completedBadge,
                { backgroundColor: SemanticColors.success },
              ]}
            >
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
        </View>
        {description && (
          <Text
            style={[
              styles.milestoneDescription,
              { color: colors.textSecondary },
            ]}
          >
            {description}
          </Text>
        )}
        <Text style={styles.milestoneDate}>
          {item.isCompleted && item.celebrationDate
            ? `Celebrated: ${new Date(item.celebrationDate).toLocaleDateString("en-SG")}`
            : `Due: ${new Date(item.milestoneDate).toLocaleDateString("en-SG")}`}
        </Text>
        {item.notes && (
          <Text style={[styles.milestoneNotes, { color: colors.textMuted }]}>
            {item.notes}
          </Text>
        )}
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🎯</Text>
      <ThemedText type="subtitle" style={styles.emptyStateTitle}>
        No Milestones Yet
      </ThemedText>
      <ThemedText
        style={[styles.emptyStateText, { color: colors.textSecondary }]}
      >
        Track your baby&apos;s special moments and cultural celebrations.
      </ThemedText>
      <Pressable
        style={styles.emptyStateButton}
        onPress={() => setModalState("selectTemplate")}
      >
        <Text style={styles.emptyStateButtonText}>Add First Milestone</Text>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {milestones.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Upcoming Section */}
          {upcomingMilestones.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Upcoming ({upcomingMilestones.length})
              </Text>
              {upcomingMilestones.map((milestone) => (
                <View key={milestone.id}>
                  {renderMilestoneCard({ item: milestone })}
                </View>
              ))}
            </View>
          )}

          {/* Completed Section */}
          {completedMilestones.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Completed ({completedMilestones.length})
              </Text>
              {completedMilestones.map((milestone) => (
                <View key={milestone.id}>
                  {renderMilestoneCard({ item: milestone })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB to add milestone */}
      {milestones.length > 0 && (
        <Pressable
          style={[styles.fab, Shadows.large]}
          onPress={() => setModalState("selectTemplate")}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      {/* Template Selection Modal */}
      <Modal
        visible={modalState === "selectTemplate"}
        animationType="slide"
        transparent
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <ThemedText type="subtitle">Add Milestone</ThemedText>
              <Pressable onPress={() => setModalState("closed")}>
                <Text
                  style={[styles.closeButton, { color: colors.textSecondary }]}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.templateList}>
              {/* Custom milestone option */}
              <Pressable
                style={[
                  styles.templateItem,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
                onPress={() => setModalState("addCustom")}
              >
                <Text style={[styles.templateTitle, { color: colors.text }]}>
                  + Custom Milestone
                </Text>
                <Text
                  style={[
                    styles.templateDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Create your own milestone
                </Text>
              </Pressable>

              {/* Template options */}
              {relevantTemplates.map((template) => (
                <Pressable
                  key={template.id}
                  style={[
                    styles.templateItem,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={() => handleAddFromTemplate(template)}
                >
                  <Text style={[styles.templateTitle, { color: colors.text }]}>
                    {template.title}
                    {template.titleLocal && (
                      <Text
                        style={[
                          styles.localTitle,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {" "}
                        ({template.titleLocal})
                      </Text>
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.templateDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {template.description}
                  </Text>
                  {template.daysFromBirth && (
                    <Text style={styles.templateDays}>
                      Day {template.daysFromBirth}
                    </Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Milestone Modal */}
      <Modal visible={modalState === "addCustom"} animationType="slide">
        <KeyboardAvoidingView
          style={[styles.fullModal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.fullModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable onPress={() => setModalState("selectTemplate")}>
              <Text style={styles.backButton}>← Back</Text>
            </Pressable>
            <ThemedText type="subtitle">Custom Milestone</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="e.g., First Laugh"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Description
            </Text>
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
              value={customDescription}
              onChangeText={setCustomDescription}
              placeholder="Optional description"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.label, { color: colors.text }]}>Date</Text>
            <Pressable
              style={[styles.dateButton, { borderColor: colors.inputBorder }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {milestoneDate.toLocaleDateString("en-SG")}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={milestoneDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) setMilestoneDate(date);
                }}
              />
            )}

            <Pressable
              style={[
                styles.submitButton,
                !customTitle.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleAddCustom}
              disabled={!customTitle.trim()}
            >
              <Text style={styles.submitButtonText}>Add Milestone</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Completion Modal */}
      <Modal visible={modalState === "complete"} animationType="slide">
        <KeyboardAvoidingView
          style={[styles.fullModal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.fullModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.backButton}>Cancel</Text>
            </Pressable>
            <ThemedText type="subtitle">Mark as Completed</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            {selectedMilestone && (
              <>
                <Text style={[styles.completionTitle, { color: colors.text }]}>
                  {selectedMilestone.customTitle ??
                    MILESTONE_TEMPLATES.find(
                      (t) => t.id === selectedMilestone.templateId,
                    )?.title ??
                    "Milestone"}
                </Text>

                <Text style={[styles.label, { color: colors.text }]}>
                  Celebration Date
                </Text>
                <Pressable
                  style={[
                    styles.dateButton,
                    { borderColor: colors.inputBorder },
                  ]}
                  onPress={() => setShowCelebrationDatePicker(true)}
                >
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {celebrationDate.toLocaleDateString("en-SG")}
                  </Text>
                </Pressable>
                {showCelebrationDatePicker && (
                  <DateTimePicker
                    value={celebrationDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, date) => {
                      setShowCelebrationDatePicker(Platform.OS === "ios");
                      if (date) setCelebrationDate(date);
                    }}
                  />
                )}

                <Text style={[styles.label, { color: colors.text }]}>
                  Notes
                </Text>
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
                  onChangeText={setCompletionNotes}
                  placeholder="Add notes about this milestone..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={4}
                />

                <Pressable
                  style={styles.submitButton}
                  onPress={handleCompleteMilestone}
                >
                  <Text style={styles.submitButtonText}>
                    Complete Milestone
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.deleteButton,
                    { borderColor: SemanticColors.error },
                  ]}
                  onPress={handleDeleteMilestone}
                >
                  <Text
                    style={[
                      styles.deleteButtonText,
                      { color: SemanticColors.error },
                    ]}
                  >
                    Delete Milestone
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  milestoneCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  milestoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  localTitle: {
    fontWeight: "400",
  },
  completedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  milestoneDescription: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  milestoneDate: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  milestoneNotes: {
    fontSize: 13,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyStateText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  emptyStateButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 36,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  closeButton: {
    fontSize: 28,
    paddingHorizontal: Spacing.sm,
  },
  templateList: {
    padding: Spacing.lg,
  },
  templateItem: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  templateDescription: {
    fontSize: 14,
  },
  templateDays: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    marginTop: Spacing.xs,
    fontWeight: "500",
  },
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xl,
    textAlign: "center",
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
