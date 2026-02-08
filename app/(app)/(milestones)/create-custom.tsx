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
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { useCreateMilestone } from "@/hooks/use-milestones";
import { useChildFlat } from "@/hooks/use-children";
import { useNotifications } from "@/contexts/notification-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, Spacing } from "@/constants/theme";

export default function CreateCustomMilestoneScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  
  const { child } = useChildFlat();
  const createMilestone = useCreateMilestone();
  const { scheduleMilestoneReminder } = useNotifications();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !child?.id) return;

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const milestoneDate = date.toISOString().split("T")[0];
      
      await createMilestone.mutateAsync({
        childId: child.id,
        milestoneDate,
        customTitle: title.trim(),
        customDescription: description.trim() || undefined,
      });

      await scheduleMilestoneReminder(
        "custom",
        title.trim(),
        milestoneDate,
        7
      );

      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Custom Milestone
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Create your own special moment
            </ThemedText>
          </View>

          {/* Title */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>
              Title <ThemedText style={{ color: Colors.light.tint }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., First Laugh, First Haircut"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>
              Description
              <ThemedText style={[styles.optional, { color: colors.textMuted }]}> (optional)</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add more details about this milestone..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>Date</ThemedText>
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
                {date.toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </ThemedText>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={!title.trim()}
              onPress={handleSubmit}
            >
              Add Milestone
            </Button>

            <Button
              variant="ghost"
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
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
    marginBottom: Spacing.xl,
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
  optional: {
    fontWeight: "400",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
});
