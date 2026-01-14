import { useState } from "react";
import { StyleSheet, Pressable, Text, View, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";

const PRIMARY_COLOR = "#0a7ea4";

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
    padding: 24,
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
    marginBottom: 32,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    paddingTop: 16,
    gap: 12,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
