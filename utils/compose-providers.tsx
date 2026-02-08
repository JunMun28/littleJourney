import { type ReactNode, type ComponentType, type ReactElement } from "react";

type ProviderComponent = ComponentType<{ children: ReactNode }>;

/**
 * Composes multiple provider components into a single component.
 * This doesn't change the runtime behavior but makes deeply nested
 * providers more readable and maintainable.
 *
 * @example
 * const Providers = composeProviders([
 *   AuthProvider,
 *   ThemeProvider,
 *   DataProvider,
 * ]);
 *
 * // Usage:
 * <Providers>
 *   <App />
 * </Providers>
 */
export function composeProviders(
  providers: ProviderComponent[],
): ComponentType<{ children: ReactNode }> {
  return function ComposedProviders({ children }: { children: ReactNode }) {
    return providers.reduceRight<ReactElement>(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children as ReactElement,
    );
  };
}

/**
 * Alternative: Use with JSX directly for better type inference
 *
 * @example
 * <ProviderComposer providers={[AuthProvider, ThemeProvider]}>
 *   <App />
 * </ProviderComposer>
 */
export function ProviderComposer({
  providers,
  children,
}: {
  providers: ProviderComponent[];
  children: ReactNode;
}) {
  return providers.reduceRight<ReactElement>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children as ReactElement,
  );
}
