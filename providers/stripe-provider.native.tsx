/**
 * Stripe Provider - Native Implementation
 *
 * Wraps the app with StripeProvider from @stripe/stripe-react-native
 * PRD ref: PAY-002 (Credit card via Stripe)
 */

import type { ReactNode, ReactElement } from "react";
import { useEffect, createContext, useContext } from "react";
import { StripeProvider as StripeSDKProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";

import { initStripe, isStripeAvailable } from "@/services/stripe";

interface StripeProviderProps {
  children: ReactNode;
}

interface StripeContextValue {
  isReady: boolean;
}

const StripeContext = createContext<StripeContextValue>({ isReady: false });

export function useStripeContext(): StripeContextValue {
  return useContext(StripeContext);
}

const STRIPE_PUBLISHABLE_KEY =
  Constants.expoConfig?.extra?.stripePublishableKey ??
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  "";

const MERCHANT_IDENTIFIER = "merchant.sg.littlejourney.app";
const URL_SCHEME = "littlejourney";

/**
 * Stripe Provider component
 * Wraps children with Stripe SDK context
 */
export function StripeProvider({
  children,
}: StripeProviderProps): ReactElement {
  // Initialize Stripe on mount
  useEffect(() => {
    if (isStripeAvailable()) {
      initStripe().catch((error: unknown) => {
        console.warn("Failed to initialize Stripe:", error);
      });
    }
  }, []);

  // If Stripe is not configured, just render children without provider
  if (!isStripeAvailable()) {
    return (
      <StripeContext.Provider value={{ isReady: false }}>
        {children}
      </StripeContext.Provider>
    ) as ReactElement;
  }

  return (
    <StripeSDKProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={MERCHANT_IDENTIFIER}
      urlScheme={URL_SCHEME}
    >
      <StripeContext.Provider value={{ isReady: true }}>
        {children}
      </StripeContext.Provider>
    </StripeSDKProvider>
  );
}
