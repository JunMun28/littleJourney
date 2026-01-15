/**
 * Apple Sign-In Authentication Hook
 * PRD: AUTH-003 - Apple Sign-In authentication
 *
 * Uses expo-apple-authentication for native Apple Sign-In on iOS.
 * Returns user credentials and identity token on success.
 */

import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

export interface AppleAuthResult {
  user: string;
  email: string | null;
  fullName: {
    givenName: string | null;
    familyName: string | null;
  } | null;
  identityToken: string | null;
  authorizationCode: string | null;
}

export interface UseAppleAuthOptions {
  onSuccess?: (result: AppleAuthResult) => void;
  onError?: (error: string) => void;
}

export interface UseAppleAuthReturn {
  signIn: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;
}

export function useAppleAuth(
  options: UseAppleAuthOptions = {},
): UseAppleAuthReturn {
  const { onSuccess, onError } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      // Apple Sign-In is only available on iOS 13+
      if (Platform.OS !== "ios") {
        setIsAvailable(false);
        return;
      }

      try {
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAvailable(available);
      } catch {
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const result: AppleAuthResult = {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
      };

      setIsLoading(false);
      onSuccess?.(result);
    } catch (err) {
      setIsLoading(false);

      // Check if user cancelled
      if (
        err instanceof Error &&
        (err.name === "ERR_REQUEST_CANCELED" ||
          err.message.includes("canceled"))
      ) {
        // User cancelled - not an error
        return;
      }

      const errorMsg = "Apple Sign-In failed. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [onSuccess, onError]);

  return {
    signIn,
    isLoading,
    error,
    isAvailable,
  };
}
