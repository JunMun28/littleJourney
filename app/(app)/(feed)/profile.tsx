import { StyleSheet, ScrollView } from "react-native";
import { Stack } from "expo-router/stack";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { ChildProfileCard } from "@/components/settings/child-profile-card";
import { useChildFlat } from "@/hooks/use-children";
import { Spacing } from "@/constants/theme";

export default function ProfileScreen() {
  const { child, isLoading } = useChildFlat();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Child Profile",
          headerLargeTitle: true,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        {child && (
          <ChildProfileCard
            child={child}
            onEdit={() => {}}
            onInvite={() => {}}
          />
        )}
        
        {!child && !isLoading && (
          <ThemedText style={styles.emptyText}>
            No child profile found.
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  emptyText: {
    textAlign: "center",
    marginTop: Spacing.xxl,
    opacity: 0.6,
  },
});
