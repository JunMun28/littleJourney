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
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  MILESTONE_TEMPLATES,
  LANGUAGE_LABELS,
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
import { useCommunity } from "@/contexts/community-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Shadows,
  Spacing,
} from "@/constants/theme";

type ModalState =
  | "closed"
  | "selectTemplate"
  | "addCustom"
  | "complete"
  | "firstWords"; // SGLOCAL-002: Bilingual first words

// Calculate days until milestone and format countdown text (PRD Section 5.3)
function getCountdownText(milestoneDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const milestone = new Date(milestoneDate);
  milestone.setHours(0, 0, 0, 0);

  const diffTime = milestone.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else {
    return `in ${diffDays} days`;
  }
}

export default function MilestonesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  // TanStack Query hooks for milestone operations
  const { milestones, upcomingMilestones, completedMilestones } =
    useMilestonesFlat();
  const createMilestone = useCreateMilestone();
  const completeMilestoneMutation = useCompleteMilestone();
  const deleteMilestoneMutation = useDeleteMilestone();

  const { child } = useChildFlat();
  const { scheduleMilestoneReminder, cancelMilestoneReminder } =
    useNotifications();
  const { getMilestoneStatistics, communityDataSharingEnabled } =
    useCommunity();

  // Default days before milestone to send reminder (PRD Section 7.1)
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

  // SGLOCAL-002: First words state
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

    // SGLOCAL-002: Show special modal for First Words to capture language
    if (template.id === "first_words") {
      setFirstWord("");
      setFirstWordRomanization("");
      setFirstWordLanguage("english");
      setFirstWordsDate(new Date());
      setModalState("firstWords");
      return;
    }

    // Calculate date if daysFromBirth is specified
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
          // Schedule reminder notification (PRD 7.1)
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
          // Schedule reminder notification (PRD 7.1)
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

  // SGLOCAL-002: Handle adding first words milestone with language
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
          // Schedule reminder notification (PRD 7.1)
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
    setModalState("complete");
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
          // Cancel reminder notification since milestone is completed (PRD 7.1)
          await cancelMilestoneReminder(milestoneId);
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
        // Cancel reminder notification since milestone is deleted (PRD 7.1)
        await cancelMilestoneReminder(milestoneId);
      },
    });

    setModalState("closed");
    setSelectedMilestone(null);
    setCompletionNotes("");
  };

  const renderMilestoneCard = ({ item }: { item: Milestone }) => {
    const template = MILESTONE_TEMPLATES.find((t) => t.id === item.templateId);
    const title = item.customTitle ?? template?.title ?? "Milestone";
    const description = item.customDescription ?? template?.description ?? "";
    const localTitle = template?.titleLocal;

    // SGLOCAL-002: Format first word display with language tag
    const firstWordDisplay = item.firstWordData
      ? `"${item.firstWordData.word}"${item.firstWordData.romanization ? ` (${item.firstWordData.romanization})` : ""}`
      : null;
    const languageTag = item.firstWordData
      ? LANGUAGE_LABELS[item.firstWordData.language].split(" ")[0] // Just use first word like "English", "Mandarin"
      : null;

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
        {/* SGLOCAL-002: Display first word with language tag */}
        {firstWordDisplay && (
          <View style={styles.firstWordContainer}>
            <Text style={[styles.firstWordText, { color: colors.text }]}>
              {firstWordDisplay}
            </Text>
            {languageTag && (
              <View
                style={[
                  styles.languageTag,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Text style={[styles.languageTagText, { color: colors.text }]}>
                  {languageTag}
                </Text>
              </View>
            )}
          </View>
        )}
        {description && !firstWordDisplay && (
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
            : `${new Date(item.milestoneDate).toLocaleDateString("en-SG")} · ${getCountdownText(item.milestoneDate)}`}
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
      {/* Badges button */}
      <Pressable
        style={[styles.badgesButton, { backgroundColor: colors.card }]}
        onPress={() => router.push("/badges")}
        testID="badges-button"
      >
        <Text style={styles.badgesButtonIcon}>🏆</Text>
        <Text style={[styles.badgesButtonText, { color: colors.text }]}>
          View Badges
        </Text>
        <Text
          style={[styles.badgesButtonArrow, { color: colors.textSecondary }]}
        >
          →
        </Text>
      </Pressable>

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

                {/* COMMUNITY-002: Community Statistics */}
                {communityDataSharingEnabled &&
                  selectedMilestone.templateId &&
                  (() => {
                    const stats = getMilestoneStatistics(
                      selectedMilestone.templateId,
                    );
                    if (!stats) return null;
                    return (
                      <View
                        style={[
                          styles.statisticsCard,
                          { backgroundColor: colors.backgroundSecondary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statisticsTitle,
                            { color: colors.text },
                          ]}
                        >
                          📊 Community Statistics
                        </Text>
                        <Text
                          style={[
                            styles.statisticsRange,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Typical range: {stats.typicalRangeMonths.min}-
                          {stats.typicalRangeMonths.max} months
                        </Text>
                        <View style={styles.distributionContainer}>
                          {stats.distribution.map((bucket) => (
                            <View
                              key={bucket.ageMonths}
                              style={styles.distributionBar}
                            >
                              <View
                                style={[
                                  styles.barFill,
                                  {
                                    height: `${bucket.percentage}%`,
                                    backgroundColor: PRIMARY_COLOR,
                                  },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.barLabel,
                                  { color: colors.textMuted },
                                ]}
                              >
                                {bucket.ageMonths}m
                              </Text>
                            </View>
                          ))}
                        </View>
                        <Text
                          style={[
                            styles.statisticsDisclaimer,
                            { color: colors.textMuted },
                          ]}
                        >
                          Every child develops at their own pace. These
                          statistics are for reference only.
                        </Text>
                        <Text
                          style={[
                            styles.statisticsDataPoints,
                            { color: colors.textMuted },
                          ]}
                        >
                          Based on {stats.totalDataPoints.toLocaleString()}{" "}
                          families
                        </Text>
                      </View>
                    );
                  })()}

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

      {/* SGLOCAL-002: First Words Modal with Language Selection */}
      <Modal visible={modalState === "firstWords"} animationType="slide">
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
            <ThemedText type="subtitle">First Words</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Language *
            </Text>
            <View style={styles.languageOptions}>
              {(
                Object.entries(LANGUAGE_LABELS) as [FirstWordLanguage, string][]
              ).map(([key, label]) => (
                <Pressable
                  key={key}
                  style={[
                    styles.languageOption,
                    {
                      borderColor:
                        firstWordLanguage === key
                          ? PRIMARY_COLOR
                          : colors.inputBorder,
                      backgroundColor:
                        firstWordLanguage === key
                          ? `${PRIMARY_COLOR}15`
                          : colors.background,
                    },
                  ]}
                  onPress={() => setFirstWordLanguage(key)}
                  testID={`language-option-${key}`}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      {
                        color:
                          firstWordLanguage === key
                            ? PRIMARY_COLOR
                            : colors.text,
                        fontWeight: firstWordLanguage === key ? "600" : "400",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>
              The Word *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              value={firstWord}
              onChangeText={setFirstWord}
              placeholder={
                firstWordLanguage === "english"
                  ? 'e.g., "Mama"'
                  : firstWordLanguage === "mandarin"
                    ? 'e.g., "妈妈"'
                    : firstWordLanguage === "malay"
                      ? 'e.g., "Mak"'
                      : 'e.g., "அம்மா"'
              }
              placeholderTextColor={colors.placeholder}
              testID="first-word-input"
            />

            {(firstWordLanguage === "mandarin" ||
              firstWordLanguage === "tamil") && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>
                  Romanization{" "}
                  {firstWordLanguage === "mandarin" ? "(Pinyin)" : "(Optional)"}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.inputBorder,
                      backgroundColor: colors.background,
                      color: colors.text,
                    },
                  ]}
                  value={firstWordRomanization}
                  onChangeText={setFirstWordRomanization}
                  placeholder={
                    firstWordLanguage === "mandarin" ? "e.g., māmā" : ""
                  }
                  placeholderTextColor={colors.placeholder}
                  testID="first-word-romanization-input"
                />
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Date</Text>
            <Pressable
              style={[styles.dateButton, { borderColor: colors.inputBorder }]}
              onPress={() => setShowFirstWordsDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {firstWordsDate.toLocaleDateString("en-SG")}
              </Text>
            </Pressable>
            {showFirstWordsDatePicker && (
              <DateTimePicker
                value={firstWordsDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, date) => {
                  setShowFirstWordsDatePicker(Platform.OS === "ios");
                  if (date) setFirstWordsDate(date);
                }}
              />
            )}

            <Pressable
              style={[
                styles.submitButton,
                !firstWord.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleAddFirstWords}
              disabled={!firstWord.trim()}
              testID="add-first-words-button"
            >
              <Text style={styles.submitButtonText}>Add First Words</Text>
            </Pressable>
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
  badgesButton: {
    flexDirection: "row",
    alignItems: "center",
    margin: Spacing.md,
    marginBottom: 0,
    padding: Spacing.md,
    borderRadius: 12,
  },
  badgesButtonIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  badgesButtonText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  badgesButtonArrow: {
    fontSize: 18,
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
  // COMMUNITY-002: Statistics styles
  statisticsCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statisticsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  statisticsRange: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  distributionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 60,
    marginBottom: Spacing.md,
  },
  distributionBar: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  barFill: {
    width: "80%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  statisticsDisclaimer: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  statisticsDataPoints: {
    fontSize: 11,
    textAlign: "center",
  },
  // SGLOCAL-002: Language selection styles
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  languageOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageOptionText: {
    fontSize: 14,
  },
  // SGLOCAL-002: First word display styles
  firstWordContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  firstWordText: {
    fontSize: 16,
    fontWeight: "500",
  },
  languageTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageTagText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
