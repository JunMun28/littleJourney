/**
 * Stripe Payment Hook - Web Stub
 *
 * Web platform stub for Stripe payment hook.
 * Stripe React Native is not available on web.
 * PRD ref: PAY-002 (Credit card via Stripe)
 */

import { useState, useCallback } from "react";

import type { SubscriptionTier } from "@/contexts/storage-context";
import type { BillingCycle } from "@/contexts/subscription-context";

interface UseStripePaymentReturn {
  processPayment: (
    plan: SubscriptionTier,
    cycle: BillingCycle,
  ) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  isAvailable: boolean;
}

/**
 * Web stub for Stripe payment hook
 * Payments are not supported on web platform
 */
export function useStripePayment(): UseStripePaymentReturn {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const processPayment = useCallback(
    async (plan: SubscriptionTier, _cycle: BillingCycle): Promise<boolean> => {
      if (plan === "free") {
        return true;
      }
      setError("Payments are not supported on web. Please use the mobile app.");
      return false;
    },
    [],
  );

  return {
    processPayment,
    isLoading: false,
    error,
    clearError,
    isAvailable: false,
  };
}
