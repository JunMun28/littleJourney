/**
 * Stripe Payment Service - Web Stub
 *
 * Web platform stub for Stripe payment service.
 * Stripe React Native is not available on web.
 * PRD ref: PAY-002 (Credit card via Stripe)
 */

// Types (shared with native implementation)
export interface PaymentSheetParams {
  amount: number;
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

export interface StripeHooks {
  initPaymentSheet: (params: StripeSetupParams) => Promise<StripeInitResult>;
  presentPaymentSheet: () => Promise<StripePresentResult>;
}

/**
 * Set the Stripe hooks - no-op on web
 */
export function setStripeHooks(_hooks: StripeHooks | null): void {
  // No-op on web
}

/**
 * Check if Stripe is available - always false on web
 */
export function isStripeAvailable(): boolean {
  return false;
}

/**
 * Initialize Stripe SDK - no-op on web
 */
export async function initStripe(): Promise<void> {
  // No-op on web
}

/**
 * Create payment sheet - not supported on web
 */
export async function createPaymentSheet(
  _params: PaymentSheetParams,
): Promise<StripeResult<{ ready: boolean }>> {
  return {
    error: {
      code: "not_supported",
      message: "Payments are not supported on web. Please use the mobile app.",
    },
  };
}

/**
 * Present payment sheet - not supported on web
 */
export async function presentPaymentSheet(): Promise<
  StripeResult<{ success: boolean }>
> {
  return {
    error: {
      code: "not_supported",
      message: "Payments are not supported on web. Please use the mobile app.",
    },
  };
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
 */
export function getPlanAmountInCents(
  plan: "standard" | "premium",
  cycle: "monthly" | "yearly",
): number {
  const amounts: Record<string, Record<string, number>> = {
    standard: {
      monthly: 499,
      yearly: 3999,
    },
    premium: {
      monthly: 999,
      yearly: 7999,
    },
  };

  return amounts[plan]?.[cycle] ?? 0;
}
