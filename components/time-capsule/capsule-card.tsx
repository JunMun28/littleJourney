/**
 * Capsule Card Component
 *
 * Displays a time capsule with sealed/unlocked state,
 * countdown badge, and content preview.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import {
  Lock,
  Mail,
  MailOpen,
  Clock,
  Sparkles,
  PartyPopper,
} from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { type TimeCapsule } from "@/contexts/time-capsule-context";
import { Colors, SemanticColors, Shadows, Spacing } from "@/constants/theme";
import { Primary, Accent, Radius } from "@/constants/design-tokens";
import { Entering } from "@/utils/animations";

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

interface CapsuleCardProps {
  capsule: TimeCapsule;
  index: number;
  childBirthDate?: string;
  onPress: (capsuleId: string) => void;
}

export function CapsuleCard({
  capsule,
  index,
  childBirthDate,
  onPress,
}: CapsuleCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  const isSealed = capsule.status === "sealed";
  const isOpenedEarly = capsule.status === "opened_early";
  const timeUntil = getTimeUntilUnlock(capsule, childBirthDate);

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(index)}
    >
      <Pressable
        testID={`capsule-card-${capsule.id}`}
        style={[
          styles.capsuleCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          Shadows.small,
          // UI-024: Warm glow effect for opened capsules
          !isSealed && styles.openedCardGlow,
        ]}
        onPress={() => onPress(capsule.id)}
      >
        <View style={styles.capsuleHeader}>
          {/* UI-023/024: Enhanced icon container with Lucide icons */}
          <View
            style={[
              styles.capsuleIconContainer,
              {
                backgroundColor: isSealed ? Primary[50] : `${Accent.gold}20`,
              },
            ]}
          >
            {isSealed ? (
              <Mail size={22} color={Primary[500]} />
            ) : (
              <MailOpen size={22} color={Accent.gold} />
            )}
            {/* UI-023: Lock badge on sealed capsules */}
            {isSealed && (
              <View style={styles.lockBadge}>
                <Lock size={10} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.capsuleInfo}>
            <Text style={[styles.capsuleTitle, { color: colors.text }]}>
              {isSealed ? "Sealed Letter" : "Opened Letter"}
            </Text>
            <Text style={[styles.capsuleDate, { color: colors.textSecondary }]}>
              Created {formatDate(capsule.createdAt)}
            </Text>
          </View>
          {/* UI-023: Prominent countdown badge */}
          {isSealed && (
            <View
              style={[styles.countdownBadge, { backgroundColor: Primary[50] }]}
            >
              <Clock
                size={12}
                color={Primary[500]}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.countdownText, { color: Primary[600] }]}>
                {timeUntil}
              </Text>
            </View>
          )}
          {/* UI-024: Celebration badge for opened capsules */}
          {!isSealed && !isOpenedEarly && (
            <View
              style={[
                styles.countdownBadge,
                { backgroundColor: `${Accent.gold}20` },
              ]}
            >
              <PartyPopper
                size={12}
                color={Accent.gold}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.countdownText, { color: Accent.gold }]}>
                Opened
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
                style={[
                  styles.countdownText,
                  { color: SemanticColors.warningText },
                ]}
              >
                Opened Early
              </Text>
            </View>
          )}
        </View>

        {/* Preview of letter (blurred/hidden if sealed) */}
        {isSealed ? (
          <View style={styles.sealedContent}>
            <Lock
              size={16}
              color={colors.textSecondary}
              style={{ marginBottom: 8 }}
            />
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
          <View style={styles.openedContent}>
            <Sparkles
              size={14}
              color={Accent.gold}
              style={{ marginBottom: 4 }}
            />
            <Text
              style={[styles.capsulePreview, { color: colors.text }]}
              numberOfLines={3}
            >
              {capsule.letterContent}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
    position: "relative",
  },
  // UI-023: Lock badge on sealed capsules
  lockBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Primary[500],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  // UI-024: Warm glow for opened capsules
  openedCardGlow: {
    shadowColor: Accent.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sealedContent: {
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: Radius.md,
    alignItems: "center",
  },
  sealedText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  // UI-024: Opened capsule content with sparkle icon
  openedContent: {
    paddingTop: Spacing.xs,
  },
  capsulePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
});
