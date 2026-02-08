import { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { Check, Trash2 } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { useMilestonesFlat, useCompleteMilestone, useDeleteMilestone } from "@/hooks/use-milestones";
import { useChildFlat } from "@/hooks/use-children";
import { useNotifications } from "@/contexts/notification-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, SemanticColors, Spacing } from "@/constants/theme";
import { Confetti, useConfetti } from "@/components/ui/confetti";

export default function CompleteMilestoneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  
  const { milestones } = useMilestonesFlat();
  const { child } = useChildFlat();
  const completeMilestone = useCompleteMilestone();
  const deleteMilestone = useDeleteMilestone();
  const { cancelMilestoneReminder } = useNotifications();
  const { active: confettiActive, fire: fireConfetti, handleComplete: handleConfettiComplete } = useConfetti();

  const milestone = milestones.find(m => m.id === id);
  
  const [celebrationDate, setCelebrationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!milestone) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>Milestone not found</ThemedText>
        <Button variant="primary" onPress={() => router.back()}>
          Go Back
        </Button>
      </ThemedView>
    );
  }

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      await completeMilestone.mutateAsync({
        id: milestone.id,
        celebrationDate: celebrationDate.toISOString().split("T")[0],
        notes: notes.trim() || undefined,
      });
      
      await cancelMilestoneReminder(milestone.id);
      
      fireConfetti();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Give confetti time to show before closing
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMilestone.mutateAsync(milestone.id);
      await cancelMilestoneReminder(milestone.id);
      router.back();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setCelebrationDate(selectedDate);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Confetti active={confettiActive} onComplete={handleConfettiComplete} />
      
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Check size={32} color={SemanticColors.success} />
            </View>
            <ThemedText type="title" style={styles.title}>
              Complete Milestone
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              {milestone.title}
            </ThemedText>
          </View>

          {/* Celebration Date */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>Celebration Date</ThemedText>
            <Pressable
              style={[
                styles.dateButton,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText>
                {celebrationDate.toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </ThemedText>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={celebrationDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>Notes (optional)</ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this milestone..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              onPress={handleComplete}
            >
              Mark as Complete
            </Button>

            <Button
              variant="ghost"
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Pressable
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={isSubmitting}
            >
              <Trash2 size={18} color={SemanticColors.error} />
              <ThemedText style={[styles.deleteText, { color: SemanticColors.error }]}>
                Delete Milestone
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 16,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
});
