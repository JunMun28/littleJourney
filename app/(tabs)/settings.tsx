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
  Image,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/auth-context";
import { useChild, type CulturalTradition } from "@/contexts/child-context";
import { useExport } from "@/contexts/export-context";
import {
  useNotifications,
  type NotificationSettings,
} from "@/contexts/notification-context";
import { useFamily, type PermissionLevel } from "@/contexts/family-context";
import { useUserPreferences } from "@/contexts/user-preferences-context";
import { useStorage, type SubscriptionTier } from "@/contexts/storage-context";
import {
  useSubscription,
  PLAN_DETAILS,
  type BillingCycle,
} from "@/contexts/subscription-context";

const PRIMARY_COLOR = "#0a7ea4";

type ModalState =
  | "closed"
  | "inviteFamily"
  | "timePicker"
  | "deleteAccount"
  | "subscription"
  | "editChild"
  | "editChildDob";

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
  const {
    user,
    signOut,
    deletionScheduledAt,
    requestAccountDeletion,
    cancelAccountDeletion,
  } = useAuth();
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
  const { usedBytes, limitBytes, usagePercent, tier, setTier } = useStorage();
  const { exportData, isExporting, lastExportDate } = useExport();
  const { child, updateChild } = useChild();
  const {
    currentPlan,
    billingCycle,
    isSubscribed,
    cancelledAt,
    currentPeriodEnd,
    subscribe,
    cancelSubscription,
    restoreSubscription,
    isLoading: isSubscriptionLoading,
  } = useSubscription();

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [selectedTime, setSelectedTime] = useState<Date>(() =>
    timeStringToDate(dailyPromptTime),
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [invitePermission, setInvitePermission] =
    useState<PermissionLevel>("view_interact");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionTier>("standard");
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("monthly");

  // Child profile edit state
  const [editChildName, setEditChildName] = useState("");
  const [editChildNickname, setEditChildNickname] = useState("");
  const [editChildDob, setEditChildDob] = useState(new Date());
  const [editChildPhoto, setEditChildPhoto] = useState<string | undefined>(
    undefined,
  );
  const [editChildCulture, setEditChildCulture] =
    useState<CulturalTradition>("none");

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

  const handleDeleteAccount = async () => {
    await requestAccountDeletion();
    setDeleteConfirmText("");
    setModalState("closed");
  };

  const handleCancelDeletion = async () => {
    await cancelAccountDeletion();
  };

  const isDeleteConfirmValid = deleteConfirmText === "DELETE";

  const handleSubscribe = async () => {
    await subscribe(selectedPlan, selectedCycle);
    // Sync storage tier with subscription
    setTier(selectedPlan);
    setModalState("closed");
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      "Cancel Subscription",
      "Your subscription will remain active until the end of your current billing period.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            await cancelSubscription();
          },
        },
      ],
    );
  };

  const handleRestoreSubscription = async () => {
    await restoreSubscription();
  };

  const getPrice = (plan: SubscriptionTier, cycle: BillingCycle): string => {
    const details = PLAN_DETAILS[plan];
    const price =
      cycle === "monthly" ? details.monthlyPrice : details.yearlyPrice;
    const suffix = cycle === "monthly" ? "/mo" : "/yr";
    return `$${price.toFixed(2)}${suffix}`;
  };

  const handleOpenEditChild = () => {
    if (child) {
      setEditChildName(child.name);
      setEditChildNickname(child.nickname || "");
      setEditChildDob(new Date(child.dateOfBirth));
      setEditChildPhoto(child.photoUri);
      setEditChildCulture(child.culturalTradition || "none");
    }
    setModalState("editChild");
  };

  const handleSaveChild = () => {
    if (!editChildName.trim()) return;

    updateChild({
      name: editChildName.trim(),
      nickname: editChildNickname.trim() || undefined,
      dateOfBirth: editChildDob.toISOString().split("T")[0],
      photoUri: editChildPhoto,
      culturalTradition: editChildCulture,
    });
    setModalState("closed");
  };

  const handleChildDobChange = (
    _event: DateTimePickerEvent,
    date: Date | undefined,
  ) => {
    if (Platform.OS === "android") {
      setModalState("editChild");
    }
    if (date) {
      setEditChildDob(date);
    }
  };

  const handlePickChildPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditChildPhoto(result.assets[0].uri);
    }
  };

  const isChildFormValid = editChildName.trim().length > 0;

  const getCultureLabel = (culture: CulturalTradition): string => {
    switch (culture) {
      case "chinese":
        return "Chinese";
      case "malay":
        return "Malay";
      case "indian":
        return "Indian";
      default:
        return "None";
    }
  };

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

      {/* Child Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Child Profile</Text>

        {child ? (
          <View style={styles.childProfileContainer}>
            <View style={styles.childProfileInfo}>
              {child.photoUri ? (
                <Image
                  source={{ uri: child.photoUri }}
                  style={styles.childPhoto}
                />
              ) : (
                <View style={styles.childPhotoPlaceholder}>
                  <Text style={styles.childPhotoPlaceholderText}>👶</Text>
                </View>
              )}
              <View style={styles.childDetails}>
                <Text style={styles.childName}>{child.name}</Text>
                {child.nickname && (
                  <Text style={styles.childNickname}>
                    &ldquo;{child.nickname}&rdquo;
                  </Text>
                )}
                <Text style={styles.childDob}>
                  Born{" "}
                  {new Date(child.dateOfBirth).toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                {child.culturalTradition &&
                  child.culturalTradition !== "none" && (
                    <Text style={styles.childCulture}>
                      {getCultureLabel(child.culturalTradition)} tradition
                    </Text>
                  )}
              </View>
            </View>
            <Pressable
              style={styles.editChildButton}
              onPress={handleOpenEditChild}
              testID="edit-child-button"
            >
              <Text style={styles.editChildButtonText}>Edit</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.noChildText}>No child profile added</Text>
        )}
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

      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Subscription</Text>

        <View style={styles.subscriptionContainer}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionPlan}>
              {PLAN_DETAILS[currentPlan].name} Plan
            </Text>
            {isSubscribed && billingCycle && (
              <Text style={styles.subscriptionCycle}>
                {billingCycle === "monthly" ? "Monthly" : "Yearly"}
              </Text>
            )}
          </View>

          {isSubscribed && currentPeriodEnd && (
            <Text style={styles.subscriptionPeriod}>
              {cancelledAt ? "Access until" : "Renews"}{" "}
              {new Date(currentPeriodEnd).toLocaleDateString("en-SG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          )}

          {cancelledAt ? (
            <View style={styles.cancelledBanner}>
              <Text style={styles.cancelledText}>
                Your subscription has been cancelled
              </Text>
              <Pressable
                style={styles.restoreButton}
                onPress={handleRestoreSubscription}
                disabled={isSubscriptionLoading}
              >
                <Text style={styles.restoreButtonText}>Restore</Text>
              </Pressable>
            </View>
          ) : isSubscribed ? (
            <Pressable
              style={styles.managePlanButton}
              onPress={handleCancelSubscription}
              disabled={isSubscriptionLoading}
            >
              <Text style={styles.managePlanText}>Cancel Subscription</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.upgradeButton}
              onPress={() => setModalState("subscription")}
              testID="upgrade-button"
            >
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </Pressable>
          )}
        </View>
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
            <Pressable
              style={styles.upgradePrompt}
              onPress={() => setModalState("subscription")}
            >
              <Text style={styles.upgradeText}>
                Upgrade for more storage and video uploads
              </Text>
            </Pressable>
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

        {/* Account Deletion */}
        {deletionScheduledAt ? (
          <View style={styles.deletionScheduledContainer}>
            <Text style={styles.deletionScheduledTitle}>
              Account deletion scheduled
            </Text>
            <Text style={styles.deletionScheduledDate}>
              Your account and all data will be permanently deleted on{" "}
              {new Date(deletionScheduledAt).toLocaleDateString("en-SG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Pressable
              style={styles.cancelDeletionButton}
              onPress={handleCancelDeletion}
              testID="cancel-deletion-button"
            >
              <Text style={styles.cancelDeletionText}>Cancel Deletion</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.deleteAccountButton}
            onPress={() => setModalState("deleteAccount")}
            testID="delete-account-button"
          >
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </Pressable>
        )}
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

      {/* Delete Account Modal */}
      <Modal
        visible={modalState === "deleteAccount"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setDeleteConfirmText("");
          setModalState("closed");
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => {
                setDeleteConfirmText("");
                setModalState("closed");
              }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteWarningTitle}>⚠️ Warning</Text>
            <Text style={styles.deleteWarningText}>
              This will permanently delete your account and all your data,
              including:
            </Text>
            <View style={styles.deleteWarningList}>
              <Text style={styles.deleteWarningItem}>
                • All journal entries
              </Text>
              <Text style={styles.deleteWarningItem}>
                • All photos and videos
              </Text>
              <Text style={styles.deleteWarningItem}>• Child profiles</Text>
              <Text style={styles.deleteWarningItem}>• Milestones</Text>
              <Text style={styles.deleteWarningItem}>
                • Family member access
              </Text>
            </View>

            <Text style={styles.deleteGracePeriod}>
              You will have 30 days to cancel this request. After that, your
              data will be permanently deleted and cannot be recovered.
            </Text>

            <Text style={styles.inputLabel}>Type DELETE to confirm</Text>
            <TextInput
              style={styles.textInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              autoCapitalize="characters"
              testID="delete-confirm-input"
            />

            <Pressable
              style={[
                styles.deleteConfirmButton,
                !isDeleteConfirmValid && styles.deleteConfirmButtonDisabled,
              ]}
              onPress={handleDeleteAccount}
              disabled={!isDeleteConfirmValid}
              testID="confirm-delete-button"
            >
              <Text
                style={[
                  styles.deleteConfirmButtonText,
                  !isDeleteConfirmValid &&
                    styles.deleteConfirmButtonTextDisabled,
                ]}
              >
                Delete My Account
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Subscription Modal */}
      <Modal
        visible={modalState === "subscription"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalState("closed")}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Choose Plan</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.subscriptionModalContent}>
            {/* Billing Cycle Toggle */}
            <View style={styles.billingToggle}>
              <Pressable
                style={[
                  styles.billingOption,
                  selectedCycle === "monthly" && styles.billingOptionSelected,
                ]}
                onPress={() => setSelectedCycle("monthly")}
              >
                <Text
                  style={[
                    styles.billingOptionText,
                    selectedCycle === "monthly" &&
                      styles.billingOptionTextSelected,
                  ]}
                >
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.billingOption,
                  selectedCycle === "yearly" && styles.billingOptionSelected,
                ]}
                onPress={() => setSelectedCycle("yearly")}
              >
                <Text
                  style={[
                    styles.billingOptionText,
                    selectedCycle === "yearly" &&
                      styles.billingOptionTextSelected,
                  ]}
                >
                  Yearly
                </Text>
                <Text style={styles.billingSave}>Save 33%</Text>
              </Pressable>
            </View>

            {/* Plan Cards */}
            {(["standard", "premium"] as const).map((plan) => (
              <Pressable
                key={plan}
                style={[
                  styles.planCard,
                  selectedPlan === plan && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan(plan)}
                testID={`plan-${plan}`}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{PLAN_DETAILS[plan].name}</Text>
                  <Text style={styles.planPrice}>
                    {getPrice(plan, selectedCycle)}
                  </Text>
                </View>
                <View style={styles.planFeatures}>
                  {PLAN_DETAILS[plan].features.map((feature, index) => (
                    <Text key={index} style={styles.planFeature}>
                      ✓ {feature}
                    </Text>
                  ))}
                </View>
                {selectedPlan === plan && (
                  <View style={styles.planSelectedBadge}>
                    <Text style={styles.planSelectedText}>Selected</Text>
                  </View>
                )}
              </Pressable>
            ))}

            {/* Subscribe Button */}
            <Pressable
              style={[
                styles.subscribeButton,
                isSubscriptionLoading && styles.subscribeButtonDisabled,
              ]}
              onPress={handleSubscribe}
              disabled={isSubscriptionLoading}
              testID="subscribe-button"
            >
              <Text style={styles.subscribeButtonText}>
                {isSubscriptionLoading
                  ? "Processing..."
                  : `Subscribe to ${PLAN_DETAILS[selectedPlan].name}`}
              </Text>
            </Pressable>

            <Text style={styles.subscriptionDisclaimer}>
              Payment will be processed via Stripe. You can cancel anytime.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Child Profile Modal */}
      <Modal
        visible={modalState === "editChild" || modalState === "editChildDob"}
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
            <Text style={styles.modalTitle}>Edit Child Profile</Text>
            <Pressable onPress={handleSaveChild} disabled={!isChildFormValid}>
              <Text
                style={[
                  styles.modalSave,
                  !isChildFormValid && styles.modalSaveDisabled,
                ]}
              >
                Save
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.editChildContent}>
            {/* Photo Picker */}
            <View style={styles.editChildPhotoSection}>
              <Pressable
                style={styles.editChildPhotoButton}
                onPress={handlePickChildPhoto}
                testID="edit-child-photo-button"
              >
                {editChildPhoto ? (
                  <Image
                    source={{ uri: editChildPhoto }}
                    style={styles.editChildPhotoImage}
                  />
                ) : (
                  <View style={styles.editChildPhotoPlaceholder}>
                    <Text style={styles.editChildPhotoPlaceholderText}>📷</Text>
                    <Text style={styles.editChildPhotoLabel}>Add Photo</Text>
                  </View>
                )}
              </Pressable>
              {editChildPhoto && (
                <Pressable
                  onPress={() => setEditChildPhoto(undefined)}
                  style={styles.removePhotoButton}
                >
                  <Text style={styles.removePhotoText}>Remove Photo</Text>
                </Pressable>
              )}
            </View>

            {/* Name Field */}
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.textInput}
              value={editChildName}
              onChangeText={setEditChildName}
              placeholder="Child's name"
              autoCapitalize="words"
              testID="edit-child-name-input"
            />

            {/* Nickname Field */}
            <Text style={styles.inputLabel}>Nickname</Text>
            <TextInput
              style={styles.textInput}
              value={editChildNickname}
              onChangeText={setEditChildNickname}
              placeholder="Optional nickname"
              autoCapitalize="words"
              testID="edit-child-nickname-input"
            />

            {/* Date of Birth */}
            <Text style={styles.inputLabel}>Date of Birth *</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setModalState("editChildDob")}
              testID="edit-child-dob-button"
            >
              <Text style={styles.dateButtonText}>
                {editChildDob.toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </Pressable>

            {modalState === "editChildDob" && (
              <View style={styles.dobPickerContainer}>
                <DateTimePicker
                  testID="edit-child-dob-picker"
                  value={editChildDob}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleChildDobChange}
                  maximumDate={new Date()}
                />
              </View>
            )}

            {/* Cultural Tradition */}
            <Text style={styles.inputLabel}>Cultural Tradition</Text>
            <View style={styles.cultureOptions}>
              {(["chinese", "malay", "indian", "none"] as const).map(
                (culture) => (
                  <Pressable
                    key={culture}
                    style={[
                      styles.cultureOption,
                      editChildCulture === culture &&
                        styles.cultureOptionSelected,
                    ]}
                    onPress={() => setEditChildCulture(culture)}
                    testID={`culture-option-${culture}`}
                  >
                    <Text
                      style={[
                        styles.cultureOptionText,
                        editChildCulture === culture &&
                          styles.cultureOptionTextSelected,
                      ]}
                    >
                      {getCultureLabel(culture)}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </ScrollView>
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
  // Account deletion styles
  deleteAccountButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  deleteAccountText: {
    fontSize: 16,
    color: "#ff3b30",
  },
  deletionScheduledContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
  },
  deletionScheduledTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  deletionScheduledDate: {
    fontSize: 14,
    color: "#856404",
    marginBottom: 12,
  },
  cancelDeletionButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#856404",
  },
  cancelDeletionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
  },
  deleteModalContent: {
    padding: 16,
  },
  deleteWarningTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ff3b30",
    marginBottom: 12,
    textAlign: "center",
  },
  deleteWarningText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  deleteWarningList: {
    marginBottom: 16,
  },
  deleteWarningItem: {
    fontSize: 15,
    color: "#666",
    marginBottom: 4,
  },
  deleteGracePeriod: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  deleteConfirmButton: {
    backgroundColor: "#ff3b30",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  deleteConfirmButtonDisabled: {
    backgroundColor: "#ccc",
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  deleteConfirmButtonTextDisabled: {
    color: "#999",
  },
  // Subscription styles
  subscriptionContainer: {
    paddingVertical: 8,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subscriptionPlan: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  subscriptionCycle: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  subscriptionPeriod: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  managePlanButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  managePlanText: {
    fontSize: 16,
    color: "#ff3b30",
  },
  cancelledBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
  },
  cancelledText: {
    fontSize: 14,
    color: "#856404",
    flex: 1,
  },
  restoreButton: {
    backgroundColor: "#856404",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  restoreButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Subscription modal styles
  subscriptionModalContent: {
    padding: 16,
  },
  billingToggle: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  billingOptionSelected: {
    backgroundColor: "#fff",
  },
  billingOptionText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  billingOptionTextSelected: {
    color: "#000",
    fontWeight: "600",
  },
  billingSave: {
    fontSize: 11,
    color: PRIMARY_COLOR,
    marginTop: 2,
    fontWeight: "600",
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  planCardSelected: {
    borderColor: PRIMARY_COLOR,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  planFeatures: {
    gap: 8,
  },
  planFeature: {
    fontSize: 14,
    color: "#666",
  },
  planSelectedBadge: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planSelectedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  subscribeButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  subscriptionDisclaimer: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  // Child profile styles
  childProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  childProfileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  childPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  childPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  childPhotoPlaceholderText: {
    fontSize: 28,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  childNickname: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginTop: 2,
  },
  childDob: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  childCulture: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    marginTop: 2,
  },
  editChildButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editChildButtonText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  noChildText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    paddingVertical: 16,
  },
  // Edit child modal styles
  editChildContent: {
    padding: 16,
  },
  editChildPhotoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  editChildPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
  },
  editChildPhotoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editChildPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  editChildPhotoPlaceholderText: {
    fontSize: 32,
    marginBottom: 4,
  },
  editChildPhotoLabel: {
    fontSize: 12,
    color: "#666",
  },
  removePhotoButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  removePhotoText: {
    fontSize: 14,
    color: "#ff3b30",
  },
  dateButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#000",
  },
  dobPickerContainer: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  cultureOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cultureOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cultureOptionSelected: {
    backgroundColor: `${PRIMARY_COLOR}10`,
    borderColor: PRIMARY_COLOR,
  },
  cultureOptionText: {
    fontSize: 14,
    color: "#666",
  },
  cultureOptionTextSelected: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
});
