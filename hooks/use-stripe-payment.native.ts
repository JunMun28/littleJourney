/**
 * Stripe Payment Hook - Native Implementation
 *
 * Provides a hook to handle Stripe payment flow for subscriptions.
 * Supports Singapore payment methods: Credit Card, PayNow, GrabPay.
 *
 * PRD ref: PAY-002 (Credit card via Stripe)
 * PRD ref: PAY-003 (PayNow payment)
 * PRD ref: PAY-004 (GrabPay payment)
 *
 * Note: PayNow and GrabPay require backend configuration:
 * - PaymentIntent must include payment_method_types: ['card', 'paynow', 'grabpay']
 * - Account must have PayNow and GrabPay enabled in Stripe Dashboard
 * - Currency must be SGD for these payment methods
 */

import { useState, useCallback, useEffect } from "react";
import { useStripe } from "@stripe/stripe-react-native";

import {
  createPaymentSheet,
  presentPaymentSheet,
  setStripeHooks,
  isStripeError,
  isStripeAvailable,
  getPlanAmountInCents,
} from "@/services/stripe";
import type { SubscriptionTier } from "@/contexts/storage-context";
import type { BillingCycle } from "@/contexts/subscription-context";

// Mock API endpoint for creating payment intent
// In production, this would call your Cloudflare Worker backend
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.littlejourney.sg";

/**
 * Response from backend when creating a PaymentIntent
 * Backend should configure payment_method_types to enable PayNow/GrabPay
 */
interface PaymentIntentResponse {
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  /** Payment methods enabled for this intent (e.g., ['card', 'paynow', 'grabpay']) */
  paymentMethodTypes?: string[];
}

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
 * Fetch payment intent from backend
 * In mock mode, returns simulated data
 */
async function fetchPaymentIntent(
  amount: number,
  currency: string,
  description: string,
): Promise<PaymentIntentResponse | null> {
  const useMock = process.env.EXPO_PUBLIC_USE_MOCK_API !== "false";

  if (useMock) {
    // Mock payment intent for development
    // In production, this calls your backend to create a real PaymentIntent
    // Backend must enable payment_method_types for PayNow/GrabPay (PAY-003, PAY-004)
    return {
      clientSecret: `pi_mock_${Date.now()}_secret_mock`,
      ephemeralKey: `ek_mock_${Date.now()}`,
      customerId: `cus_mock_${Date.now()}`,
      // Singapore payment methods - enabled by backend PaymentIntent configuration
      paymentMethodTypes: ["card", "paynow", "grabpay"],
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        description,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create payment intent");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching payment intent:", error);
    return null;
  }
}

/**
 * Hook for handling Stripe payments
 */
export function useStripePayment(): UseStripePaymentReturn {
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register Stripe hooks with the service
  useEffect(() => {
    if (stripe) {
      setStripeHooks({
        initPaymentSheet: stripe.initPaymentSheet,
        presentPaymentSheet: stripe.presentPaymentSheet,
      });
    }
  }, [stripe]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const processPayment = useCallback(
    async (plan: SubscriptionTier, cycle: BillingCycle): Promise<boolean> => {
      if (plan === "free") {
        // No payment needed for free plan
        return true;
      }

      if (!isStripeAvailable()) {
        setError("Payment service is not configured.");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get amount for the selected plan
        const amount = getPlanAmountInCents(
          plan as "standard" | "premium",
          cycle,
        );
        const description = `Little Journey ${plan} ${cycle} subscription`;

        // Fetch payment intent from backend
        const paymentIntent = await fetchPaymentIntent(
          amount,
          "sgd",
          description,
        );

        if (!paymentIntent) {
          setError("Unable to connect to payment server. Please try again.");
          return false;
        }

        // Initialize the payment sheet
        const initResult = await createPaymentSheet({
          amount,
          currency: "sgd",
          description,
          paymentIntentClientSecret: paymentIntent.clientSecret,
          ephemeralKey: paymentIntent.ephemeralKey,
          customerId: paymentIntent.customerId,
        });

        if (isStripeError(initResult)) {
          setError(initResult.error.message);
          return false;
        }

        // Present the payment sheet to the user
        const paymentResult = await presentPaymentSheet();

        if (isStripeError(paymentResult)) {
          // Check if user cancelled (not a real error)
          if (paymentResult.error.code === "Canceled") {
            // User cancelled, not an error state
            return false;
          }
          setError(paymentResult.error.message);
          return false;
        }

        // Payment successful
        return true;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "An unexpected error occurred";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    processPayment,
    isLoading,
    error,
    clearError,
    isAvailable: isStripeAvailable(),
  };
}
