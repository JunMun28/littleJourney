import { useState, useCallback } from "react";
import {
  StyleSheet,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";
import { Colors, PRIMARY_COLOR, Spacing } from "@/constants/theme";
import { trackEvent, AnalyticsEvent } from "@/services/analytics";
import { useGoogleAuth, type GoogleAuthResult } from "@/hooks/use-google-auth";
import { useAppleAuth, type AppleAuthResult } from "@/hooks/use-apple-auth";
import { useMagicLinkAuth } from "@/hooks/use-magic-link-auth";
import type { SignInResponse } from "@/services/auth-api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fetch user info from Google using access token
async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<{ email: string; name?: string }> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }
  const data = await response.json();
  return { email: data.email, name: data.name };
}

export default function SignInScreen() {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  // Magic link auth hook
  const handleMagicLinkSuccess = useCallback(
    async (result: SignInResponse) => {
      await signIn(result.user.email);
      trackEvent(AnalyticsEvent.SIGNUP_COMPLETED, { method: "magic_link" });
    },
    [signIn],
  );

  const {
    sendMagicLink,
    isLoading: magicLinkLoading,
    isSent: magicLinkSent,
    error: magicLinkError,
    reset: resetMagicLink,
  } = useMagicLinkAuth({
    onSuccess: handleMagicLinkSuccess,
    onError: (err) => setError(err),
  });

  // Google OAuth hook
  const handleGoogleSuccess = useCallback(
    async (result: GoogleAuthResult) => {
      try {
        setIsOAuthLoading(true);
        const userInfo = await fetchGoogleUserInfo(result.accessToken);
        await signIn(userInfo.email);
        trackEvent(AnalyticsEvent.SIGNUP_COMPLETED, { method: "google" });
      } catch {
        setError("Failed to complete Google sign-in. Please try again.");
      } finally {
        setIsOAuthLoading(false);
      }
    },
    [signIn],
  );

  const {
    signIn: googleSignIn,
    isLoading: googleLoading,
    error: googleError,
  } = useGoogleAuth({
    onSuccess: handleGoogleSuccess,
    onError: (err) => setError(err),
  });

  // Apple OAuth hook
  const handleAppleSuccess = useCallback(
    async (result: AppleAuthResult) => {
      try {
        setIsOAuthLoading(true);
        // Apple provides email only on first sign-in, use user ID as fallback
        const appleEmail =
          result.email || `apple-${result.user}@privaterelay.appleid.com`;
        await signIn(appleEmail);
        trackEvent(AnalyticsEvent.SIGNUP_COMPLETED, { method: "apple" });
      } catch {
        setError("Failed to complete Apple sign-in. Please try again.");
      } finally {
        setIsOAuthLoading(false);
      }
    },
    [signIn],
  );

  const {
    signIn: appleSignIn,
    isLoading: appleLoading,
    error: appleError,
    isAvailable: appleAvailable,
  } = useAppleAuth({
    onSuccess: handleAppleSuccess,
    onError: (err) => setError(err),
  });

  const isValidEmail = EMAIL_REGEX.test(email);
  const anyLoading =
    magicLinkLoading || googleLoading || appleLoading || isOAuthLoading;
  const canSubmit = email.trim().length > 0 && !anyLoading;

  const handleSendMagicLink = async () => {
    setError(null);

    if (!isValidEmail) {
      setError("Please enter a valid email address");
      return;
    }

    await sendMagicLink(email);
  };

  // Show any error from the hooks or local state
  const displayError = magicLinkError || googleError || appleError || error;

  if (magicLinkSent) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Check your email
        </ThemedText>
        <ThemedText
          style={[styles.sentMessage, { color: colors.textSecondary }]}
        >
          We sent a magic link to{"\n"}
          <Text style={{ fontWeight: "600", color: colors.text }}>{email}</Text>
        </ThemedText>
        <ThemedText style={[styles.hint, { color: colors.textMuted }]}>
          Click the link in your email to sign in
        </ThemedText>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            resetMagicLink();
            setEmail("");
          }}
        >
          <Text style={[styles.backButtonText, { color: PRIMARY_COLOR }]}>
            Use a different email
          </Text>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>
            Little Journey
          </ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Capture your baby&apos;s precious moments
          </ThemedText>

          {/* Email Input Section */}
          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: displayError ? "#dc2626" : colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!anyLoading}
            />
            {displayError && (
              <Text style={styles.errorText}>{displayError}</Text>
            )}

            <Pressable
              testID="send-magic-link-button"
              style={[
                styles.primaryButton,
                (!canSubmit || anyLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSendMagicLink}
              disabled={!canSubmit || anyLoading}
              accessibilityState={{ disabled: !canSubmit || anyLoading }}
            >
              <Text style={styles.primaryButtonText}>
                {magicLinkLoading ? "Sending..." : "Send Magic Link"}
              </Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
              or
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          {/* OAuth Buttons */}
          <View style={styles.oauthSection}>
            <Pressable
              testID="google-signin-button"
              style={[
                styles.oauthButton,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
                anyLoading && styles.buttonDisabled,
              ]}
              onPress={googleSignIn}
              disabled={anyLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={[styles.oauthButtonText, { color: colors.text }]}>
                  Continue with Google
                </Text>
              )}
            </Pressable>

            {appleAvailable && (
              <Pressable
                testID="apple-signin-button"
                style={[
                  styles.oauthButton,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                  anyLoading && styles.buttonDisabled,
                ]}
                onPress={appleSignIn}
                disabled={anyLoading}
              >
                {appleLoading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text
                    style={[styles.oauthButtonText, { color: colors.text }]}
                  >
                    Continue with Apple
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          <ThemedText style={[styles.terms, { color: colors.textMuted }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xxl,
    textAlign: "center",
  },
  inputSection: {
    width: "100%",
    maxWidth: 320,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: Spacing.md + 2,
    borderRadius: Spacing.sm,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    fontSize: 13,
  },
  oauthSection: {
    width: "100%",
    maxWidth: 320,
    gap: Spacing.md,
  },
  oauthButton: {
    borderWidth: 1,
    borderRadius: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
  },
  oauthButtonText: {
    fontWeight: "500",
    fontSize: 16,
  },
  terms: {
    marginTop: Spacing.xl,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 280,
  },
  sentMessage: {
    marginBottom: Spacing.lg,
    textAlign: "center",
    lineHeight: 24,
  },
  hint: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  backButton: {
    padding: Spacing.md,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
