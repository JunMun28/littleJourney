import { StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();

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
        style={[
          styles.button,
          { backgroundColor: Colors[colorScheme ?? "light"].tint },
        ]}
        onPress={handleSignIn}
      >
        <ThemedText
          style={styles.buttonText}
          lightColor="#fff"
          darkColor="#fff"
        >
          Continue with Email
        </ThemedText>
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
  },
  hint: {
    opacity: 0.5,
    fontSize: 12,
  },
});
