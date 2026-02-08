/**
 * Notification Settings Component
 *
 * Settings section for notification preferences.
 */

import { View, Text, Switch, Pressable, StyleSheet } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Spacing,
  Semantic,
} from "@/constants/design-tokens";
import { type NotificationSettings as NotificationSettingsType } from "@/contexts/notification-context";

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  permissionStatus: "granted" | "denied" | "undetermined";
  dailyPromptTime: string | null;
  onToggle: (key: keyof NotificationSettingsType, value: boolean) => void;
  onRequestPermissions: () => void;
  onTimePress: () => void;
}

function formatDisplayTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function NotificationSettings({
  settings,
  permissionStatus,
  dailyPromptTime,
  onToggle,
  onRequestPermissions,
  onTimePress,
}: NotificationSettingsProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        Notifications
      </Text>

      {permissionStatus !== "granted" && (
        <Pressable
          style={[
            styles.permissionBanner,
            { backgroundColor: Semantic.warningLight },
          ]}
          onPress={onRequestPermissions}
        >
          <Text style={[styles.permissionText, { color: "#856404" }]}>
            Enable notifications to receive reminders
          </Text>
          <Text style={styles.permissionButton}>Enable</Text>
        </Pressable>
      )}

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Daily Prompts
          </Text>
          <Text
            style={[styles.settingDescription, { color: colors.textSecondary }]}
          >
            Reminder to capture moments
          </Text>
        </View>
        <Switch
          testID="switch-dailyPrompt"
          value={settings.dailyPrompt}
          onValueChange={(value) => onToggle("dailyPrompt", value)}
          trackColor={{ false: colors.border, true: Primary[500] }}
        />
      </View>

      <Pressable
        style={[styles.settingRow, { borderBottomColor: colors.border }]}
        onPress={onTimePress}
      >
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Reminder Time
          </Text>
          <Text
            style={[styles.settingDescription, { color: colors.textSecondary }]}
          >
            When to send daily prompts
          </Text>
        </View>
        <Text style={[styles.timeValue, { color: Primary[500] }]}>
          {dailyPromptTime ? formatDisplayTime(dailyPromptTime) : "Not set"}
        </Text>
      </Pressable>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            On This Day Memories
          </Text>
          <Text
            style={[styles.settingDescription, { color: colors.textSecondary }]}
          >
            See memories from past years
          </Text>
        </View>
        <Switch
          testID="switch-memories"
          value={settings.memories}
          onValueChange={(value) => onToggle("memories", value)}
          trackColor={{ false: colors.border, true: Primary[500] }}
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Milestone Reminders
          </Text>
          <Text
            style={[styles.settingDescription, { color: colors.textSecondary }]}
          >
            Upcoming milestone alerts
          </Text>
        </View>
        <Switch
          testID="switch-milestoneReminder"
          value={settings.milestoneReminder}
          onValueChange={(value) => onToggle("milestoneReminder", value)}
          trackColor={{ false: colors.border, true: Primary[500] }}
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Family Activity
          </Text>
          <Text
            style={[styles.settingDescription, { color: colors.textSecondary }]}
          >
            Comments and reactions
          </Text>
        </View>
        <Switch
          testID="switch-familyActivity"
          value={settings.familyActivity}
          onValueChange={(value) => onToggle("familyActivity", value)}
          trackColor={{ false: colors.border, true: Primary[500] }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionText: {
    flex: 1,
    fontSize: 14,
  },
  permissionButton: {
    fontSize: 14,
    fontWeight: "600",
    color: Primary[500],
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  timeValue: {
    fontSize: 16,
  },
});
