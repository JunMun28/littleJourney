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
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  useTimeCapsules,
  type TimeCapsule,
  PRESET_UNLOCK_AGES,
} from "@/contexts/time-capsule-context";
import { useChild } from "@/contexts/child-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Shadows,
  Spacing,
} from "@/constants/theme";

type ModalState = "closed" | "createCapsule";
type UnlockOption = "age" | "custom";

// Calculate unlock date from age
function calculateUnlockDateFromAge(birthDate: string, unlockAge: number): Date {
  const birth = new Date(birthDate);
  const unlockDate = new Date(birth);
  unlockDate.setFullYear(birth.getFullYear() + unlockAge);
  return unlockDate;
}

// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Calculate time until unlock
function getTimeUntilUnlock(
  capsule: TimeCapsule,
  childBirthDate?: string
): string {
  let unlockDate: Date;

  if (capsule.unlockType === "age" && capsule.unlockAge && childBirthDate) {
    unlockDate = calculateUnlockDateFromAge(childBirthDate, capsule.unlockAge);
  } else if (capsule.unlockType === "custom_date" && capsule.unlockDate) {
    unlockDate = new Date(capsule.unlockDate);
  } else {
    return "Unknown";
  }

  const now = new Date();
  const diffMs = unlockDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Ready to unlock";
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;
  const diffMonths = Math.floor(remainingDays / 30);

  if (diffYears > 0) {
    return diffMonths > 0
      ? `${diffYears}y ${diffMonths}m`
      : `${diffYears} year${diffYears > 1 ? "s" : ""}`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  }
}

export default function TimeCapsuleScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { child } = useChild();
  const { capsules, createCapsule, getSealedCapsules, getUnlockedCapsules } =
    useTimeCapsules();

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [letterContent, setLetterContent] = useState("");
  const [unlockOption, setUnlockOption] = useState<UnlockOption>("age");
  const [selectedAge, setSelectedAge] = useState<number>(18);
  const [customDate, setCustomDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 18); // Default 18 years from now
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const sealedCapsules = useMemo(() => getSealedCapsules(), [getSealedCapsules]);
  const unlockedCapsules = useMemo(
    () => getUnlockedCapsules(),
    [getUnlockedCapsules]
  );

  const hasCapsules = capsules.length > 0;

  const handleOpenCreateModal = () => {
    setLetterContent("");
    setUnlockOption("age");
    setSelectedAge(18);
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 18);
    setCustomDate(defaultDate);
    setModalState("createCapsule");
  };

  const handleSaveCapsule = () => {
    if (!letterContent.trim()) return;

    createCapsule({
      letterContent: letterContent.trim(),
      unlockType: unlockOption === "age" ? "age" : "custom_date",
      unlockAge: unlockOption === "age" ? selectedAge : undefined,
      unlockDate:
        unlockOption === "custom"
          ? customDate.toISOString().split("T")[0]
          : undefined,
      childId: child?.id,
    });

    setModalState("closed");
    setLetterContent("");
  };

  const isValidCapsule = letterContent.trim().length > 0;

  const handleCapsulePress = useCallback((capsuleId: string) => {
    router.push(`/capsule/${capsuleId}`);
  }, []);

  const renderCapsuleCard = (capsule: TimeCapsule) => {
    const isSealed = capsule.status === "sealed";
    const isOpenedEarly = capsule.status === "opened_early";
    const timeUntil = getTimeUntilUnlock(capsule, child?.dateOfBirth);

    return (
      <Pressable
        key={capsule.id}
        testID={`capsule-card-${capsule.id}`}
        style={[
          styles.capsuleCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          Shadows.small,
        ]}
        onPress={() => handleCapsulePress(capsule.id)}
      >
        <View style={styles.capsuleHeader}>
          <View style={styles.capsuleIconContainer}>
            <Text style={styles.capsuleIcon}>{isSealed ? "🔒" : "📬"}</Text>
          </View>
          <View style={styles.capsuleInfo}>
            <Text style={[styles.capsuleTitle, { color: colors.text }]}>
              {isSealed ? "Sealed Letter" : "Opened Letter"}
            </Text>
            <Text
              style={[styles.capsuleDate, { color: colors.textSecondary }]}
            >
              Created {formatDate(capsule.createdAt)}
            </Text>
          </View>
          {isSealed && (
            <View
              style={[
                styles.countdownBadge,
                { backgroundColor: SemanticColors.infoLight },
              ]}
            >
              <Text style={[styles.countdownText, { color: SemanticColors.info }]}>
                {timeUntil}
              </Text>
            </View>
          )}
          {isOpenedEarly && (
            <View
              style={[
                styles.countdownBadge,
                { backgroundColor: SemanticColors.warningLight },
              ]}
            >
              <Text
                style={[styles.countdownText, { color: SemanticColors.warningText }]}
              >
                Opened Early
              </Text>
            </View>
          )}
        </View>

        {/* Preview of letter (blurred/hidden if sealed) */}
        {isSealed ? (
          <View style={styles.sealedContent}>
            <Text style={[styles.sealedText, { color: colors.textSecondary }]}>
              Content sealed until{" "}
              {capsule.unlockType === "age" && capsule.unlockAge
                ? `age ${capsule.unlockAge}`
                : capsule.unlockDate
                  ? formatDate(capsule.unlockDate)
                  : "unlock date"}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.capsulePreview, { color: colors.text }]}
            numberOfLines={3}
          >
            {capsule.letterContent}
          </Text>
        )}
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>💌</Text>
      <ThemedText type="subtitle" style={styles.emptyStateTitle}>
        No Time Capsules Yet
      </ThemedText>
      <ThemedText
        style={[styles.emptyStateText, { color: colors.textSecondary }]}
      >
        Write a letter to your child that they can read when they grow up.
        Choose when it unlocks - at age 5, 10, 18, 21, or a custom date.
      </ThemedText>
      <Pressable
        testID="empty-state-create-button"
        style={styles.emptyStateButton}
        onPress={handleOpenCreateModal}
      >
        <Text style={styles.emptyStateButtonText}>Write New Letter</Text>
      </Pressable>
    </View>
  );

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
          onPress={() => setSelectedAge(age)}
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
    <ThemedView style={styles.container}>
      {!hasCapsules ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.scrollView}>
          {sealedCapsules.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Sealed ({sealedCapsules.length})
              </Text>
              {sealedCapsules.map(renderCapsuleCard)}
            </View>
          )}
          {unlockedCapsules.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Opened ({unlockedCapsules.length})
              </Text>
              {unlockedCapsules.map(renderCapsuleCard)}
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB to create new capsule */}
      {hasCapsules && (
        <Pressable
          testID="create-capsule-fab"
          style={[styles.fab, Shadows.large]}
          onPress={handleOpenCreateModal}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      {/* Create Capsule Modal */}
      <Modal visible={modalState === "createCapsule"} animationType="slide">
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
            <Pressable
              testID="cancel-create-button"
              onPress={() => setModalState("closed")}
            >
              <Text style={styles.backButton}>Cancel</Text>
            </Pressable>
            <ThemedText type="subtitle">Write Letter</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
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
              onChangeText={setLetterContent}
              placeholder="Dear child, ..."
              placeholderTextColor={colors.placeholder}
              multiline
              textAlignVertical="top"
            />

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
                onPress={() => setUnlockOption("age")}
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
                onPress={() => setUnlockOption("custom")}
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
                  onPress={() => setShowDatePicker(true)}
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
                      setShowDatePicker(Platform.OS === "ios");
                      if (date) setCustomDate(date);
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
                !isValidCapsule && styles.submitButtonDisabled,
              ]}
              onPress={handleSaveCapsule}
              disabled={!isValidCapsule}
            >
              <Text style={styles.submitButtonText}>Seal & Save</Text>
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
  capsuleCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  capsuleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  capsuleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SemanticColors.infoLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  capsuleIcon: {
    fontSize: 20,
  },
  capsuleInfo: {
    flex: 1,
  },
  capsuleTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  capsuleDate: {
    fontSize: 12,
    marginTop: 2,
  },
  countdownBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sealedContent: {
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
  },
  sealedText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  capsulePreview: {
    fontSize: 14,
    lineHeight: 20,
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
    lineHeight: 22,
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
});
