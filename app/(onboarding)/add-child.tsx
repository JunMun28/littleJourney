import { StyleSheet, Pressable, Text } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";

const PRIMARY_COLOR = "#0a7ea4";

export default function AddChildScreen() {
  const { completeOnboarding } = useAuth();

  const handleContinue = async () => {
    // TODO: Add form fields for child name, DOB, photo
    // TODO: Save child data to backend
    // For now, just complete onboarding (root layout handles navigation)
    await completeOnboarding();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Add Your Child
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Tell us about your little one to get started
      </ThemedText>

      <ThemedText style={styles.placeholder}>
        Child form fields coming soon:
        {"\n"}- Name (required)
        {"\n"}- Date of birth (required)
        {"\n"}- Photo (optional)
      </ThemedText>

      <Pressable
        style={[styles.button, { backgroundColor: PRIMARY_COLOR }]}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>

      <ThemedText style={styles.hint}>
        Demo: Tap to complete onboarding
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
    marginBottom: 32,
    textAlign: "center",
    opacity: 0.7,
  },
  placeholder: {
    marginBottom: 48,
    textAlign: "left",
    opacity: 0.5,
    lineHeight: 24,
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
