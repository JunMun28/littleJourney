/**
 * Stripe Provider
 *
 * This file re-exports from the platform-specific implementation.
 * Metro bundler will automatically resolve to:
 * - stripe-provider.native.tsx for iOS/Android
 * - stripe-provider.web.tsx for web
 *
 * PRD ref: PAY-002 (Credit card via Stripe)
 */

// Re-export everything from the native implementation for TypeScript
// Metro will resolve to the correct platform file at runtime
export * from "./stripe-provider.native";
