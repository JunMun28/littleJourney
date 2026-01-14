import { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Switch,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useAuth } from "@/contexts/auth-context";
import { useExport } from "@/contexts/export-context";
import {
  useNotifications,
  type NotificationSettings,
} from "@/contexts/notification-context";
import { useFamily, type PermissionLevel } from "@/contexts/family-context";
import { useUserPreferences } from "@/contexts/user-preferences-context";
import { useStorage } from "@/contexts/storage-context";

const PRIMARY_COLOR = "#0a7ea4";

type ModalState = "closed" | "inviteFamily" | "timePicker";

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

function timeStringToDate(time: string | null): Date {
  const date = new Date();
  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  } else {
    date.setHours(20, 0, 0, 0); // Default 8 PM
  }
  return date;
}

function dateToTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  // Show decimal only for GB or non-round numbers
  const decimals = i >= 3 || value % 1 !== 0 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[i]}`;
}

function getTierDisplayName(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const {
    settings,
    updateSettings,
    permissionStatus,
    requestPermissions,
    scheduleDailyPrompt,
    cancelDailyPrompt,
  } = useNotifications();
  const { familyMembers, inviteFamilyMember, removeFamilyMember } = useFamily();
  const { dailyPromptTime, setDailyPromptTime } = useUserPreferences();
  const { usedBytes, limitBytes, usagePercent, tier } = useStorage();
  const { exportData, isExporting, lastExportDate } = useExport();

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [selectedTime, setSelectedTime] = useState<Date>(() =>
    timeStringToDate(dailyPromptTime),
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [invitePermission, setInvitePermission] =
    useState<PermissionLevel>("view_interact");

  const handleToggleNotification = async (
    key: keyof NotificationSettings,
    value: boolean,
  ) => {
    updateSettings({ [key]: value });

    // When daily prompt toggle changes, schedule or cancel notification
    if (key === "dailyPrompt") {
      if (value && dailyPromptTime) {
        await scheduleDailyPrompt(dailyPromptTime);
      } else if (!value) {
        await cancelDailyPrompt();
      }
    }
  };

  const handleTimeChange = (
    _event: DateTimePickerEvent,
    date: Date | undefined,
  ) => {
    if (Platform.OS === "android") {
      setModalState("closed");
    }
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleSaveTime = async () => {
    const timeString = dateToTimeString(selectedTime);
    setDailyPromptTime(timeString);
    setModalState("closed");

    // Schedule notification if dailyPrompt is enabled
    if (settings.dailyPrompt && permissionStatus === "granted") {
      await scheduleDailyPrompt(timeString);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleInviteFamily = () => {
    if (!inviteEmail.trim() || !inviteRelationship.trim()) {
      return;
    }

    inviteFamilyMember({
      email: inviteEmail.trim(),
      relationship: inviteRelationship.trim(),
      permissionLevel: invitePermission,
    });

    setInviteEmail("");
    setInviteRelationship("");
    setInvitePermission("view_interact");
    setModalState("closed");
  };

  const handleRequestPermissions = async () => {
    await requestPermissions();
  };

  const isInviteValid =
    inviteEmail.trim().includes("@") && inviteRelationship.trim().length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Notifications</Text>

        {permissionStatus !== "granted" && (
          <Pressable
            style={styles.permissionBanner}
            onPress={handleRequestPermissions}
          >
            <Text style={styles.permissionText}>
              Enable notifications to receive reminders
            </Text>
            <Text style={styles.permissionButton}>Enable</Text>
          </Pressable>
        )}

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Prompts</Text>
            <Text style={styles.settingDescription}>
              Reminder to capture moments
            </Text>
          </View>
          <Switch
            testID="switch-dailyPrompt"
            value={settings.dailyPrompt}
            onValueChange={(value) =>
              handleToggleNotification("dailyPrompt", value)
            }
            trackColor={{ false: "#767577", true: PRIMARY_COLOR }}
          />
        </View>

        <Pressable
          style={styles.settingRow}
          onPress={() => setModalState("timePicker")}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Reminder Time</Text>
            <Text style={styles.settingDescription}>
              When to send daily prompts
            </Text>
          </View>
          <Text style={styles.timeValue}>
            {dailyPromptTime ? formatDisplayTime(dailyPromptTime) : "Not set"}
          </Text>
        </Pressable>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>On This Day Memories</Text>
            <Text style={styles.settingDescription}>
              See memories from past years
            </Text>
          </View>
          <Switch
            testID="switch-memories"
            value={settings.memories}
            onValueChange={(value) =>
              handleToggleNotification("memories", value)
            }
            trackColor={{ false: "#767577", true: PRIMARY_COLOR }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Milestone Reminders</Text>
            <Text style={styles.settingDescription}>
              Upcoming milestone alerts
            </Text>
          </View>
          <Switch
            testID="switch-milestoneReminder"
            value={settings.milestoneReminder}
            onValueChange={(value) =>
              handleToggleNotification("milestoneReminder", value)
            }
            trackColor={{ false: "#767577", true: PRIMARY_COLOR }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Family Activity</Text>
            <Text style={styles.settingDescription}>
              Comments and reactions
            </Text>
          </View>
          <Switch
            testID="switch-familyActivity"
            value={settings.familyActivity}
            onValueChange={(value) =>
              handleToggleNotification("familyActivity", value)
            }
            trackColor={{ false: "#767577", true: PRIMARY_COLOR }}
          />
        </View>
      </View>

      {/* Family Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Family</Text>

        <Pressable
          style={styles.actionButton}
          onPress={() => setModalState("inviteFamily")}
        >
          <Text style={styles.actionButtonText}>Invite Family Member</Text>
        </Pressable>

        {familyMembers.length > 0 && (
          <View style={styles.familyList}>
            {familyMembers.map((member) => (
              <View key={member.id} style={styles.familyMemberRow}>
                <View style={styles.familyMemberInfo}>
                  <Text style={styles.familyMemberEmail}>{member.email}</Text>
                  <Text style={styles.familyMemberRelationship}>
                    {member.relationship} •{" "}
                    {member.status === "pending" ? "Pending" : "Active"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeFamilyMember(member.id)}
                  hitSlop={8}
                >
                  <Text style={styles.removeButton}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Storage</Text>

        <View style={styles.storageContainer}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageTier}>
              {getTierDisplayName(tier)} Plan
            </Text>
            <Text style={styles.storageUsage}>
              {formatBytes(usedBytes)} of {formatBytes(limitBytes)}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor:
                    usagePercent >= 90
                      ? "#ff3b30"
                      : usagePercent >= 80
                        ? "#ff9500"
                        : PRIMARY_COLOR,
                },
              ]}
            />
          </View>

          <Text style={styles.storagePercent}>{usagePercent}% used</Text>

          {tier === "free" && (
            <View style={styles.upgradePrompt}>
              <Text style={styles.upgradeText}>
                Upgrade for more storage and video uploads
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Data & Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Data & Privacy</Text>

        <Pressable
          style={[
            styles.actionButton,
            isExporting && styles.actionButtonDisabled,
          ]}
          onPress={exportData}
          disabled={isExporting}
          testID="export-data-button"
        >
          <Text style={styles.actionButtonText}>
            {isExporting ? "Exporting..." : "Download All Memories"}
          </Text>
        </Pressable>

        {lastExportDate && (
          <Text style={styles.exportInfo}>
            Last exported:{" "}
            {new Date(lastExportDate).toLocaleDateString("en-SG")}
          </Text>
        )}

        <Text style={styles.exportDescription}>
          Export all your entries, milestones, and child data as a JSON file.
        </Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Account</Text>

        {user && (
          <View style={styles.accountInfo}>
            <Text style={styles.accountEmail}>{user.email}</Text>
          </View>
        )}

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      {/* Invite Family Modal */}
      <Modal
        visible={modalState === "inviteFamily"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalState("closed")}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Invite Family</Text>
            <Pressable onPress={handleInviteFamily} disabled={!isInviteValid}>
              <Text
                style={[
                  styles.modalSave,
                  !isInviteValid && styles.modalSaveDisabled,
                ]}
              >
                Send
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="grandma@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <TextInput
              style={styles.textInput}
              value={inviteRelationship}
              onChangeText={setInviteRelationship}
              placeholder="Grandmother, Uncle, etc."
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Permission</Text>
            <View style={styles.permissionOptions}>
              <Pressable
                style={[
                  styles.permissionOption,
                  invitePermission === "view_interact" &&
                    styles.permissionOptionSelected,
                ]}
                onPress={() => setInvitePermission("view_interact")}
              >
                <Text
                  style={[
                    styles.permissionOptionText,
                    invitePermission === "view_interact" &&
                      styles.permissionOptionTextSelected,
                  ]}
                >
                  View & Comment
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.permissionOption,
                  invitePermission === "view_only" &&
                    styles.permissionOptionSelected,
                ]}
                onPress={() => setInvitePermission("view_only")}
              >
                <Text
                  style={[
                    styles.permissionOptionText,
                    invitePermission === "view_only" &&
                      styles.permissionOptionTextSelected,
                  ]}
                >
                  View Only
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={modalState === "timePicker"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalState("closed")}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Reminder Time</Text>
            <Pressable onPress={handleSaveTime}>
              <Text style={styles.modalSave}>Save</Text>
            </Pressable>
          </View>

          <View style={styles.timePickerContainer}>
            <DateTimePicker
              testID="time-picker"
              value={selectedTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
              minuteInterval={5}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: "#000",
  },
  settingDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionText: {
    flex: 1,
    fontSize: 14,
    color: "#856404",
  },
  permissionButton: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  actionButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  familyList: {
    marginTop: 16,
  },
  familyMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  familyMemberInfo: {
    flex: 1,
  },
  familyMemberEmail: {
    fontSize: 16,
    color: "#000",
  },
  familyMemberRelationship: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  removeButton: {
    fontSize: 14,
    color: "#ff3b30",
  },
  accountInfo: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  accountEmail: {
    fontSize: 16,
    color: "#000",
  },
  signOutButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight: "500",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  modalCancel: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  modalSaveDisabled: {
    color: "#999",
  },
  modalContent: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  permissionOptions: {
    flexDirection: "row",
    gap: 12,
  },
  permissionOption: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  permissionOptionSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: `${PRIMARY_COLOR}10`,
  },
  permissionOptionText: {
    fontSize: 14,
    color: "#666",
  },
  permissionOptionTextSelected: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  timeValue: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  timePickerContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  // Storage styles
  storageContainer: {
    paddingVertical: 8,
  },
  storageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  storageTier: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  storageUsage: {
    fontSize: 14,
    color: "#666",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  storagePercent: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
  },
  upgradePrompt: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${PRIMARY_COLOR}10`,
    borderRadius: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    textAlign: "center",
  },
  // Export styles
  actionButtonDisabled: {
    opacity: 0.6,
  },
  exportInfo: {
    fontSize: 13,
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },
  exportDescription: {
    fontSize: 13,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});
