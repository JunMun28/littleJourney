/**
 * Google OAuth Authentication Hook
 * PRD: AUTH-002 - Google OAuth authentication
 *
 * Uses expo-auth-session for OAuth flow with Google.
 * Returns access token on success for user profile fetching.
 */

import { useState, useEffect, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { useAuthRequest } from "expo-auth-session/providers/google";

// Ensure browser session is completed properly
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration from environment
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export interface GoogleAuthResult {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  scope?: string;
  issuedAt?: number;
}

export interface UseGoogleAuthOptions {
  onSuccess?: (result: GoogleAuthResult) => void;
  onError?: (error: string) => void;
}

export interface UseGoogleAuthReturn {
  signIn: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useGoogleAuth(
  options: UseGoogleAuthOptions = {},
): UseGoogleAuthReturn {
  const { onSuccess, onError } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = makeRedirectUri({
    scheme: "littlejourney",
    path: "oauth",
  });

  const [request, response, promptAsync] = useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
    scopes: ["openid", "profile", "email"],
  });

  // Handle response from OAuth flow
  useEffect(() => {
    if (response?.type === "success" && response.authentication) {
      setIsLoading(false);
      setError(null);

      const result: GoogleAuthResult = {
        accessToken: response.authentication.accessToken,
        idToken: response.authentication.idToken ?? undefined,
        refreshToken: response.authentication.refreshToken ?? undefined,
        tokenType: response.authentication.tokenType ?? undefined,
        expiresIn: response.authentication.expiresIn ?? undefined,
        scope: response.authentication.scope ?? undefined,
        issuedAt: response.authentication.issuedAt ?? undefined,
      };

      onSuccess?.(result);
    }
  }, [response, onSuccess]);

  const signIn = useCallback(async () => {
    if (!request) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await promptAsync();

      if (result.type === "error") {
        const errorMsg = "Authentication failed. Please try again.";
        setError(errorMsg);
        onError?.(errorMsg);
      } else if (result.type === "cancel" || result.type === "dismiss") {
        // User cancelled - not an error, just reset loading
      }
      // Success is handled by the useEffect above
    } catch {
      const errorMsg = "Authentication failed. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [request, promptAsync, onError]);

  return {
    signIn,
    isLoading,
    error,
  };
}
