import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { SubscriptionTier } from "@/contexts/storage-context";

export type BillingCycle = "monthly" | "yearly";

// Tier hierarchy for upgrade/downgrade validation
const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  standard: 1,
  premium: 2,
};

// PRD Section 12.1 Tier Structure - Prices in SGD
export const PLAN_DETAILS = {
  free: {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["1 child", "5 family members", "500MB storage", "No video"],
  },
  standard: {
    name: "Standard",
    monthlyPrice: 4.99,
    yearlyPrice: 39.99,
    features: [
      "Unlimited children",
      "Unlimited family members",
      "10GB storage",
      "2 min video uploads",
      "PDF export",
    ],
  },
  premium: {
    name: "Premium",
    monthlyPrice: 9.99,
    yearlyPrice: 79.99,
    features: [
      "Unlimited children",
      "Unlimited family members",
      "50GB storage",
      "10 min video uploads",
      "PDF export",
    ],
  },
} as const;

interface SubscriptionState {
  currentPlan: SubscriptionTier;
  billingCycle: BillingCycle | null;
  isSubscribed: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
}

interface SubscriptionContextValue extends SubscriptionState {
  subscribe: (plan: SubscriptionTier, cycle: BillingCycle) => Promise<void>;
  upgradePlan: (newPlan: SubscriptionTier) => Promise<void>;
  calculateProratedAmount: (newPlan: SubscriptionTier) => number;
  cancelSubscription: () => Promise<void>;
  restoreSubscription: () => Promise<void>;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>("free");
  const [billingCycle, setBillingCycle] = useState<BillingCycle | null>(null);
  const [currentPeriodStart, setCurrentPeriodStart] = useState<string | null>(
    null,
  );
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelledAt, setCancelledAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSubscribed = currentPlan !== "free";

  const subscribe = useCallback(
    async (plan: SubscriptionTier, cycle: BillingCycle): Promise<void> => {
      setIsLoading(true);
      try {
        // TODO: In production, this will:
        // 1. Open Stripe Checkout or Payment Sheet
        // 2. Handle payment confirmation
        // 3. Wait for webhook to confirm subscription
        // For now, mock the subscription process

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        const now = new Date();
        const periodEnd = new Date(now);

        if (cycle === "monthly") {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        setCurrentPlan(plan);
        setBillingCycle(cycle);
        setCurrentPeriodStart(now.toISOString());
        setCurrentPeriodEnd(periodEnd.toISOString());
        setCancelledAt(null);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Calculate the prorated amount for upgrading to a new plan
  // PRD Section 12.2: Proration calculation for mid-cycle upgrades
  const calculateProratedAmount = useCallback(
    (newPlan: SubscriptionTier): number => {
      // If not subscribed or upgrading to same plan, no proration
      if (
        !isSubscribed ||
        newPlan === currentPlan ||
        !currentPeriodEnd ||
        !billingCycle
      ) {
        return 0;
      }

      const currentPrice =
        billingCycle === "monthly"
          ? PLAN_DETAILS[currentPlan].monthlyPrice
          : PLAN_DETAILS[currentPlan].yearlyPrice;

      const newPrice =
        billingCycle === "monthly"
          ? PLAN_DETAILS[newPlan].monthlyPrice
          : PLAN_DETAILS[newPlan].yearlyPrice;

      // Calculate remaining days in billing period
      const now = new Date();
      const periodEnd = new Date(currentPeriodEnd);
      const totalDays = billingCycle === "monthly" ? 30 : 365;
      const remainingMs = periodEnd.getTime() - now.getTime();
      const remainingDays = Math.max(
        0,
        Math.ceil(remainingMs / (1000 * 60 * 60 * 24)),
      );

      // Calculate prorated difference
      const dailyCurrentRate = currentPrice / totalDays;
      const dailyNewRate = newPrice / totalDays;
      const priceDiff = dailyNewRate - dailyCurrentRate;
      const proratedAmount = priceDiff * remainingDays;

      // Return rounded to 2 decimal places, minimum 0
      return Math.max(0, Math.round(proratedAmount * 100) / 100);
    },
    [isSubscribed, currentPlan, currentPeriodEnd, billingCycle],
  );

  // Upgrade to a higher tier plan with proration
  // PRD PAY-006: Can upgrade tier with proration
  const upgradePlan = useCallback(
    async (newPlan: SubscriptionTier): Promise<void> => {
      // Validate: must be subscribed (isSubscribed means currentPlan !== "free")
      if (!isSubscribed) {
        throw new Error("Cannot upgrade without an active subscription");
      }

      // Validate: can only upgrade, not downgrade
      if (TIER_HIERARCHY[newPlan] <= TIER_HIERARCHY[currentPlan]) {
        throw new Error("Cannot downgrade using upgradePlan");
      }

      setIsLoading(true);
      try {
        // TODO: In production, this will:
        // 1. Calculate proration using Stripe's proration API
        // 2. Charge the prorated amount
        // 3. Update the subscription to the new plan
        // For now, mock the upgrade process

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Upgrade immediately - limits increase right away per PRD
        setCurrentPlan(newPlan);
        // Keep existing billing cycle and period end date
        // (Stripe handles proration automatically)
      } finally {
        setIsLoading(false);
      }
    },
    [isSubscribed, currentPlan],
  );

  const cancelSubscription = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: In production, call Stripe API to cancel subscription
      // Subscription remains active until current period ends
      await new Promise((resolve) => setTimeout(resolve, 100));

      setCancelledAt(new Date().toISOString());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restoreSubscription = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: In production, call Stripe API to restore cancelled subscription
      await new Promise((resolve) => setTimeout(resolve, 100));

      setCancelledAt(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: SubscriptionContextValue = {
    currentPlan,
    billingCycle,
    isSubscribed,
    currentPeriodStart,
    currentPeriodEnd,
    cancelledAt,
    subscribe,
    upgradePlan,
    calculateProratedAmount,
    cancelSubscription,
    restoreSubscription,
    isLoading,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (context === null) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}
