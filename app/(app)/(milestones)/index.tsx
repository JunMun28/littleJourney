import { useState, useMemo, useCallback } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, Target, Award, Calendar } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  MilestoneCard,
  CategoryFilter,
  CompletionModal,
  FirstWordsModal,
  type MilestoneCategory,
} from "@/components/milestones";
import {
  MILESTONE_TEMPLATES,
  type Milestone,
  type MilestoneTemplate,
  type FirstWordLanguage,
  type FirstWordData,
} from "@/contexts/milestone-context";
import {
  useMilestonesFlat,
  useCreateMilestone,
  useCompleteMilestone,
  useDeleteMilestone,
} from "@/hooks/use-milestones";
import { useChildFlat } from "@/hooks/use-children";
import { useNotifications } from "@/contexts/notification-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PRIMARY_COLOR, Colors, Spacing } from "@/constants/theme";
import { Primary } from "@/constants/design-tokens";
import { Confetti, useConfetti } from "@/components/ui/confetti";
import { FAB } from "@/components/ui/fab";
import { Button } from "@/components/ui/button";
import { Entering } from "@/utils/animations";

type ModalState =
  | "closed"
  | "selectTemplate"
  | "addCustom"
  | "complete"
  | "firstWords";

type TabType = "upcoming" | "completed";

export default function MilestonesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // UI-016: Category filter state
  const [selectedCategory, setSelectedCategory] =
    useState<MilestoneCategory>("all");

  // UI-019: Tab state
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const tabIndicatorPosition = useSharedValue(0);

  // UI-018: Confetti for celebration
  const {
    active: confettiActive,
    fire: fireConfetti,
    handleComplete: handleConfettiComplete,
  } = useConfetti();

  // TanStack Query hooks for milestone operations
  const { milestones, upcomingMilestones, completedMilestones } =
    useMilestonesFlat();
  const createMilestone = useCreateMilestone();
  const completeMilestoneMutation = useCompleteMilestone();
  const deleteMilestoneMutation = useDeleteMilestone();

  const { child } = useChildFlat();
  const { scheduleMilestoneReminder, cancelMilestoneReminder } =
    useNotifications();

  // Default days before milestone to send reminder
  const REMINDER_DAYS_BEFORE = 7;

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

  // First words state
  const [firstWord, setFirstWord] = useState("");
  const [firstWordRomanization, setFirstWordRomanization] = useState("");
  const [firstWordLanguage, setFirstWordLanguage] =
    useState<FirstWordLanguage>("english");
  const [showFirstWordsDatePicker, setShowFirstWordsDatePicker] =
    useState(false);
  const [firstWordsDate, setFirstWordsDate] = useState(new Date());

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

  const handleAddFromTemplate = async (template: MilestoneTemplate) => {
    if (!child?.id) return;

    if (template.id === "first_words") {
      setFirstWord("");
      setFirstWordRomanization("");
      setFirstWordLanguage("english");
      setFirstWordsDate(new Date());
      router.push("./first-words");
      return;
    }

    let date = milestoneDate;
    if (template.daysFromBirth && child.dateOfBirth) {
      const birthDate = new Date(child.dateOfBirth);
      date = new Date(birthDate);
      date.setDate(birthDate.getDate() + template.daysFromBirth);
    }

    const milestoneDateStr = date.toISOString().split("T")[0];

    createMilestone.mutate(
      {
        templateId: template.id,
        childId: child.id,
        milestoneDate: milestoneDateStr,
      },
      {
        onSuccess: async (newMilestone) => {
          await scheduleMilestoneReminder(
            newMilestone.id,
            template.title,
            milestoneDateStr,
            REMINDER_DAYS_BEFORE,
          );
        },
      },
    );

    setModalState("closed");
  };

  const handleAddCustom = () => {
    if (!customTitle.trim() || !child?.id) return;

    const milestoneDateStr = milestoneDate.toISOString().split("T")[0];
    const title = customTitle.trim();

    createMilestone.mutate(
      {
        childId: child.id,
        milestoneDate: milestoneDateStr,
        customTitle: title,
        customDescription: customDescription.trim() || undefined,
      },
      {
        onSuccess: async (newMilestone) => {
          await scheduleMilestoneReminder(
            newMilestone.id,
            title,
            milestoneDateStr,
            REMINDER_DAYS_BEFORE,
          );
        },
      },
    );

    setModalState("closed");
    setCustomTitle("");
    setCustomDescription("");
    setMilestoneDate(new Date());
  };

  const handleAddFirstWords = () => {
    if (!firstWord.trim() || !child?.id) return;

    const milestoneDateStr = firstWordsDate.toISOString().split("T")[0];
    const firstWordData: FirstWordData = {
      word: firstWord.trim(),
      romanization: firstWordRomanization.trim() || undefined,
      language: firstWordLanguage,
    };

    createMilestone.mutate(
      {
        templateId: "first_words",
        childId: child.id,
        milestoneDate: milestoneDateStr,
        firstWordData,
      },
      {
        onSuccess: async (newMilestone) => {
          await scheduleMilestoneReminder(
            newMilestone.id,
            "First Words",
            milestoneDateStr,
            REMINDER_DAYS_BEFORE,
          );
        },
      },
    );

    setModalState("closed");
    setFirstWord("");
    setFirstWordRomanization("");
    setFirstWordLanguage("english");
    setFirstWordsDate(new Date());
  };

  const handleOpenCompletion = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setCelebrationDate(new Date());
    setCompletionNotes("");
    router.push(`./complete/${milestone.id}`);
  };

  const handleCompleteMilestone = () => {
    if (!selectedMilestone) return;

    const milestoneId = selectedMilestone.id;

    completeMilestoneMutation.mutate(
      {
        id: milestoneId,
        celebrationDate: celebrationDate.toISOString().split("T")[0],
        notes: completionNotes.trim() || undefined,
      },
      {
        onSuccess: async () => {
          await cancelMilestoneReminder(milestoneId);
          fireConfetti();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    );

    setModalState("closed");
    setSelectedMilestone(null);
    setCompletionNotes("");
  };

  const handleDeleteMilestone = () => {
    if (!selectedMilestone) return;

    const milestoneId = selectedMilestone.id;

    deleteMilestoneMutation.mutate(milestoneId, {
      onSuccess: async () => {
        await cancelMilestoneReminder(milestoneId);
      },
    });

    setModalState("closed");
    setSelectedMilestone(null);
    setCompletionNotes("");
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
      <Button variant="primary" onPress={() => setModalState("selectTemplate")}>
        Add First Milestone
      </Button>
    </View>
  );

  const handleTabSwitch = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      tabIndicatorPosition.value = withSpring(tab === "upcoming" ? 0 : 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [tabIndicatorPosition],
  );

  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorPosition.value * 160 }],
  }));

  const filterByCategory = useCallback(
    (list: typeof upcomingMilestones) => {
      if (selectedCategory === "all") return list;
      return list;
    },
    [selectedCategory],
  );

  const displayedMilestones =
    activeTab === "upcoming"
      ? filterByCategory(upcomingMilestones)
      : filterByCategory(completedMilestones);

  return (
    <ThemedView style={styles.container}>
      <Confetti active={confettiActive} onComplete={handleConfettiComplete} />

      {/* Quick Actions Row */}
      <View style={styles.quickActionsRow}>
        <Pressable
          style={[styles.quickActionButton, { backgroundColor: colors.card }]}
          onPress={() => router.push("./development-timeline")}
          testID="development-timeline-button"
        >
          <Calendar size={20} color={colors.text} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            Timeline
          </Text>
        </Pressable>
        <Pressable
          style={[styles.quickActionButton, { backgroundColor: colors.card }]}
          onPress={() => router.push("./badges")}
          testID="badges-button"
        >
          <Award size={20} color={colors.text} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            Badges
          </Text>
        </Pressable>
      </View>

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Tab Switcher */}
      {milestones.length > 0 && (
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Animated.View
            style={[
              styles.tabIndicator,
              { backgroundColor: Primary[500] },
              tabIndicatorStyle,
            ]}
          />
          <Pressable
            style={styles.tab}
            onPress={() => handleTabSwitch("upcoming")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "upcoming"
                      ? Primary[500]
                      : colors.textSecondary,
                },
              ]}
            >
              Upcoming ({upcomingMilestones.length})
            </Text>
          </Pressable>
          <Pressable
            style={styles.tab}
            onPress={() => handleTabSwitch("completed")}
          >
            <View style={styles.tabLabelRow}>
              {activeTab === "completed" && (
                <Check size={14} color={Primary[500]} style={styles.tabIcon} />
              )}
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "completed"
                        ? Primary[500]
                        : colors.textSecondary,
                  },
                ]}
              >
                Completed ({completedMilestones.length})
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      {milestones.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.scrollView}>
          {displayedMilestones.length > 0 ? (
            displayedMilestones.map((milestone, index) => (
              <Animated.View
                key={milestone.id}
                entering={reduceMotion ? undefined : Entering.listItem(index)}
              >
                <MilestoneCard
                  milestone={milestone}
                  onPress={handleOpenCompletion}
                />
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyTabState}>
              <Target size={48} color={colors.textMuted} />
              <Text
                style={[styles.emptyTabText, { color: colors.textSecondary }]}
              >
                {activeTab === "upcoming"
                  ? "No upcoming milestones"
                  : "No completed milestones yet"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB to add milestone */}
      {milestones.length > 0 && (
        <FAB
          icon="plus"
          onPress={() => setModalState("selectTemplate")}
          testID="add-milestone-fab"
        />
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
              <Pressable
                style={[
                  styles.templateItem,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
                onPress={() => router.push("./create-custom")}
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

              {relevantTemplates.map((template) => (
                <Pressable
                  key={template.id}
                  style={[
                    styles.templateItem,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={() => handleAddFromTemplate(template)}
                  testID={`template-${template.id}`}
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

            <Button
              variant="primary"
              fullWidth
              disabled={!customTitle.trim()}
              onPress={handleAddCustom}
            >
              Add Milestone
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Completion Modal */}
      <CompletionModal
        visible={modalState === "complete"}
        milestone={selectedMilestone}
        celebrationDate={celebrationDate}
        completionNotes={completionNotes}
        showDatePicker={showCelebrationDatePicker}
        childBirthDate={child?.dateOfBirth}
        onDateChange={setCelebrationDate}
        onNotesChange={setCompletionNotes}
        onShowDatePicker={setShowCelebrationDatePicker}
        onComplete={handleCompleteMilestone}
        onDelete={handleDeleteMilestone}
        onClose={() => setModalState("closed")}
      />

      {/* First Words Modal */}
      <FirstWordsModal
        visible={modalState === "firstWords"}
        firstWord={firstWord}
        firstWordRomanization={firstWordRomanization}
        firstWordLanguage={firstWordLanguage}
        firstWordsDate={firstWordsDate}
        showDatePicker={showFirstWordsDatePicker}
        onWordChange={setFirstWord}
        onRomanizationChange={setFirstWordRomanization}
        onLanguageChange={setFirstWordLanguage}
        onDateChange={setFirstWordsDate}
        onShowDatePicker={setShowFirstWordsDatePicker}
        onSubmit={handleAddFirstWords}
        onClose={() => setModalState("selectTemplate")}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    margin: Spacing.md,
    marginBottom: 0,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: 12,
    padding: 4,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 160,
    height: 36,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabIcon: {
    marginRight: 4,
  },
  emptyTabState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyTabText: {
    marginTop: Spacing.md,
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
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
  localTitle: {
    fontWeight: "400",
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
});
