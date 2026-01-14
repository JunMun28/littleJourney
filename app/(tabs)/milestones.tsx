import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function MilestonesScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Milestones</ThemedText>
      <ThemedText>Track your baby&apos;s important moments.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
});
