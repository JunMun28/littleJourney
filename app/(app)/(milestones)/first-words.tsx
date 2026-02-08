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
import { Primary } from "@/constants/design-tokens";

type FirstWordLanguage = "english" | "chinese" | "malay" | "tamil" | "other";

const LANGUAGES: { value: FirstWordLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "chinese", label: "Chinese" },
  { value: "malay", label: "Malay" },
  { value: "tamil", label: "Tamil" },
  { value: "other", label: "Other" },
];

export default function FirstWordsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  
  const { child } = useChildFlat();
  const createMilestone = useCreateMilestone();
  const { scheduleMilestoneReminder } = useNotifications();

  const [word, setWord] = useState("");
  const [romanization, setRomanization] = useState("");
  const [language, setLanguage] = useState<FirstWordLanguage>("english");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!word.trim() || !child?.id) return;

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const milestoneDate = date.toISOString().split("T")[0];
      
      await createMilestone.mutateAsync({
        templateId: "first_words",
        childId: child.id,
        milestoneDate,
        firstWordData: {
          word: word.trim(),
          romanization: romanization.trim() || undefined,
          language,
        },
      });

      await scheduleMilestoneReminder(
        "first_words",
        "First Words",
        milestoneDate,
        7
      );

      router.back();
    } catch {
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
              First Words
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Capture this magical moment
            </ThemedText>
          </View>

          {/* Word */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>
              Word <ThemedText style={{ color: Colors.light.tint }}>*</ThemedText>
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
              value={word}
              onChangeText={setWord}
              placeholder="e.g., Mama, Papa, Bottle"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          {/* Romanization (for non-English) */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>
              Romanization / Pronunciation
              <ThemedText style={[styles.optional, { color: colors.textMuted }]}> (optional)</ThemedText>
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
              value={romanization}
              onChangeText={setRomanization}
              placeholder="e.g., ma-ma"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Language */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>Language</ThemedText>
            <View style={styles.languageGrid}>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.value}
                  style={[
                    styles.languageButton,
                    {
                      backgroundColor:
                        language === lang.value
                          ? Primary[500]
                          : colors.backgroundSecondary,
                      borderColor:
                        language === lang.value
                          ? Primary[500]
                          : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setLanguage(lang.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <ThemedText
                    style={{
                      color:
                        language === lang.value ? "#fff" : colors.text,
                      fontWeight: language === lang.value ? "600" : "400",
                    }}
                  >
                    {lang.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={styles.field}>
            <ThemedText style={styles.label}>Date Said</ThemedText>
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
                maximumDate={new Date()}
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
              disabled={!word.trim()}
              onPress={handleSubmit}
            >
              Save First Word
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
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  languageButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
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
