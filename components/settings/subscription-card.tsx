/**
 * Subscription Card Component
 *
 * Displays current subscription status and upgrade options.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Semantic,
  Spacing,
} from "@/constants/design-tokens";
import {
  PLAN_DETAILS,
  type BillingCycle,
} from "@/contexts/subscription-context";
import { type SubscriptionTier } from "@/contexts/storage-context";

interface SubscriptionCardProps {
  currentPlan: SubscriptionTier;
  billingCycle: BillingCycle | null;
  isSubscribed: boolean;
  cancelledAt: string | null;
  currentPeriodEnd: string | null;
  isLoading: boolean;
  onUpgrade: () => void;
  onCancel: () => void;
  onRestore: () => void;
}

export function SubscriptionCard({
  currentPlan,
  billingCycle,
  isSubscribed,
  cancelledAt,
  currentPeriodEnd,
  isLoading,
  onUpgrade,
  onCancel,
  onRestore,
}: SubscriptionCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        Subscription
      </Text>

      <View style={styles.subscriptionContainer}>
        <View style={styles.header}>
          <Text style={[styles.planName, { color: colors.text }]}>
            {PLAN_DETAILS[currentPlan].name} Plan
          </Text>
          {isSubscribed && billingCycle && (
            <Text
              style={[
                styles.cycle,
                {
                  backgroundColor: colors.backgroundTertiary,
                  color: colors.textSecondary,
                },
              ]}
            >
              {billingCycle === "monthly" ? "Monthly" : "Yearly"}
            </Text>
          )}
        </View>

        {isSubscribed && currentPeriodEnd && (
          <Text style={[styles.period, { color: colors.textSecondary }]}>
            {cancelledAt ? "Access until" : "Renews"}{" "}
            {new Date(currentPeriodEnd).toLocaleDateString("en-SG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        )}

        {cancelledAt ? (
          <View
            style={[
              styles.cancelledBanner,
              { backgroundColor: Semantic.warningLight },
            ]}
          >
            <Text style={[styles.cancelledText, { color: "#856404" }]}>
              Your subscription has been cancelled
            </Text>
            <Pressable
              style={[styles.restoreButton, { backgroundColor: "#856404" }]}
              onPress={onRestore}
              disabled={isLoading}
            >
              <Text style={styles.restoreButtonText}>Restore</Text>
            </Pressable>
          </View>
        ) : isSubscribed ? (
          <Pressable
            style={styles.managePlanButton}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={[styles.managePlanText, { color: Semantic.error }]}>
              Cancel Subscription
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.upgradeButton}
            onPress={onUpgrade}
            testID="upgrade-button"
          >
            <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  subscriptionContainer: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
  },
  cycle: {
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  period: {
    fontSize: 14,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: Primary[500],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  managePlanButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  managePlanText: {
    fontSize: 16,
  },
  cancelledBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  cancelledText: {
    fontSize: 14,
    flex: 1,
  },
  restoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  restoreButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
