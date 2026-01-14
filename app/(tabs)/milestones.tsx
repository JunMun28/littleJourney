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

const PRIMARY_COLOR = "#0a7ea4";

type ModalState = "closed" | "selectTemplate" | "addCustom" | "complete";

export default function MilestonesScreen() {
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
        style={styles.milestoneCard}
        onPress={() => handleOpenCompletion(item)}
      >
        <View style={styles.milestoneHeader}>
          <Text style={styles.milestoneTitle}>
            {title}
            {localTitle && (
              <Text style={styles.localTitle}> ({localTitle})</Text>
            )}
          </Text>
          {item.isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
        </View>
        {description && (
          <Text style={styles.milestoneDescription}>{description}</Text>
        )}
        <Text style={styles.milestoneDate}>
          {item.isCompleted && item.celebrationDate
            ? `Celebrated: ${new Date(item.celebrationDate).toLocaleDateString("en-SG")}`
            : `Due: ${new Date(item.milestoneDate).toLocaleDateString("en-SG")}`}
        </Text>
        {item.notes && <Text style={styles.milestoneNotes}>{item.notes}</Text>}
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🎯</Text>
      <ThemedText type="subtitle" style={styles.emptyStateTitle}>
        No Milestones Yet
      </ThemedText>
      <ThemedText style={styles.emptyStateText}>
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
              <Text style={styles.sectionTitle}>
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
              <Text style={styles.sectionTitle}>
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
          style={styles.fab}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Add Milestone</ThemedText>
              <Pressable onPress={() => setModalState("closed")}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.templateList}>
              {/* Custom milestone option */}
              <Pressable
                style={styles.templateItem}
                onPress={() => setModalState("addCustom")}
              >
                <Text style={styles.templateTitle}>+ Custom Milestone</Text>
                <Text style={styles.templateDescription}>
                  Create your own milestone
                </Text>
              </Pressable>

              {/* Template options */}
              {relevantTemplates.map((template) => (
                <Pressable
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => handleAddFromTemplate(template)}
                >
                  <Text style={styles.templateTitle}>
                    {template.title}
                    {template.titleLocal && (
                      <Text style={styles.localTitle}>
                        {" "}
                        ({template.titleLocal})
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.templateDescription}>
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
          style={styles.fullModal}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.fullModalHeader}>
            <Pressable onPress={() => setModalState("selectTemplate")}>
              <Text style={styles.backButton}>← Back</Text>
            </Pressable>
            <ThemedText type="subtitle">Custom Milestone</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="e.g., First Laugh"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={customDescription}
              onChangeText={setCustomDescription}
              placeholder="Optional description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Date</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
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
          style={styles.fullModal}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.fullModalHeader}>
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.backButton}>Cancel</Text>
            </Pressable>
            <ThemedText type="subtitle">Mark as Completed</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            {selectedMilestone && (
              <>
                <Text style={styles.completionTitle}>
                  {selectedMilestone.customTitle ??
                    MILESTONE_TEMPLATES.find(
                      (t) => t.id === selectedMilestone.templateId,
                    )?.title ??
                    "Milestone"}
                </Text>

                <Text style={styles.label}>Celebration Date</Text>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowCelebrationDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
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

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={completionNotes}
                  onChangeText={setCompletionNotes}
                  placeholder="Add notes about this milestone..."
                  placeholderTextColor="#999"
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
                  style={styles.deleteButton}
                  onPress={handleDeleteMilestone}
                >
                  <Text style={styles.deleteButtonText}>Delete Milestone</Text>
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#666",
  },
  milestoneCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  localTitle: {
    fontWeight: "400",
    color: "#666",
  },
  completedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  milestoneDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  milestoneDate: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  milestoneNotes: {
    fontSize: 13,
    color: "#888",
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 36,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    fontSize: 28,
    color: "#666",
    paddingHorizontal: 8,
  },
  templateList: {
    padding: 16,
  },
  templateItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 12,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: "#666",
  },
  templateDays: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    marginTop: 4,
    fontWeight: "500",
  },
  fullModal: {
    flex: 1,
    backgroundColor: "#fff",
  },
  fullModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#333",
  },
  deleteButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  deleteButtonText: {
    color: "#dc3545",
    fontSize: 16,
    fontWeight: "600",
  },
});
