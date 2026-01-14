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
import { useAuth } from "@/contexts/auth-context";
import {
  useNotifications,
  type NotificationSettings,
} from "@/contexts/notification-context";
import { useFamily, type PermissionLevel } from "@/contexts/family-context";

const PRIMARY_COLOR = "#0a7ea4";

type ModalState = "closed" | "inviteFamily";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { settings, updateSettings, permissionStatus, requestPermissions } =
    useNotifications();
  const { familyMembers, inviteFamilyMember, removeFamilyMember } = useFamily();

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [invitePermission, setInvitePermission] =
    useState<PermissionLevel>("view_interact");

  const handleToggleNotification = (
    key: keyof NotificationSettings,
    value: boolean,
  ) => {
    updateSettings({ [key]: value });
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
});
