/**
 * Subscription Modal Component
 *
 * Full subscription selection modal with plan cards and billing options.
 */

import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Spacing,
  Radius,
} from "@/constants/design-tokens";
import { ModalHeader } from "@/components/ui/modal-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  PLAN_DETAILS,
  type BillingCycle,
} from "@/contexts/subscription-context";
import { type SubscriptionTier } from "@/contexts/storage-context";

interface SubscriptionModalProps {
  visible: boolean;
  currentPlan: SubscriptionTier;
  currentBillingCycle: BillingCycle | null;
  selectedPlan: SubscriptionTier;
  selectedCycle: BillingCycle;
  isLoading: boolean;
  proratedAmount?: number;
  onPlanChange: (plan: SubscriptionTier) => void;
  onCycleChange: (cycle: BillingCycle) => void;
  onClose: () => void;
  onSubscribe: () => void;
  onUpgrade: () => void;
}

function getPrice(plan: SubscriptionTier, cycle: BillingCycle): string {
  const details = PLAN_DETAILS[plan];
  const price =
    cycle === "monthly" ? details.monthlyPrice : details.yearlyPrice;
  const suffix = cycle === "monthly" ? "/mo" : "/yr";
  return `$${price.toFixed(2)}${suffix}`;
}

export function SubscriptionModal({
  visible,
  currentPlan,
  currentBillingCycle,
  selectedPlan,
  selectedCycle,
  isLoading,
  proratedAmount,
  onPlanChange,
  onCycleChange,
  onClose,
  onSubscribe,
  onUpgrade,
}: SubscriptionModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  const isUpgrade = currentPlan === "standard" && selectedPlan === "premium";
  const isSamePlan = selectedPlan === currentPlan;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <ModalHeader title="Choose Plan" onClose={onClose} />

        <ScrollView style={styles.content}>
          <SegmentedControl
            options={[
              { value: "monthly" as BillingCycle, label: "Monthly" },
              {
                value: "yearly" as BillingCycle,
                label: "Yearly",
                badge: "Save 33%",
              },
            ]}
            value={selectedCycle}
            onValueChange={onCycleChange}
            style={styles.billingToggle}
          />

          {(["standard", "premium"] as const).map((plan) => (
            <Pressable
              key={plan}
              style={[
                styles.planCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedPlan === plan && styles.planCardSelected,
              ]}
              onPress={() => onPlanChange(plan)}
              testID={`plan-${plan}`}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: colors.text }]}>
                  {PLAN_DETAILS[plan].name}
                </Text>
                <Text style={styles.planPrice}>
                  {getPrice(plan, selectedCycle)}
                </Text>
              </View>
              <View style={styles.planFeatures}>
                {PLAN_DETAILS[plan].features.map((feature, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.planFeature,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ✓ {feature}
                  </Text>
                ))}
              </View>
              {selectedPlan === plan && (
                <View style={styles.planSelectedBadge}>
                  <Text style={styles.planSelectedText}>Selected</Text>
                </View>
              )}
            </Pressable>
          ))}

          {isUpgrade ? (
            <>
              <View style={styles.proratedInfo}>
                <Text
                  style={[
                    styles.proratedLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Prorated charge today:
                </Text>
                <Text style={[styles.proratedAmount, { color: colors.text }]}>
                  ${(proratedAmount ?? 0).toFixed(2)} SGD
                </Text>
                <Text
                  style={[styles.proratedNote, { color: colors.textMuted }]}
                >
                  Then $
                  {currentBillingCycle === "monthly"
                    ? PLAN_DETAILS.premium.monthlyPrice.toFixed(2)
                    : PLAN_DETAILS.premium.yearlyPrice.toFixed(2)}{" "}
                  SGD/{currentBillingCycle === "monthly" ? "mo" : "yr"} at next
                  billing
                </Text>
              </View>
              <Pressable
                style={[
                  styles.subscribeButton,
                  isLoading && styles.subscribeButtonDisabled,
                ]}
                onPress={onUpgrade}
                disabled={isLoading}
                testID="upgrade-button-modal"
              >
                <Text style={styles.subscribeButtonText}>
                  {isLoading ? "Processing upgrade..." : "Upgrade to Premium"}
                </Text>
              </Pressable>
            </>
          ) : isSamePlan ? (
            <View style={styles.currentPlanBadge}>
              <Text
                style={[
                  styles.currentPlanText,
                  { color: colors.textSecondary },
                ]}
              >
                You&apos;re already on the {PLAN_DETAILS[selectedPlan].name}{" "}
                plan
              </Text>
            </View>
          ) : (
            <Pressable
              style={[
                styles.subscribeButton,
                isLoading && styles.subscribeButtonDisabled,
              ]}
              onPress={onSubscribe}
              disabled={isLoading}
              testID="subscribe-button"
            >
              <Text style={styles.subscribeButtonText}>
                {isLoading
                  ? "Processing payment..."
                  : `Subscribe to ${PLAN_DETAILS[selectedPlan].name}`}
              </Text>
            </Pressable>
          )}

          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
            Payment will be processed via Stripe. You can cancel anytime.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  billingToggle: {
    marginBottom: 20,
  },
  planCard: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
  },
  planCardSelected: {
    borderColor: Primary[500],
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: Primary[500],
  },
  planFeatures: {
    gap: 8,
  },
  planFeature: {
    fontSize: 14,
  },
  planSelectedBadge: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: Primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planSelectedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  subscribeButton: {
    backgroundColor: Primary[500],
    paddingVertical: 16,
    borderRadius: Radius.sm,
    alignItems: "center",
    marginTop: 8,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  proratedInfo: {
    alignItems: "center",
    marginVertical: 16,
    padding: 16,
    backgroundColor: `${Primary[500]}10`,
    borderRadius: Radius.md,
  },
  proratedLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  proratedAmount: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  proratedNote: {
    fontSize: 12,
    textAlign: "center",
  },
  currentPlanBadge: {
    alignItems: "center",
    marginVertical: 16,
    padding: 16,
  },
  currentPlanText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
