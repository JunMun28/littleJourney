import { useEffect, useState, useRef, useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";

export interface UseNetworkStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
}

export interface UseNetworkStatusResult {
  isOnline: boolean;
  isOffline: boolean;
}

/**
 * Hook to track network connectivity status.
 * Uses @react-native-community/netinfo for cross-platform support.
 */
export function useNetworkStatus(
  options: UseNetworkStatusOptions = {},
): UseNetworkStatusResult {
  const { onOnline, onOffline } = options;
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const previousOnline = useRef<boolean | null>(null);

  // Memoize callbacks to prevent unnecessary re-subscriptions
  const onOnlineRef = useRef(onOnline);
  const onOfflineRef = useRef(onOffline);

  useEffect(() => {
    onOnlineRef.current = onOnline;
    onOfflineRef.current = onOffline;
  }, [onOnline, onOffline]);

  const handleNetworkChange = useCallback(
    (state: { isConnected: boolean | null }) => {
      // Treat null as offline (unknown connection state)
      const connected = state.isConnected === true;
      setIsOnline(connected);

      // Fire callbacks on state transitions
      if (previousOnline.current !== null) {
        if (previousOnline.current && !connected) {
          onOfflineRef.current?.();
        } else if (!previousOnline.current && connected) {
          onOnlineRef.current?.();
        }
      }

      previousOnline.current = connected;
    },
    [],
  );

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
