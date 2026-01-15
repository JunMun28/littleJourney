import { useState } from "react";
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
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";
import { Colors, PRIMARY_COLOR, Spacing } from "@/constants/theme";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignInStep = "input" | "sent";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<SignInStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = EMAIL_REGEX.test(email);
  const canSubmit = email.trim().length > 0 && !isLoading;

  const handleSendMagicLink = async () => {
    setError(null);

    if (!isValidEmail) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: In production, call API to send magic link email
      // For now, simulate sending and auto-sign-in for demo
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStep("sent");

      // Auto sign-in after short delay for demo purposes
      setTimeout(async () => {
        await signIn(email);
      }, 1500);
    } catch {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    setError(null);
    setIsLoading(true);
    try {
      // TODO: In production, initiate OAuth flow
      await signIn(`${provider}@demo.littlejourney.sg`);
    } catch {
      setError(`Failed to sign in with ${provider}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "sent") {
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
            setStep("input");
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
                  borderColor: error ? "#dc2626" : colors.inputBorder,
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
              editable={!isLoading}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              testID="send-magic-link-button"
              style={[
                styles.primaryButton,
                !canSubmit && styles.buttonDisabled,
              ]}
              onPress={handleSendMagicLink}
              disabled={!canSubmit}
              accessibilityState={{ disabled: !canSubmit }}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Sending..." : "Send Magic Link"}
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
              style={[
                styles.oauthButton,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleOAuthSignIn("google")}
              disabled={isLoading}
            >
              <Text style={[styles.oauthButtonText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.oauthButton,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleOAuthSignIn("apple")}
              disabled={isLoading}
            >
              <Text style={[styles.oauthButtonText, { color: colors.text }]}>
                Continue with Apple
              </Text>
            </Pressable>
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
