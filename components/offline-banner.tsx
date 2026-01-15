import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { SemanticColors, Spacing } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Banner that displays when the app is offline.
 * Shows a message indicating the user is viewing cached data.
 */
export function OfflineBanner(): React.ReactNode {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (!isOffline) {
    return null;
  }

  return (
    <View
      testID="offline-banner"
      accessibilityLabel="You are offline. Viewing cached data."
      accessibilityRole="alert"
      style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}
    >
      <Text style={styles.title}>You are offline</Text>
      <Text style={styles.subtitle}>Viewing cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SemanticColors.warning,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    alignItems: "center",
  },
  title: {
    color: SemanticColors.warningText,
    fontWeight: "600",
    fontSize: 14,
  },
  subtitle: {
    color: SemanticColors.warningText,
    fontSize: 12,
    opacity: 0.8,
  },
});
