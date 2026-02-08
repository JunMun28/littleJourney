import { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Modal,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  useTimeCapsules,
  type TimeCapsule,
} from "@/contexts/time-capsule-context";
import { useChild } from "@/contexts/child-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Spacing,
  Shadows,
} from "@/constants/theme";

// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Calculate unlock date from age
function calculateUnlockDateFromAge(
  birthDate: string,
  unlockAge: number,
): Date {
  const birth = new Date(birthDate);
  const unlockDate = new Date(birth);
  unlockDate.setFullYear(birth.getFullYear() + unlockAge);
  return unlockDate;
}

// Get time until unlock string
function getTimeUntilUnlock(
  capsule: TimeCapsule,
  childBirthDate?: string,
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

// Get unlock date description
function getUnlockDescription(
  capsule: TimeCapsule,
  childBirthDate?: string,
): string {
  if (capsule.unlockType === "age" && capsule.unlockAge && childBirthDate) {
    const unlockDate = calculateUnlockDateFromAge(
      childBirthDate,
      capsule.unlockAge,
    );
    return `When child turns ${capsule.unlockAge} (${formatDate(unlockDate.toISOString())})`;
  } else if (capsule.unlockType === "custom_date" && capsule.unlockDate) {
    return formatDate(capsule.unlockDate);
  }
  return "Unknown";
}

/**
 * Capsule detail screen - CAPSULE-004: Time capsule sealed state
 * Shows capsule details with content blurred/hidden when sealed.
 * Content only visible when unlocked or opened early.
 */
export default function CapsuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { getCapsule, forceUnlock } = useTimeCapsules();
  const { child } = useChild();

  const capsule = id ? getCapsule(id) : undefined;

  const [showForceUnlockModal, setShowForceUnlockModal] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleForceUnlock = useCallback(() => {
    if (id) {
      forceUnlock(id);
      setShowForceUnlockModal(false);
    }
  }, [id, forceUnlock]);

  // Not found state
  if (!capsule) {
    return (
      <ThemedView style={styles.notFoundContainer}>
        <ThemedText style={styles.notFoundText}>Capsule not found</ThemedText>
        <Pressable
          testID="back-button"
          onPress={handleBack}
          style={[
            styles.notFoundBackButton,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <ThemedText>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const isSealed = capsule.status === "sealed";
  const isOpenedEarly = capsule.status === "opened_early";
  const timeUntil = getTimeUntilUnlock(capsule, child?.dateOfBirth);
  const unlockDescription = getUnlockDescription(capsule, child?.dateOfBirth);

  return (
    <ThemedView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable testID="back-button" onPress={handleBack}>
          <ThemedText style={styles.backButtonText}>Close</ThemedText>
        </Pressable>
        <ThemedText type="subtitle">
          {isSealed ? "Sealed Letter" : "Opened Letter"}
        </ThemedText>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status banner */}
        <View
          testID="capsule-status-banner"
          style={[
            styles.statusBanner,
            {
              backgroundColor: isSealed
                ? SemanticColors.infoLight
                : isOpenedEarly
                  ? SemanticColors.warningLight
                  : SemanticColors.successLight,
            },
          ]}
        >
          <ThemedText style={styles.statusIcon}>
            {isSealed ? "🔒" : "📬"}
          </ThemedText>
          <View style={styles.statusTextContainer}>
            <ThemedText style={styles.statusTitle}>
              {isSealed
                ? "This letter is sealed"
                : isOpenedEarly
                  ? "Opened early"
                  : "Unlocked"}
            </ThemedText>
            <ThemedText
              style={[styles.statusSubtitle, { color: colors.textSecondary }]}
            >
              {isSealed
                ? `Opens ${unlockDescription}`
                : capsule.unlockedAt
                  ? `Opened on ${formatDate(capsule.unlockedAt)}`
                  : "Content is now readable"}
            </ThemedText>
          </View>
          {isSealed && (
            <View
              style={[
                styles.countdownBadge,
                { backgroundColor: SemanticColors.info },
              ]}
            >
              <ThemedText style={styles.countdownText}>{timeUntil}</ThemedText>
            </View>
          )}
        </View>

        {/* Capsule metadata */}
        <View
          style={[
            styles.metadataCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            Shadows.small,
          ]}
        >
          <View style={styles.metadataRow}>
            <ThemedText
              style={[styles.metadataLabel, { color: colors.textSecondary }]}
            >
              Created
            </ThemedText>
            <ThemedText style={styles.metadataValue}>
              {formatDate(capsule.createdAt)}
            </ThemedText>
          </View>
          <View
            style={[styles.metadataDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.metadataRow}>
            <ThemedText
              style={[styles.metadataLabel, { color: colors.textSecondary }]}
            >
              Unlock Date
            </ThemedText>
            <ThemedText style={styles.metadataValue}>
              {unlockDescription}
            </ThemedText>
          </View>
          {capsule.attachedPhotoUris &&
            capsule.attachedPhotoUris.length > 0 && (
              <>
                <View
                  style={[
                    styles.metadataDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View style={styles.metadataRow}>
                  <ThemedText
                    style={[
                      styles.metadataLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Photos
                  </ThemedText>
                  <ThemedText style={styles.metadataValue}>
                    {capsule.attachedPhotoUris.length} attached
                  </ThemedText>
                </View>
              </>
            )}
        </View>

        {/* Letter content - blurred if sealed */}
        <View style={styles.contentSection}>
          <ThemedText
            style={[styles.contentLabel, { color: colors.textSecondary }]}
          >
            Letter Content
          </ThemedText>
          <View
            testID="capsule-content-container"
            style={[
              styles.contentCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
              Shadows.small,
            ]}
          >
            {isSealed ? (
              <View
                testID="sealed-content-view"
                style={styles.sealedContentWrapper}
              >
                {/* Blurred text content */}
                <View style={styles.blurredTextContainer}>
                  <ThemedText
                    style={[styles.blurredText, { color: colors.textMuted }]}
                  >
                    {capsule.letterContent}
                  </ThemedText>
                  <BlurView
                    testID="content-blur-overlay"
                    intensity={80}
                    style={styles.blurOverlay}
                  />
                </View>

                {/* Overlay with lock icon */}
                <View style={styles.sealedOverlay}>
                  <View
                    style={[
                      styles.lockIconContainer,
                      { backgroundColor: SemanticColors.infoLight },
                    ]}
                  >
                    <ThemedText style={styles.lockIcon}>🔒</ThemedText>
                  </View>
                  <ThemedText style={styles.sealedMessage}>
                    Content is sealed
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.sealedSubmessage,
                      { color: colors.textSecondary },
                    ]}
                  >
                    This letter will unlock {unlockDescription.toLowerCase()}
                  </ThemedText>
                </View>
              </View>
            ) : (
              <ThemedText
                testID="unlocked-content-view"
                style={styles.letterContent}
              >
                {capsule.letterContent}
              </ThemedText>
            )}
          </View>
        </View>

        {/* CAPSULE-004: Cannot edit after sealing - no edit button shown */}
        {/* Only force unlock available for sealed capsules */}
        {isSealed && (
          <Pressable
            testID="force-unlock-button"
            style={[
              styles.forceUnlockButton,
              { borderColor: SemanticColors.warning },
            ]}
            onPress={() => setShowForceUnlockModal(true)}
          >
            <ThemedText
              style={[
                styles.forceUnlockButtonText,
                { color: SemanticColors.warning },
              ]}
            >
              Unlock Early
            </ThemedText>
          </Pressable>
        )}

        {/* No edit functionality - capsule is immutable after sealing */}
        <View style={styles.infoBox}>
          <ThemedText style={styles.infoIcon}>ℹ️</ThemedText>
          <ThemedText
            style={[styles.infoText, { color: colors.textSecondary }]}
          >
            {isSealed
              ? "This letter cannot be edited after sealing. You can unlock it early, but it will be marked as 'Opened Early'."
              : "This letter was opened and its content is now visible."}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Force Unlock Confirmation Modal - CAPSULE-007 */}
      <Modal
        visible={showForceUnlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForceUnlockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            testID="force-unlock-modal"
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <ThemedText style={styles.warningIcon}>⚠️</ThemedText>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Unlock Early?
            </ThemedText>
            <ThemedText
              style={[styles.modalDescription, { color: colors.textSecondary }]}
            >
              This will permanently unlock the time capsule before its scheduled
              date. The letter will be marked as &quot;Opened Early&quot;.
            </ThemedText>
            <ThemedText
              style={[styles.modalNote, { color: SemanticColors.warning }]}
            >
              This action cannot be undone.
            </ThemedText>

            <View style={styles.modalButtons}>
              <Pressable
                testID="cancel-force-unlock"
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => setShowForceUnlockModal(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                testID="confirm-force-unlock"
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: SemanticColors.warning },
                ]}
                onPress={handleForceUnlock}
              >
                <ThemedText style={{ color: "#fff" }}>Unlock Now</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  notFoundText: {
    fontSize: 18,
    marginBottom: Spacing.lg,
  },
  notFoundBackButton: {
    padding: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  statusIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  countdownBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  metadataCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  metadataLabel: {
    fontSize: 14,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  metadataDivider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  contentSection: {
    marginBottom: Spacing.lg,
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  contentCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    minHeight: 200,
  },
  letterContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  sealedContentWrapper: {
    position: "relative",
    minHeight: 160,
  },
  blurredTextContainer: {
    position: "relative",
    overflow: "hidden",
  },
  blurredText: {
    fontSize: 16,
    lineHeight: 24,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sealedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  lockIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  lockIcon: {
    fontSize: 28,
  },
  sealedMessage: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  sealedSubmessage: {
    fontSize: 13,
    textAlign: "center",
  },
  forceUnlockButton: {
    borderWidth: 2,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  forceUnlockButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    padding: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    alignItems: "flex-start",
  },
  infoIcon: {
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: "center",
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalNote: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {},
});
