import { StyleSheet, Pressable, Text } from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";

const PRIMARY_COLOR = "#0a7ea4";

export default function SignInScreen() {
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    // TODO: Replace with actual auth flow (magic link input, OAuth buttons)
    await signIn("demo@littlejourney.sg");
    router.replace("/(tabs)");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Little Journey
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Capture your baby&apos;s precious moments
      </ThemedText>

      <Pressable
        style={[styles.button, { backgroundColor: PRIMARY_COLOR }]}
        onPress={handleSignIn}
      >
        <Text style={styles.buttonText}>Continue with Email</Text>
      </Pressable>

      <ThemedText style={styles.hint}>
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
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 48,
    textAlign: "center",
    opacity: 0.7,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
  hint: {
    opacity: 0.5,
    fontSize: 12,
  },
});
