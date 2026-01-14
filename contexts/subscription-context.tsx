import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { SubscriptionTier } from "@/contexts/storage-context";

export type BillingCycle = "monthly" | "yearly";

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
