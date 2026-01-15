/**
 * Stripe Payment Service
 *
 * This file re-exports from the platform-specific implementation.
 * Metro bundler will automatically resolve to:
 * - stripe.native.ts for iOS/Android
 * - stripe.web.ts for web
 *
 * PRD ref: PAY-002 (Credit card via Stripe)
 */

// Re-export everything from the native implementation for TypeScript
// Metro will resolve to the correct platform file at runtime
export * from "./stripe.native";
