import { useState } from "react";
import {
  StyleSheet,
  Pressable,
  Text,
  View,
  Platform,
  useColorScheme,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useUserPreferences } from "@/contexts/user-preferences-context";
import { useNotifications } from "@/contexts/notification-context";
import { PRIMARY_COLOR, Colors, Spacing } from "@/constants/theme";

const DEFAULT_HOUR = 20; // 8:00 PM
const DEFAULT_MINUTE = 0;

function getDefaultTime(): Date {
  const date = new Date();
  date.setHours(DEFAULT_HOUR, DEFAULT_MINUTE, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDisplayTime(date: Date): string {
  return date.toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function SetPromptTimeScreen() {
  const { setDailyPromptTime } = useUserPreferences();
  const { requestPermissions, scheduleDailyPrompt, permissionStatus } =
    useNotifications();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [selectedTime, setSelectedTime] = useState<Date>(getDefaultTime());
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");

  const handleTimeChange = (
    _event: DateTimePickerEvent,
    date: Date | undefined,
  ) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleContinue = async () => {
    const timeString = formatTime(selectedTime);
    setDailyPromptTime(timeString);

    // Request notification permissions and schedule daily prompt
    const status =
      permissionStatus === "granted"
        ? permissionStatus
        : await requestPermissions();
    if (status === "granted") {
      await scheduleDailyPrompt(timeString);
    }

    router.push("/(onboarding)/invite-family");
  };

  const handleSkip = () => {
    // Skip without setting a prompt time
    router.push("/(onboarding)/invite-family");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Daily Reminder
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        We&apos;ll send you a gentle reminder to capture a moment each day.
        Choose a time that works best for you.
      </ThemedText>

      <View style={styles.timeContainer}>
        <ThemedText style={styles.timeLabel}>Reminder Time</ThemedText>

        {Platform.OS === "android" && !showPicker && (
          <Pressable
            style={styles.timeButton}
            onPress={() => setShowPicker(true)}
            testID="time-button"
          >
            <Text style={styles.timeButtonText}>
              {formatDisplayTime(selectedTime)}
            </Text>
          </Pressable>
        )}

        {showPicker && (
          <DateTimePicker
            testID="time-picker"
            value={selectedTime}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimeChange}
            minuteInterval={5}
          />
        )}
      </View>

      <View
        style={[
          styles.infoBox,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
          You can change this anytime in Settings. Notifications will be sent in
          your local timezone.
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.button}
          onPress={handleContinue}
          testID="continue-button"
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>

        <Pressable
          style={styles.skipButton}
          onPress={handleSkip}
          testID="skip-button"
        >
          <ThemedText style={styles.skipButtonText}>Skip for now</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 48,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xxl,
    opacity: 0.7,
    lineHeight: 22,
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  timeButton: {
    backgroundColor: `${PRIMARY_COLOR}15`,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.md,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  timeButtonText: {
    fontSize: 24,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  infoBox: {
    padding: Spacing.lg,
    borderRadius: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    marginTop: "auto",
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
