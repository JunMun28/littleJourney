import { useState } from "react";
import { StyleSheet, Pressable, Text, View, Platform } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useUserPreferences } from "@/contexts/user-preferences-context";

const PRIMARY_COLOR = "#0a7ea4";
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

  const handleContinue = () => {
    setDailyPromptTime(formatTime(selectedTime));
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

      <View style={styles.infoBox}>
        <ThemedText style={styles.infoText}>
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
    padding: 24,
    paddingTop: 48,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
    lineHeight: 22,
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  timeButton: {
    backgroundColor: `${PRIMARY_COLOR}15`,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  timeButtonText: {
    fontSize: 24,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  infoBox: {
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    marginTop: "auto",
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
