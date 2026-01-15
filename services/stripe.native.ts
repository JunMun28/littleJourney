/**
 * Stripe Payment Service - Native Implementation
 *
 * Provides payment functionality using @stripe/stripe-react-native.
 * Supports Singapore payment methods via Stripe Payment Sheet:
 * - Credit/Debit Cards (PAY-002)
 * - PayNow (PAY-003) - Singapore instant bank transfer
 * - GrabPay (PAY-004) - Singapore e-wallet
 *
 * PRD ref: PAY-002 (Credit card via Stripe)
 * PRD ref: PAY-003 (PayNow payment)
 * PRD ref: PAY-004 (GrabPay payment)
 *
 * Note: PayNow and GrabPay availability depends on:
 * 1. Backend configuring PaymentIntent with payment_method_types: ['card', 'paynow', 'grabpay']
 * 2. Stripe Dashboard having these payment methods enabled
 * 3. Currency being SGD (Singapore Dollars)
 */

import { initStripe as initStripeNative } from "@stripe/stripe-react-native";
import Constants from "expo-constants";

// Types for Stripe params (using simplified local types for flexibility)
export interface StripeSetupParams {
  merchantDisplayName: string;
  paymentIntentClientSecret: string;
  customerEphemeralKeySecret?: string;
  customerId?: string;
  applePay?: { merchantCountryCode: string };
  googlePay?: { merchantCountryCode: string; testEnv?: boolean };
  style?: "automatic" | "alwaysLight" | "alwaysDark";
  returnURL?: string;
}

export interface StripeInitResult {
  error?: { code: string; message: string } | null;
}

export interface StripePresentResult {
  error?: { code: string; message: string } | null;
}

// Types
export interface PaymentSheetParams {
  amount: number; // Amount in cents
  currency: "sgd" | "usd";
  description?: string;
  customerId?: string;
  ephemeralKey?: string;
  paymentIntentClientSecret?: string;
}

export interface StripeSuccess<T> {
  data: T;
  error?: never;
}

export interface StripeError {
  data?: never;
  error: {
    code: string;
    message: string;
  };
}

export type StripeResult<T> = StripeSuccess<T> | StripeError;

// Configuration
const STRIPE_PUBLISHABLE_KEY =
  Constants.expoConfig?.extra?.stripePublishableKey ??
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  "";

const MERCHANT_IDENTIFIER = "merchant.sg.littlejourney.app";
const URL_SCHEME = "littlejourney";

// Type for Stripe hooks from useStripe()
export interface StripeHooks {
  initPaymentSheet: (params: StripeSetupParams) => Promise<StripeInitResult>;
  presentPaymentSheet: () => Promise<StripePresentResult>;
}

// In-memory store for Stripe hooks (set by StripeProvider)
let stripeHooks: StripeHooks | null = null;

/**
 * Set the Stripe hooks from StripeProvider context
 * This allows the service to be used without direct hook access
 */
export function setStripeHooks(hooks: StripeHooks | null): void {
  stripeHooks = hooks;
}

/**
 * Check if Stripe is available (publishable key configured)
 */
export function isStripeAvailable(): boolean {
  return STRIPE_PUBLISHABLE_KEY.length > 0;
}

/**
 * Initialize Stripe SDK
 * Should be called once at app startup
 */
export async function initStripe(): Promise<void> {
  if (!isStripeAvailable()) {
    console.warn("Stripe publishable key not configured");
    return;
  }

  await initStripeNative({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    merchantIdentifier: MERCHANT_IDENTIFIER,
    urlScheme: URL_SCHEME,
  });
}

/**
 * Create and initialize a Payment Sheet
 * In production, this would first call your backend to create a PaymentIntent
 */
export async function createPaymentSheet(
  params: PaymentSheetParams,
): Promise<StripeResult<{ ready: boolean }>> {
  // Validate amount
  if (params.amount <= 0) {
    return {
      error: {
        code: "invalid_amount",
        message: "Amount must be greater than 0",
      },
    };
  }

  // Validate currency
  if (!params.currency) {
    return {
      error: {
        code: "invalid_currency",
        message: "Currency is required",
      },
    };
  }

  if (!stripeHooks) {
    return {
      error: {
        code: "not_initialized",
        message:
          "Stripe hooks not initialized. Ensure StripeProvider is mounted.",
      },
    };
  }

  try {
    // Build setup params - payment intent client secret is required
    const setupParams: StripeSetupParams = {
      merchantDisplayName: "Little Journey",
      paymentIntentClientSecret: params.paymentIntentClientSecret ?? "",
      customerEphemeralKeySecret: params.ephemeralKey,
      customerId: params.customerId,
      // Apple Pay / Google Pay
      applePay: {
        merchantCountryCode: "SG",
      },
      googlePay: {
        merchantCountryCode: "SG",
        testEnv: __DEV__,
      },
      // Style
      style: "automatic",
      returnURL: `${URL_SCHEME}://stripe-redirect`,
    };

    const { error } = await stripeHooks.initPaymentSheet(setupParams);

    if (error) {
      return {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return { data: { ready: true } };
  } catch (e) {
    return {
      error: {
        code: "initialization_failed",
        message:
          e instanceof Error ? e.message : "Failed to initialize payment sheet",
      },
    };
  }
}

/**
 * Present the Payment Sheet to the user
 * Returns success if payment completed, or error if cancelled/failed
 */
export async function presentPaymentSheet(): Promise<
  StripeResult<{ success: boolean }>
> {
  if (!stripeHooks) {
    return {
      error: {
        code: "not_initialized",
        message:
          "Stripe hooks not initialized. Ensure StripeProvider is mounted.",
      },
    };
  }

  try {
    const { error } = await stripeHooks.presentPaymentSheet();

    if (error) {
      return {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return { data: { success: true } };
  } catch (e) {
    return {
      error: {
        code: "presentation_failed",
        message:
          e instanceof Error ? e.message : "Failed to present payment sheet",
      },
    };
  }
}

/**
 * Helper to check if a result is an error
 */
export function isStripeError<T>(
  result: StripeResult<T>,
): result is StripeError {
  return "error" in result && result.error !== undefined;
}

/**
 * Get price ID for a subscription plan
 * In production, these would be your actual Stripe Price IDs
 */
export function getStripePriceId(
  plan: "standard" | "premium",
  cycle: "monthly" | "yearly",
): string {
  const priceIds: Record<string, Record<string, string>> = {
    standard: {
      monthly: "price_standard_monthly",
      yearly: "price_standard_yearly",
    },
    premium: {
      monthly: "price_premium_monthly",
      yearly: "price_premium_yearly",
    },
  };

  return priceIds[plan]?.[cycle] ?? "";
}

/**
 * Get amount in cents for a plan
 * PRD Section 12.1 Tier Structure
 */
export function getPlanAmountInCents(
  plan: "standard" | "premium",
  cycle: "monthly" | "yearly",
): number {
  const amounts: Record<string, Record<string, number>> = {
    standard: {
      monthly: 499, // $4.99 SGD
      yearly: 3999, // $39.99 SGD (2 months free)
    },
    premium: {
      monthly: 999, // $9.99 SGD
      yearly: 7999, // $79.99 SGD (2 months free)
    },
  };

  return amounts[plan]?.[cycle] ?? 0;
}
