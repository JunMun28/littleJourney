import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Share,
} from "react-native";
import { useRouter } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useGamification, type Badge } from "@/contexts/gamification-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Shadows,
  Spacing,
} from "@/constants/theme";

export default function BadgesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();

  const {
    unlockedBadges,
    lockedBadges,
    totalBadges,
    unlockedCount,
    isBadgeUnlocked,
    markBadgeAsSeen,
  } = useGamification();

  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const handleBadgePress = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
    // Mark as seen when viewed
    if (isBadgeUnlocked(badge.id)) {
      markBadgeAsSeen(badge.id);
    }
  };

  const handleShare = async () => {
    if (!selectedBadge || !isBadgeUnlocked(selectedBadge.id)) return;

    try {
      await Share.share({
        message: `🏆 I just earned the "${selectedBadge.title}" badge on Little Journey! ${selectedBadge.icon} ${selectedBadge.description}`,
      });
    } catch {
      // User cancelled or share failed
    }
  };

  const closeBadgeModal = () => {
    setShowBadgeModal(false);
    setSelectedBadge(null);
  };

  const renderBadgeCard = (badge: Badge, isUnlocked: boolean) => (
    <Pressable
      key={badge.id}
      style={[
        styles.badgeCard,
        !isUnlocked && styles.badgeCardLocked,
        { backgroundColor: colors.card },
      ]}
      onPress={() => handleBadgePress(badge)}
      testID={`badge-${badge.id}`}
    >
      <Text style={[styles.badgeIcon, !isUnlocked && styles.badgeIconLocked]}>
        {isUnlocked ? badge.icon : "🔒"}
      </Text>
      <Text
        style={[
          styles.badgeTitle,
          { color: colors.text },
          !isUnlocked && styles.badgeTitleLocked,
        ]}
        numberOfLines={2}
      >
        {badge.title}
      </Text>
      {isUnlocked && (
        <View style={styles.unlockedIndicator}>
          <Text style={styles.unlockedText}>✓</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          testID="back-button"
        >
          <Text style={[styles.backButtonText, { color: PRIMARY_COLOR }]}>
            ← Back
          </Text>
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>
          Badge Collection
        </ThemedText>
      </View>

      {/* Progress summary */}
      <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
        <Text style={styles.progressEmoji}>🏆</Text>
        <View style={styles.progressText}>
          <ThemedText type="defaultSemiBold" style={styles.progressCount}>
            {unlockedCount} / {totalBadges}
          </ThemedText>
          <ThemedText style={styles.progressLabel}>Badges Unlocked</ThemedText>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(unlockedCount / totalBadges) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Unlocked badges */}
        {unlockedBadges.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Unlocked ({unlockedBadges.length})
            </ThemedText>
            <View style={styles.badgeGrid}>
              {unlockedBadges.map((badge) => renderBadgeCard(badge, true))}
            </View>
          </View>
        )}

        {/* Locked badges */}
        {lockedBadges.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Locked ({lockedBadges.length})
            </ThemedText>
            <View style={styles.badgeGrid}>
              {lockedBadges.map((badge) => renderBadgeCard(badge, false))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Badge Detail Modal */}
      <Modal
        visible={showBadgeModal}
        animationType="fade"
        transparent
        onRequestClose={closeBadgeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedBadge && (
              <>
                <Text style={styles.modalIcon}>
                  {isBadgeUnlocked(selectedBadge.id)
                    ? selectedBadge.icon
                    : "🔒"}
                </Text>
                <ThemedText type="title" style={styles.modalTitle}>
                  {selectedBadge.title}
                </ThemedText>
                <ThemedText style={styles.modalDescription}>
                  {selectedBadge.description}
                </ThemedText>

                {isBadgeUnlocked(selectedBadge.id) ? (
                  <View style={styles.unlockedBadge}>
                    <Text style={styles.unlockedBadgeText}>✓ Unlocked!</Text>
                  </View>
                ) : (
                  <View style={styles.lockedInfo}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.howToUnlock}
                    >
                      How to unlock:
                    </ThemedText>
                    <ThemedText style={styles.unlockCondition}>
                      {selectedBadge.unlockCondition}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.modalActions}>
                  {isBadgeUnlocked(selectedBadge.id) && (
                    <Pressable
                      style={[
                        styles.shareButton,
                        { backgroundColor: PRIMARY_COLOR },
                      ]}
                      onPress={handleShare}
                      testID="share-badge-button"
                    >
                      <Text style={styles.shareButtonText}>Share Badge</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.closeButton, { borderColor: colors.border }]}
                    onPress={closeBadgeModal}
                    testID="close-badge-modal"
                  >
                    <Text
                      style={[styles.closeButtonText, { color: colors.text }]}
                    >
                      Close
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
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
  header: {
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 28,
  },
  progressCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 16,
    ...Shadows.medium,
  },
  progressEmoji: {
    fontSize: 40,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  progressText: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  progressCount: {
    fontSize: 24,
  },
  progressLabel: {
    opacity: 0.7,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badgeCard: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.small,
  },
  badgeCardLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeTitle: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
  badgeTitleLocked: {
    opacity: 0.7,
  },
  unlockedIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: SemanticColors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  unlockedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
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
    maxWidth: 340,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: "center",
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    textAlign: "center",
    opacity: 0.8,
    marginBottom: Spacing.lg,
  },
  unlockedBadge: {
    backgroundColor: SemanticColors.success,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginBottom: Spacing.lg,
  },
  unlockedBadgeText: {
    color: "white",
    fontWeight: "600",
  },
  lockedInfo: {
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  howToUnlock: {
    marginBottom: Spacing.xs,
  },
  unlockCondition: {
    textAlign: "center",
    opacity: 0.7,
    fontStyle: "italic",
  },
  modalActions: {
    width: "100%",
    gap: Spacing.sm,
  },
  shareButton: {
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  shareButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  closeButton: {
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  closeButtonText: {
    fontWeight: "500",
    fontSize: 16,
  },
});
