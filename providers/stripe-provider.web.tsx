/**
 * Stripe Provider - Web Stub
 *
 * Web platform stub for Stripe provider.
 * Stripe React Native is not available on web.
 * PRD ref: PAY-002 (Credit card via Stripe)
 */

import type { ReactNode, ReactElement } from "react";
import { createContext, useContext } from "react";

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

/**
 * Web stub for Stripe Provider
 * Just passes through children without Stripe context
 */
export function StripeProvider({
  children,
}: StripeProviderProps): ReactElement {
  return (
    <StripeContext.Provider value={{ isReady: false }}>
      {children}
    </StripeContext.Provider>
  ) as ReactElement;
}
