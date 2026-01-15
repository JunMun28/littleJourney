/**
 * Magic Link Authentication Hook
 * PRD: AUTH-001 - Email magic link authentication
 *
 * Handles sending magic link emails and verifying tokens
 * via deep links when user taps the link in their email.
 */

import { useState, useCallback, useEffect } from "react";
import * as Linking from "expo-linking";
import { authApi, type SignInResponse } from "@/services/auth-api";

export interface MagicLinkAuthOptions {
  /** Called when magic link verification succeeds */
  onSuccess?: (result: SignInResponse) => void;
  /** Called when verification fails */
  onError?: (error: string) => void;
}

export interface UseMagicLinkAuthReturn {
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Whether the magic link email was sent successfully */
  isSent: boolean;
  /** Error message if any */
  error: string | null;
  /** Send magic link to email address */
  sendMagicLink: (email: string) => Promise<void>;
  /** Reset state (to try different email) */
  reset: () => void;
}

/**
 * Hook for magic link authentication flow.
 *
 * Handles both:
 * 1. Sending magic link emails via authApi
 * 2. Listening for deep links (littlejourney://verify?token=xxx) and verifying tokens
 */
export function useMagicLinkAuth(
  options?: MagicLinkAuthOptions,
): UseMagicLinkAuthReturn {
  const { onSuccess, onError } = options ?? {};

  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extract token from magic link URL
   */
  const extractToken = useCallback((url: string): string | null => {
    try {
      const parsed = Linking.parse(url);
      const token = parsed.queryParams?.token;
      return typeof token === "string" ? token : null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Verify magic link token and complete authentication
   */
  const verifyToken = useCallback(
    async (token: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await authApi.verifyMagicLink(token);

        if (result.error) {
          setError(result.error.message);
          onError?.(result.error.message);
        } else if (result.data) {
          onSuccess?.(result.data);
        }
      } catch {
        const errorMsg = "Failed to verify magic link. Please try again.";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError],
  );

  /**
   * Handle incoming URL (either initial or from deep link)
   */
  const handleUrl = useCallback(
    async (url: string | null) => {
      if (!url) return;

      const token = extractToken(url);
      if (token) {
        await verifyToken(token);
      }
    },
    [extractToken, verifyToken],
  );

  /**
   * Set up deep link listeners on mount
   */
  useEffect(() => {
    // Check for initial URL (app opened via deep link)
    Linking.getInitialURL().then(handleUrl);

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleUrl]);

  /**
   * Send magic link to email address
   */
  const sendMagicLink = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    setIsSent(false);

    try {
      const result = await authApi.requestMagicLink(email);

      if (result.error) {
        setError(result.error.message);
      } else {
        setIsSent(true);
      }
    } catch {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset state (to try different email)
   */
  const reset = useCallback(() => {
    setIsSent(false);
    setError(null);
  }, []);

  return {
    isLoading,
    isSent,
    error,
    sendMagicLink,
    reset,
  };
}
