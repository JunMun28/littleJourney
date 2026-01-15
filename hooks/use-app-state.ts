import { useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";

interface UseAppStateOptions {
  /** Callback when app returns to foreground from background */
  onForeground?: () => void;
  /** Callback when app goes to background */
  onBackground?: () => void;
}

interface UseAppStateReturn {
  /** Current app state */
  appState: AppStateStatus;
  /** Whether app is in background */
  isInBackground: boolean;
}

/**
 * Hook for tracking app state transitions (MOBILE-005)
 *
 * Handles:
 * - Tracking when app goes to background
 * - Tracking when app returns to foreground
 * - Providing callbacks for state transitions
 *
 * @example
 * ```tsx
 * const { appState, isInBackground } = useAppState({
 *   onForeground: () => refetchData(),
 *   onBackground: () => saveState(),
 * });
 * ```
 */
export function useAppState(
  options: UseAppStateOptions = {},
): UseAppStateReturn {
  const { onForeground, onBackground } = options;

  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const previousStateRef = useRef<AppStateStatus>(AppState.currentState);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      const prevState = previousStateRef.current;

      // App returning to foreground from background
      if (prevState === "background" && nextAppState === "active") {
        onForeground?.();
      }

      // App going to background
      if (nextAppState === "background" && prevState !== "background") {
        onBackground?.();
      }

      previousStateRef.current = nextAppState;
      setAppState(nextAppState);
    },
    [onForeground, onBackground],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  return {
    appState,
    isInBackground: appState === "background",
  };
}
