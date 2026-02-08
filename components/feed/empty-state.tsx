import { View, StyleSheet } from "react-native";
import { Camera } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { Primary } from "@/constants/design-tokens";

export function EmptyState() {
  return (
    <View style={styles.container}>
      <Camera size={64} color={Primary[300]} style={styles.icon} />
      <ThemedText type="subtitle" style={styles.title}>
        No moments yet
      </ThemedText>
      <ThemedText style={styles.text}>
        Tap the + button to add your first memory
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  text: {
    textAlign: "center",
    opacity: 0.7,
  },
});
