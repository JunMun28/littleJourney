/**
 * Stripe Payment Hook
 *
 * This file re-exports from the platform-specific implementation.
 * Metro bundler will automatically resolve to:
 * - use-stripe-payment.native.ts for iOS/Android
 * - use-stripe-payment.web.ts for web
 *
 * PRD ref: PAY-002 (Credit card via Stripe)
 */

// Re-export everything from the native implementation for TypeScript
// Metro will resolve to the correct platform file at runtime
export * from "./use-stripe-payment.native";
