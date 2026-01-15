import React, { createContext, useContext, useCallback } from "react";
import { AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAppState } from "@/hooks/use-app-state";

interface AppStateContextValue {
  appState: AppStateStatus;
  isInBackground: boolean;
}

const AppStateContext = createContext<AppStateContextValue>({
  appState: "active",
  isInBackground: false,
});

interface AppStateProviderProps {
  children: React.ReactNode;
}

/**
 * Provider for app state management (MOBILE-005)
 *
 * Handles:
 * - Tracking app foreground/background transitions
 * - Invalidating stale queries when returning from background
 * - Providing app state to child components
 */
export function AppStateProvider({ children }: AppStateProviderProps) {
  const queryClient = useQueryClient();

  const handleForeground = useCallback(() => {
    // Invalidate stale queries when returning from background
    // This ensures data is refreshed if it became stale while backgrounded
    queryClient.invalidateQueries({
      predicate: (query) => query.isStale(),
    });
  }, [queryClient]);

  const { appState, isInBackground } = useAppState({
    onForeground: handleForeground,
  });

  return (
    <AppStateContext.Provider value={{ appState, isInBackground }}>
      {children}
    </AppStateContext.Provider>
  );
}

/**
 * Hook to access app state context
 */
export function useAppStateContext(): AppStateContextValue {
  return useContext(AppStateContext);
}
