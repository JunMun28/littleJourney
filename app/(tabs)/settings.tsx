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
  useColorScheme,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { type CulturalTradition } from "@/contexts/child-context";
import { useExport } from "@/contexts/export-context";
import {
  useNotifications,
  type NotificationSettings,
} from "@/contexts/notification-context";
import { type PermissionLevel } from "@/contexts/family-context";
import { useUserPreferences } from "@/contexts/user-preferences-context";
import { useStorage, type SubscriptionTier } from "@/contexts/storage-context";
import {
  useSubscription,
  PLAN_DETAILS,
  type BillingCycle,
} from "@/contexts/subscription-context";
import { useChildFlat } from "@/hooks/use-children";
import { useFamilyMembersFlat } from "@/hooks/use-family";
import { useStripePayment } from "@/hooks/use-stripe-payment";
import { PRIMARY_COLOR, Colors, SemanticColors } from "@/constants/theme";

type ModalState =
  | "closed"
  | "inviteFamily"
  | "timePicker"
  | "deleteAccount"
  | "subscription"
  | "editChild"
  | "editChildDob"
  | "feedback";

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
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

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
  const {
    familyMembers,
    inviteFamilyMember,
    removeFamilyMember,
    resendInvite,
  } = useFamilyMembersFlat();
  const { dailyPromptTime, setDailyPromptTime } = useUserPreferences();
  const { usedBytes, limitBytes, usagePercent, tier, setTier } = useStorage();
  const { exportData, isExporting, lastExportDate } = useExport();
  const { child, updateChild } = useChildFlat();
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
  const {
    processPayment,
    isLoading: isPaymentLoading,
    error: paymentError,
    clearError: clearPaymentError,
  } = useStripePayment();

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

  // Feedback state
  const [feedbackText, setFeedbackText] = useState("");

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
    // Clear any previous payment errors
    clearPaymentError();

    // Process payment via Stripe (PRD PAY-002)
    const success = await processPayment(selectedPlan, selectedCycle);

    if (!success) {
      // If there's a payment error, show alert
      if (paymentError) {
        Alert.alert("Payment Error", paymentError);
      }
      // User cancelled or error - don't proceed
      return;
    }

    // Payment successful - update subscription state
    await subscribe(selectedPlan, selectedCycle);
    // Sync storage tier with subscription
    setTier(selectedPlan);
    setModalState("closed");

    Alert.alert(
      "Success!",
      `You are now subscribed to ${PLAN_DETAILS[selectedPlan].name}. Thank you for your support!`,
    );
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

  const isFeedbackValid = feedbackText.trim().length > 0;

  const handleSubmitFeedback = async () => {
    if (!isFeedbackValid) return;

    // TODO: Send feedback to backend API or email service
    // For now, just log and show confirmation
    console.log("Feedback submitted:", feedbackText);

    // Show confirmation via Alert
    Alert.alert(
      "Thank You!",
      "Your feedback has been received. We appreciate you helping us improve Little Journey.",
      [{ text: "OK" }],
    );

    // Reset and close modal
    setFeedbackText("");
    setModalState("closed");
  };

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
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary },
      ]}
      contentContainerStyle={styles.content}
    >
      {/* Notifications Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Notifications
        </Text>

        {permissionStatus !== "granted" && (
          <Pressable
            style={[
              styles.permissionBanner,
              { backgroundColor: SemanticColors.warningLight },
            ]}
            onPress={handleRequestPermissions}
          >
            <Text
              style={[
                styles.permissionText,
                { color: SemanticColors.warningText },
              ]}
            >
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
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              Reminder to capture moments
            </Text>
          </View>
          <Switch
            testID="switch-dailyPrompt"
            value={settings.dailyPrompt}
            onValueChange={(value) =>
              handleToggleNotification("dailyPrompt", value)
            }
            trackColor={{ false: colors.border, true: PRIMARY_COLOR }}
          />
        </View>

        <Pressable
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={() => setModalState("timePicker")}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Reminder Time
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              When to send daily prompts
            </Text>
          </View>
          <Text style={styles.timeValue}>
            {dailyPromptTime ? formatDisplayTime(dailyPromptTime) : "Not set"}
          </Text>
        </Pressable>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              On This Day Memories
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              See memories from past years
            </Text>
          </View>
          <Switch
            testID="switch-memories"
            value={settings.memories}
            onValueChange={(value) =>
              handleToggleNotification("memories", value)
            }
            trackColor={{ false: colors.border, true: PRIMARY_COLOR }}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Milestone Reminders
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              Upcoming milestone alerts
            </Text>
          </View>
          <Switch
            testID="switch-milestoneReminder"
            value={settings.milestoneReminder}
            onValueChange={(value) =>
              handleToggleNotification("milestoneReminder", value)
            }
            trackColor={{ false: colors.border, true: PRIMARY_COLOR }}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Family Activity
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              Comments and reactions
            </Text>
          </View>
          <Switch
            testID="switch-familyActivity"
            value={settings.familyActivity}
            onValueChange={(value) =>
              handleToggleNotification("familyActivity", value)
            }
            trackColor={{ false: colors.border, true: PRIMARY_COLOR }}
          />
        </View>
      </View>

      {/* Child Profile Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Child Profile
        </Text>

        {child ? (
          <View style={styles.childProfileContainer}>
            <View style={styles.childProfileInfo}>
              {child.photoUri ? (
                <Image
                  source={{ uri: child.photoUri }}
                  style={styles.childPhoto}
                />
              ) : (
                <View
                  style={[
                    styles.childPhotoPlaceholder,
                    { backgroundColor: colors.backgroundTertiary },
                  ]}
                >
                  <Text style={styles.childPhotoPlaceholderText}>👶</Text>
                </View>
              )}
              <View style={styles.childDetails}>
                <Text style={[styles.childName, { color: colors.text }]}>
                  {child.name}
                </Text>
                {child.nickname && (
                  <Text
                    style={[
                      styles.childNickname,
                      { color: colors.textSecondary },
                    ]}
                  >
                    &ldquo;{child.nickname}&rdquo;
                  </Text>
                )}
                <Text
                  style={[styles.childDob, { color: colors.textSecondary }]}
                >
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
          <Text style={[styles.noChildText, { color: colors.textMuted }]}>
            No child profile added
          </Text>
        )}

        {/* Add Child Button - MVP Limited */}
        <Pressable
          style={[
            styles.addChildButton,
            child && styles.addChildButtonDisabled,
            { borderColor: child ? colors.border : PRIMARY_COLOR },
          ]}
          onPress={() => {
            if (child) {
              Alert.alert(
                "MVP Limit",
                "Multiple children support is coming soon! The current version supports one child per account.",
                [{ text: "OK" }],
              );
            } else {
              // Navigate to onboarding add-child flow
              // For MVP, onboarding handles child creation
              Alert.alert(
                "Add Child",
                "To add a child, please complete the onboarding process.",
                [{ text: "OK" }],
              );
            }
          }}
          testID="add-child-button"
          disabled={!!child}
          accessibilityState={{ disabled: !!child }}
        >
          <Text
            style={[
              styles.addChildButtonText,
              child && { color: colors.textMuted },
            ]}
          >
            {child ? "Add Another Child (Coming Soon)" : "Add Child"}
          </Text>
        </Pressable>
      </View>

      {/* Family Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Family
        </Text>

        <Pressable
          style={styles.actionButton}
          onPress={() => setModalState("inviteFamily")}
        >
          <Text style={styles.actionButtonText}>Invite Family Member</Text>
        </Pressable>

        {familyMembers.length > 0 && (
          <View style={styles.familyList}>
            {familyMembers.map((member) => (
              <View
                key={member.id}
                style={[
                  styles.familyMemberRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.familyMemberInfo}>
                  <Text
                    style={[styles.familyMemberEmail, { color: colors.text }]}
                  >
                    {member.email}
                  </Text>
                  <Text
                    style={[
                      styles.familyMemberRelationship,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {member.relationship} •{" "}
                    {member.status === "pending" ? "Pending" : "Active"}
                  </Text>
                  {/* PRD SHARE-007: Last viewed timestamp */}
                  {member.lastViewedAt && (
                    <Text
                      style={[
                        styles.familyMemberLastViewed,
                        { color: colors.textMuted },
                      ]}
                    >
                      Last viewed:{" "}
                      {new Date(member.lastViewedAt).toLocaleDateString(
                        "en-SG",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </Text>
                  )}
                </View>
                <View style={styles.familyMemberActions}>
                  {member.status === "pending" && (
                    <Pressable
                      onPress={() => resendInvite(member.id)}
                      hitSlop={8}
                      style={styles.resendButton}
                    >
                      <Text style={{ color: PRIMARY_COLOR }}>Resend</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => removeFamilyMember(member.id)}
                    hitSlop={8}
                  >
                    <Text
                      style={[
                        styles.removeButton,
                        { color: SemanticColors.error },
                      ]}
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Subscription Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Subscription
        </Text>

        <View style={styles.subscriptionContainer}>
          <View style={styles.subscriptionHeader}>
            <Text style={[styles.subscriptionPlan, { color: colors.text }]}>
              {PLAN_DETAILS[currentPlan].name} Plan
            </Text>
            {isSubscribed && billingCycle && (
              <Text
                style={[
                  styles.subscriptionCycle,
                  {
                    backgroundColor: colors.backgroundTertiary,
                    color: colors.textSecondary,
                  },
                ]}
              >
                {billingCycle === "monthly" ? "Monthly" : "Yearly"}
              </Text>
            )}
          </View>

          {isSubscribed && currentPeriodEnd && (
            <Text
              style={[
                styles.subscriptionPeriod,
                { color: colors.textSecondary },
              ]}
            >
              {cancelledAt ? "Access until" : "Renews"}{" "}
              {new Date(currentPeriodEnd).toLocaleDateString("en-SG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          )}

          {cancelledAt ? (
            <View
              style={[
                styles.cancelledBanner,
                { backgroundColor: SemanticColors.warningLight },
              ]}
            >
              <Text
                style={[
                  styles.cancelledText,
                  { color: SemanticColors.warningText },
                ]}
              >
                Your subscription has been cancelled
              </Text>
              <Pressable
                style={[
                  styles.restoreButton,
                  { backgroundColor: SemanticColors.warningText },
                ]}
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
              <Text
                style={[styles.managePlanText, { color: SemanticColors.error }]}
              >
                Cancel Subscription
              </Text>
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
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Storage
        </Text>

        <View style={styles.storageContainer}>
          <View style={styles.storageHeader}>
            <Text style={[styles.storageTier, { color: colors.text }]}>
              {getTierDisplayName(tier)} Plan
            </Text>
            <Text
              style={[styles.storageUsage, { color: colors.textSecondary }]}
            >
              {formatBytes(usedBytes)} of {formatBytes(limitBytes)}
            </Text>
          </View>

          <View
            style={[
              styles.progressBarContainer,
              { backgroundColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor:
                    usagePercent >= 90
                      ? SemanticColors.error
                      : usagePercent >= 80
                        ? SemanticColors.warning
                        : PRIMARY_COLOR,
                },
              ]}
            />
          </View>

          <Text
            style={[styles.storagePercent, { color: colors.textSecondary }]}
          >
            {usagePercent}% used
          </Text>

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

      {/* Photo Book Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Photo Book
        </Text>

        <View style={styles.photoBookContainer}>
          <Text
            style={[
              styles.photoBookDescription,
              { color: colors.textSecondary },
            ]}
          >
            Create a beautiful photo book from your milestone moments
          </Text>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push("/photo-book")}
            testID="create-photo-book-button"
          >
            <Text style={styles.actionButtonText}>Create Photo Book</Text>
          </Pressable>
        </View>
      </View>

      {/* Data & Privacy Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Data & Privacy
        </Text>

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
          <Text style={[styles.exportInfo, { color: colors.textSecondary }]}>
            Last exported:{" "}
            {new Date(lastExportDate).toLocaleDateString("en-SG")}
          </Text>
        )}

        <Text style={[styles.exportDescription, { color: colors.textMuted }]}>
          Export all your entries, milestones, and child data as a JSON file.
        </Text>
      </View>

      {/* Legal Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Legal
        </Text>

        <Pressable
          style={[styles.legalLink, { borderBottomColor: colors.border }]}
          onPress={() =>
            Linking.openURL("https://littlejourney.sg/privacy-policy")
          }
        >
          <Text style={[styles.legalLinkText, { color: colors.text }]}>
            Privacy Policy
          </Text>
          <Text style={[styles.legalLinkArrow, { color: colors.textMuted }]}>
            →
          </Text>
        </Pressable>

        <Pressable
          style={styles.legalLink}
          onPress={() =>
            Linking.openURL("https://littlejourney.sg/terms-of-service")
          }
        >
          <Text style={[styles.legalLinkText, { color: colors.text }]}>
            Terms of Service
          </Text>
          <Text style={[styles.legalLinkArrow, { color: colors.textMuted }]}>
            →
          </Text>
        </Pressable>
      </View>

      {/* Feedback Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Feedback
        </Text>

        <Text style={[styles.feedbackDescription, { color: colors.textMuted }]}>
          Help us improve Little Journey by sharing your thoughts and
          suggestions.
        </Text>

        <Pressable
          style={styles.actionButton}
          onPress={() => setModalState("feedback")}
          testID="send-feedback-button"
        >
          <Text style={styles.actionButtonText}>Send Feedback</Text>
        </Pressable>
      </View>

      {/* Account Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Account
        </Text>

        {user && (
          <View
            style={[styles.accountInfo, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.accountEmail, { color: colors.text }]}>
              {user.email}
            </Text>
          </View>
        )}

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={[styles.signOutText, { color: SemanticColors.error }]}>
            Sign Out
          </Text>
        </Pressable>

        {/* Account Deletion */}
        {deletionScheduledAt ? (
          <View
            style={[
              styles.deletionScheduledContainer,
              { backgroundColor: SemanticColors.warningLight },
            ]}
          >
            <Text
              style={[
                styles.deletionScheduledTitle,
                { color: SemanticColors.warningText },
              ]}
            >
              Account deletion scheduled
            </Text>
            <Text
              style={[
                styles.deletionScheduledDate,
                { color: SemanticColors.warningText },
              ]}
            >
              Your account and all data will be permanently deleted on{" "}
              {new Date(deletionScheduledAt).toLocaleDateString("en-SG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Pressable
              style={[
                styles.cancelDeletionButton,
                { borderColor: SemanticColors.warningText },
              ]}
              onPress={handleCancelDeletion}
              testID="cancel-deletion-button"
            >
              <Text
                style={[
                  styles.cancelDeletionText,
                  { color: SemanticColors.warningText },
                ]}
              >
                Cancel Deletion
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.deleteAccountButton}
            onPress={() => setModalState("deleteAccount")}
            testID="delete-account-button"
          >
            <Text
              style={[
                styles.deleteAccountText,
                { color: SemanticColors.error },
              ]}
            >
              Delete Account
            </Text>
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
          style={[
            styles.modalContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Invite Family
            </Text>
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
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Email
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                },
              ]}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="grandma@example.com"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Relationship
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                },
              ]}
              value={inviteRelationship}
              onChangeText={setInviteRelationship}
              placeholder="Grandmother, Uncle, etc."
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Permission
            </Text>
            <View style={styles.permissionOptions}>
              <Pressable
                style={[
                  styles.permissionOption,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  invitePermission === "view_interact" &&
                    styles.permissionOptionSelected,
                ]}
                onPress={() => setInvitePermission("view_interact")}
              >
                <Text
                  style={[
                    styles.permissionOptionText,
                    { color: colors.textSecondary },
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
                  { backgroundColor: colors.card, borderColor: colors.border },
                  invitePermission === "view_only" &&
                    styles.permissionOptionSelected,
                ]}
                onPress={() => setInvitePermission("view_only")}
              >
                <Text
                  style={[
                    styles.permissionOptionText,
                    { color: colors.textSecondary },
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
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Reminder Time
            </Text>
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
          style={[
            styles.modalContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setDeleteConfirmText("");
                setModalState("closed");
              }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Delete Account
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.deleteModalContent}>
            <Text
              style={[
                styles.deleteWarningTitle,
                { color: SemanticColors.error },
              ]}
            >
              ⚠️ Warning
            </Text>
            <Text style={[styles.deleteWarningText, { color: colors.text }]}>
              This will permanently delete your account and all your data,
              including:
            </Text>
            <View style={styles.deleteWarningList}>
              <Text
                style={[
                  styles.deleteWarningItem,
                  { color: colors.textSecondary },
                ]}
              >
                • All journal entries
              </Text>
              <Text
                style={[
                  styles.deleteWarningItem,
                  { color: colors.textSecondary },
                ]}
              >
                • All photos and videos
              </Text>
              <Text
                style={[
                  styles.deleteWarningItem,
                  { color: colors.textSecondary },
                ]}
              >
                • Child profiles
              </Text>
              <Text
                style={[
                  styles.deleteWarningItem,
                  { color: colors.textSecondary },
                ]}
              >
                • Milestones
              </Text>
              <Text
                style={[
                  styles.deleteWarningItem,
                  { color: colors.textSecondary },
                ]}
              >
                • Family member access
              </Text>
            </View>

            <Text
              style={[
                styles.deleteGracePeriod,
                {
                  backgroundColor: colors.backgroundTertiary,
                  color: colors.textSecondary,
                },
              ]}
            >
              You will have 30 days to cancel this request. After that, your
              data will be permanently deleted and cannot be recovered.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Type DELETE to confirm
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                },
              ]}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={colors.placeholder}
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
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Choose Plan
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.subscriptionModalContent}>
            {/* Billing Cycle Toggle */}
            <View
              style={[
                styles.billingToggle,
                { backgroundColor: colors.backgroundTertiary },
              ]}
            >
              <Pressable
                style={[
                  styles.billingOption,
                  selectedCycle === "monthly" && [
                    styles.billingOptionSelected,
                    { backgroundColor: colors.card },
                  ],
                ]}
                onPress={() => setSelectedCycle("monthly")}
              >
                <Text
                  style={[
                    styles.billingOptionText,
                    { color: colors.textSecondary },
                    selectedCycle === "monthly" && [
                      styles.billingOptionTextSelected,
                      { color: colors.text },
                    ],
                  ]}
                >
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.billingOption,
                  selectedCycle === "yearly" && [
                    styles.billingOptionSelected,
                    { backgroundColor: colors.card },
                  ],
                ]}
                onPress={() => setSelectedCycle("yearly")}
              >
                <Text
                  style={[
                    styles.billingOptionText,
                    { color: colors.textSecondary },
                    selectedCycle === "yearly" && [
                      styles.billingOptionTextSelected,
                      { color: colors.text },
                    ],
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
                  { backgroundColor: colors.card, borderColor: colors.border },
                  selectedPlan === plan && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan(plan)}
                testID={`plan-${plan}`}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>
                    {PLAN_DETAILS[plan].name}
                  </Text>
                  <Text style={styles.planPrice}>
                    {getPrice(plan, selectedCycle)}
                  </Text>
                </View>
                <View style={styles.planFeatures}>
                  {PLAN_DETAILS[plan].features.map((feature, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.planFeature,
                        { color: colors.textSecondary },
                      ]}
                    >
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
                (isSubscriptionLoading || isPaymentLoading) &&
                  styles.subscribeButtonDisabled,
              ]}
              onPress={handleSubscribe}
              disabled={isSubscriptionLoading || isPaymentLoading}
              testID="subscribe-button"
            >
              <Text style={styles.subscribeButtonText}>
                {isSubscriptionLoading || isPaymentLoading
                  ? "Processing payment..."
                  : `Subscribe to ${PLAN_DETAILS[selectedPlan].name}`}
              </Text>
            </Pressable>

            <Text
              style={[
                styles.subscriptionDisclaimer,
                { color: colors.textMuted },
              ]}
            >
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
          style={[
            styles.modalContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Child Profile
            </Text>
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
                  <View
                    style={[
                      styles.editChildPhotoPlaceholder,
                      {
                        backgroundColor: colors.backgroundTertiary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.editChildPhotoPlaceholderText}>📷</Text>
                    <Text
                      style={[
                        styles.editChildPhotoLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Add Photo
                    </Text>
                  </View>
                )}
              </Pressable>
              {editChildPhoto && (
                <Pressable
                  onPress={() => setEditChildPhoto(undefined)}
                  style={styles.removePhotoButton}
                >
                  <Text
                    style={[
                      styles.removePhotoText,
                      { color: SemanticColors.error },
                    ]}
                  >
                    Remove Photo
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Name Field */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Name *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                },
              ]}
              value={editChildName}
              onChangeText={setEditChildName}
              placeholder="Child's name"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              testID="edit-child-name-input"
            />

            {/* Nickname Field */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Nickname
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                },
              ]}
              value={editChildNickname}
              onChangeText={setEditChildNickname}
              placeholder="Optional nickname"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              testID="edit-child-nickname-input"
            />

            {/* Date of Birth */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Date of Birth *
            </Text>
            <Pressable
              style={[
                styles.dateButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.inputBorder,
                },
              ]}
              onPress={() => setModalState("editChildDob")}
              testID="edit-child-dob-button"
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {editChildDob.toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </Pressable>

            {modalState === "editChildDob" && (
              <View
                style={[
                  styles.dobPickerContainer,
                  { backgroundColor: colors.card },
                ]}
              >
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
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Cultural Tradition
            </Text>
            <View style={styles.cultureOptions}>
              {(["chinese", "malay", "indian", "none"] as const).map(
                (culture) => (
                  <Pressable
                    key={culture}
                    style={[
                      styles.cultureOption,
                      {
                        backgroundColor: colors.backgroundTertiary,
                        borderColor: colors.border,
                      },
                      editChildCulture === culture &&
                        styles.cultureOptionSelected,
                    ]}
                    onPress={() => setEditChildCulture(culture)}
                    testID={`culture-option-${culture}`}
                  >
                    <Text
                      style={[
                        styles.cultureOptionText,
                        { color: colors.textSecondary },
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

      {/* Feedback Modal */}
      <Modal
        visible={modalState === "feedback"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setFeedbackText("");
          setModalState("closed");
        }}
      >
        <KeyboardAvoidingView
          style={[
            styles.modalContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setFeedbackText("");
                setModalState("closed");
              }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Send Feedback
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.feedbackModalContent}>
            <Text style={[styles.feedbackModalTitle, { color: colors.text }]}>
              We&apos;d love to hear from you!
            </Text>
            <Text
              style={[
                styles.feedbackModalSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              Share your thoughts, suggestions, or report issues. Your feedback
              helps us make Little Journey better for families.
            </Text>

            <TextInput
              style={[
                styles.feedbackInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                },
              ]}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              testID="feedback-input"
            />

            <Pressable
              style={[
                styles.submitFeedbackButton,
                !isFeedbackValid && styles.submitFeedbackButtonDisabled,
              ]}
              onPress={handleSubmitFeedback}
              disabled={!isFeedbackValid}
              testID="submit-feedback-button"
            >
              <Text
                style={[
                  styles.submitFeedbackButtonText,
                  !isFeedbackValid && styles.submitFeedbackButtonTextDisabled,
                ]}
              >
                Submit Feedback
              </Text>
            </Pressable>
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
  familyMemberLastViewed: {
    fontSize: 12,
    marginTop: 4,
  },
  familyMemberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resendButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  // Photo Book styles
  photoBookContainer: {
    paddingVertical: 8,
  },
  photoBookDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
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
  // Legal styles
  legalLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  legalLinkText: {
    fontSize: 16,
  },
  legalLinkArrow: {
    fontSize: 16,
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
  // Add Child button (MVP limit)
  addChildButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  addChildButtonDisabled: {
    opacity: 0.5,
  },
  addChildButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: PRIMARY_COLOR,
  },
  // Feedback styles
  feedbackDescription: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
    textAlign: "center",
  },
  feedbackModalContent: {
    padding: 16,
  },
  feedbackModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  feedbackModalSubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  feedbackInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 150,
  },
  submitFeedbackButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitFeedbackButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitFeedbackButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  submitFeedbackButtonTextDisabled: {
    color: "#999",
  },
});
