import { useState } from "react";
import { StyleSheet, Pressable, Text, View, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";
import { PRIMARY_COLOR, Spacing } from "@/constants/theme";

export default function FirstEntryScreen() {
  const { completeOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPhoto = async () => {
    setIsLoading(true);

    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photos to add your first moment.",
          [{ text: "OK" }],
        );
        setIsLoading(false);
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // For now, just complete onboarding after selecting an image
        // Entry creation will be implemented with the Feed feature
        await completeOnboarding();
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📸</Text>
        </View>

        <ThemedText type="title" style={styles.title}>
          Add Your First Moment!
        </ThemedText>

        <ThemedText style={styles.description}>
          Start your baby&apos;s journal with a photo or video. You can capture
          new moments or choose from your gallery.
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleAddPhoto}
          disabled={isLoading}
          testID="add-photo-button"
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Loading..." : "Choose from Gallery"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.skipButton}
          onPress={handleSkip}
          testID="skip-button"
        >
          <ThemedText style={styles.skipButtonText}>
            I&apos;ll do this later
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${PRIMARY_COLOR}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  description: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.md,
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
  skipButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
