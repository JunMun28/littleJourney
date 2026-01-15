import { StyleSheet, Pressable, Text, useColorScheme } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";
import { Colors, PRIMARY_COLOR, Spacing } from "@/constants/theme";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const handleSignIn = async () => {
    // TODO: Replace with actual auth flow (magic link input, OAuth buttons)
    await signIn("demo@littlejourney.sg");
    // After sign-in, redirect to onboarding (root layout handles this)
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Little Journey
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
        Capture your baby&apos;s precious moments
      </ThemedText>

      <Pressable style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Continue with Email</Text>
      </Pressable>

      <ThemedText style={[styles.hint, { color: colors.textMuted }]}>
        Demo: Tap to sign in automatically
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: Spacing.xxl + Spacing.lg,
    textAlign: "center",
  },
  button: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.md,
    marginBottom: Spacing.lg,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
  hint: {
    fontSize: 12,
  },
});
