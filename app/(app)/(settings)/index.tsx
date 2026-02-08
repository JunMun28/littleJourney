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
  useColorScheme,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useAuth } from "@/contexts/auth-context";
import { type CulturalTradition } from "@/contexts/child-context";
import { useExport } from "@/contexts/export-context";
import {
  useNotifications,
  type NotificationSettings as NotificationSettingsType,
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
import { useCommunity } from "@/contexts/community-context";
import {
  useFamilyDigest,
  type DigestFrequency,
  type DeliveryMethod,
} from "@/contexts/family-digest-context";
import { Spacing } from "@/constants/design-tokens";
import { ModalHeader } from "@/components/ui/modal-header";
import { Button } from "@/components/ui/button";

import {
  ChildProfileCard,
  NotificationSettings,
  DeleteAccountModal,
  InviteFamilyModal,
  SubscriptionCard,
  SubscriptionModal,
  EditChildModal,
} from "@/components/settings";

type ModalState =
  | "closed"
  | "inviteFamily"
  | "timePicker"
  | "deleteAccount"
  | "subscription"
  | "editChild"
  | "editChildDob"
  | "feedback";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  const decimals = i >= 3 || value % 1 !== 0 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[i]}`;
}

function getTierDisplayName(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function timeStringToDate(time: string | null): Date {
  const date = new Date();
  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  } else {
    date.setHours(20, 0, 0, 0);
  }
  return date;
}

function dateToTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
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
  const {
    communityDataSharingEnabled,
    sharingExplanation,
    setCommunityDataSharingEnabled,
  } = useCommunity();
  const { enableDigest, disableDigest, getDigestConfig } = useFamilyDigest();
  const { child, updateChild } = useChildFlat();
  const {
    currentPlan,
    billingCycle,
    isSubscribed,
    cancelledAt,
    currentPeriodEnd,
    subscribe,
    upgradePlan,
    calculateProratedAmount,
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
  const [feedbackText, setFeedbackText] = useState("");

  const handleToggleNotification = async (
    key: keyof NotificationSettingsType,
    value: boolean,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ [key]: value });
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
    if (settings.dailyPrompt && permissionStatus === "granted") {
      await scheduleDailyPrompt(timeString);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleInviteFamily = () => {
    if (!inviteEmail.trim() || !inviteRelationship.trim() || !child?.id) return;
    inviteFamilyMember({
      email: inviteEmail.trim(),
      relationship: inviteRelationship.trim(),
      permissionLevel: invitePermission,
      childId: child.id,
    });
    setInviteEmail("");
    setInviteRelationship("");
    setInvitePermission("view_interact");
    setModalState("closed");
  };

  const handleDeleteAccount = async () => {
    await requestAccountDeletion();
    setDeleteConfirmText("");
    setModalState("closed");
  };

  const handleSubscribe = async () => {
    clearPaymentError();
    const success = await processPayment(selectedPlan, selectedCycle);
    if (!success) {
      if (paymentError) Alert.alert("Payment Error", paymentError);
      return;
    }
    await subscribe(selectedPlan, selectedCycle);
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
        { text: "Cancel", style: "destructive", onPress: cancelSubscription },
      ],
    );
  };

  const handleUpgrade = async () => {
    clearPaymentError();
    const proratedAmount = calculateProratedAmount(selectedPlan);
    Alert.alert(
      "Upgrade to Premium",
      `You'll be charged $${proratedAmount.toFixed(2)} SGD now for the remainder of your billing period.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade Now",
          onPress: async () => {
            const success = await processPayment(
              selectedPlan,
              billingCycle || "monthly",
            );
            if (!success) {
              if (paymentError) Alert.alert("Payment Error", paymentError);
              return;
            }
            await upgradePlan(selectedPlan);
            setTier(selectedPlan);
            setModalState("closed");
            Alert.alert(
              "Upgrade Successful!",
              "You're now on the Premium plan.",
            );
          },
        },
      ],
    );
  };

  const handleEditChild = (data: {
    name: string;
    nickname?: string;
    dateOfBirth: string;
    photoUri?: string;
    culturalTradition: CulturalTradition;
  }) => {
    updateChild(data);
    setModalState("closed");
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    console.log("Feedback submitted:", feedbackText);
    Alert.alert("Thank You!", "Your feedback has been received.");
    setFeedbackText("");
    setModalState("closed");
  };

  const isFeedbackValid = feedbackText.trim().length > 0;

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary },
      ]}
      contentContainerStyle={styles.content}
    >
      {/* Notifications Section */}
      <NotificationSettings
        settings={settings}
        permissionStatus={permissionStatus}
        dailyPromptTime={dailyPromptTime}
        onToggle={handleToggleNotification}
        onRequestPermissions={requestPermissions}
        onTimePress={() => setModalState("timePicker")}
      />

      {/* Child Profile Section */}
      <ChildProfileCard
        child={
          child
            ? {
                id: child.id,
                name: child.name,
                nickname: child.nickname,
                dateOfBirth: child.dateOfBirth,
                photoUri: child.photoUri,
                culturalTradition: child.culturalTradition,
              }
            : null
        }
        onEdit={() => setModalState("editChild")}
        onAddChild={() =>
          Alert.alert(
            "Add Child",
            "To add a child, please complete the onboarding process.",
          )
        }
      />

      {/* Family Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Family
        </Text>
        <Button
          variant="primary"
          fullWidth
          onPress={() => setModalState("inviteFamily")}
        >
          Invite Family Member
        </Button>

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

      {/* Family Digest Section */}
      {familyMembers.filter((m) => m.status === "accepted").length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            Family Digest
          </Text>
          <Text
            style={[styles.settingDescription, { color: colors.textMuted }]}
          >
            Send weekly email updates to family members with recent photos and
            milestones.
          </Text>
          {familyMembers
            .filter((m) => m.status === "accepted")
            .map((member) => {
              const digestConfig = getDigestConfig(member.id);
              const isEnabled = digestConfig?.enabled ?? false;
              const frequency = digestConfig?.frequency ?? "weekly";
              const deliveryMethod = digestConfig?.deliveryMethod ?? "email";
              return (
                <View
                  key={`digest-${member.id}`}
                  style={[
                    styles.digestMemberCard,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={styles.digestMemberHeader}>
                    <View style={styles.familyMemberInfo}>
                      <Text
                        style={[
                          styles.familyMemberEmail,
                          { color: colors.text },
                        ]}
                      >
                        {member.email}
                      </Text>
                      <Text
                        style={[
                          styles.familyMemberRelationship,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {member.relationship}
                      </Text>
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={(value) => {
                        if (value)
                          enableDigest(member.id, frequency, deliveryMethod);
                        else disableDigest(member.id);
                      }}
                      trackColor={{ false: colors.border, true: PRIMARY_COLOR }}
                    />
                  </View>
                  {isEnabled && (
                    <View style={styles.digestOptions}>
                      <View style={styles.digestOptionRow}>
                        <Text
                          style={[
                            styles.digestOptionLabel,
                            { color: colors.text },
                          ]}
                        >
                          Frequency
                        </Text>
                        <View style={styles.digestFrequencyButtons}>
                          {(
                            ["daily", "weekly", "monthly"] as DigestFrequency[]
                          ).map((freq) => (
                            <Pressable
                              key={freq}
                              style={[
                                styles.digestFrequencyButton,
                                frequency === freq &&
                                  styles.digestFrequencyButtonActive,
                                { borderColor: colors.border },
                              ]}
                              onPress={() =>
                                enableDigest(member.id, freq, deliveryMethod)
                              }
                            >
                              <Text
                                style={[
                                  styles.digestFrequencyButtonText,
                                  {
                                    color:
                                      frequency === freq ? "#fff" : colors.text,
                                  },
                                ]}
                              >
                                {freq.charAt(0).toUpperCase() + freq.slice(1)}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                      <View style={styles.digestOptionRow}>
                        <Text
                          style={[
                            styles.digestOptionLabel,
                            { color: colors.text },
                          ]}
                        >
                          Delivery
                        </Text>
                        <View style={styles.digestFrequencyButtons}>
                          {(["email", "whatsapp"] as DeliveryMethod[]).map(
                            (method) => (
                              <Pressable
                                key={method}
                                style={[
                                  styles.digestFrequencyButton,
                                  deliveryMethod === method &&
                                    styles.digestFrequencyButtonActive,
                                  { borderColor: colors.border },
                                ]}
                                onPress={() =>
                                  enableDigest(member.id, frequency, method)
                                }
                              >
                                <Text
                                  style={[
                                    styles.digestFrequencyButtonText,
                                    {
                                      color:
                                        deliveryMethod === method
                                          ? "#fff"
                                          : colors.text,
                                    },
                                  ]}
                                >
                                  {method === "email"
                                    ? "📧 Email"
                                    : "💬 WhatsApp"}
                                </Text>
                              </Pressable>
                            ),
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      )}

      {/* Subscription Section */}
      <SubscriptionCard
        currentPlan={currentPlan}
        billingCycle={billingCycle}
        isSubscribed={isSubscribed}
        cancelledAt={cancelledAt}
        currentPeriodEnd={currentPeriodEnd}
        isLoading={isSubscriptionLoading}
        onUpgrade={() => setModalState("subscription")}
        onCancel={handleCancelSubscription}
        onRestore={restoreSubscription}
      />

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
        <Text
          style={[styles.photoBookDescription, { color: colors.textSecondary }]}
        >
          Create a beautiful photo book from your milestone moments
        </Text>
        <Button
          variant="primary"
          fullWidth
          onPress={() => router.push("./photo-book")}
          testID="create-photo-book-button"
        >
          Create Photo Book
        </Button>
      </View>

      {/* Singapore Local Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Singapore Local
        </Text>
        <Pressable
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push("./red-packet")}
          testID="red-packet-link"
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              🧧 Ang Bao Tracker
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              Track CNY red packet collections
            </Text>
          </View>
          <Text style={[styles.legalLinkArrow, { color: colors.textMuted }]}>
            →
          </Text>
        </Pressable>
      </View>

      {/* Data & Privacy Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Data & Privacy
        </Text>
        <Button
          variant="primary"
          fullWidth
          loading={isExporting}
          disabled={isExporting}
          onPress={exportData}
          testID="export-data-button"
        >
          {isExporting ? "Exporting..." : "Download All Memories"}
        </Button>
        {lastExportDate && (
          <Text style={[styles.exportInfo, { color: colors.textSecondary }]}>
            Last exported:{" "}
            {new Date(lastExportDate).toLocaleDateString("en-SG")}
          </Text>
        )}
        <Text style={[styles.exportDescription, { color: colors.textMuted }]}>
          Export all your entries, milestones, and child data as a JSON file.
        </Text>
        <View
          style={[
            styles.settingRow,
            { borderBottomColor: colors.border, marginTop: 16 },
          ]}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Community Data Sharing
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              Share anonymized milestone data
            </Text>
          </View>
          <Switch
            testID="switch-communityDataSharing"
            value={communityDataSharingEnabled}
            onValueChange={setCommunityDataSharingEnabled}
            trackColor={{ false: colors.border, true: PRIMARY_COLOR }}
          />
        </View>
        <Text
          style={[
            styles.exportDescription,
            { color: colors.textMuted, marginTop: 8 },
          ]}
        >
          {sharingExplanation}
        </Text>
      </View>

      {/* Community Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Community
        </Text>
        <Pressable
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push("./community")}
          testID="community-questions-link"
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              💬 Ask Community
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              Ask anonymous questions to other parents
            </Text>
          </View>
          <Text style={[styles.legalLinkArrow, { color: colors.textMuted }]}>
            →
          </Text>
        </Pressable>
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
        <Button
          variant="primary"
          fullWidth
          onPress={() => setModalState("feedback")}
          testID="send-feedback-button"
        >
          Send Feedback
        </Button>
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
              Your account will be permanently deleted on{" "}
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
              onPress={cancelAccountDeletion}
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

      {/* Modals */}
      <InviteFamilyModal
        visible={modalState === "inviteFamily"}
        email={inviteEmail}
        relationship={inviteRelationship}
        permission={invitePermission}
        onEmailChange={setInviteEmail}
        onRelationshipChange={setInviteRelationship}
        onPermissionChange={setInvitePermission}
        onClose={() => setModalState("closed")}
        onInvite={handleInviteFamily}
      />

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
          <ModalHeader
            title="Reminder Time"
            onClose={() => setModalState("closed")}
            onAction={handleSaveTime}
            actionLabel="Save"
          />
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

      <DeleteAccountModal
        visible={modalState === "deleteAccount"}
        confirmText={deleteConfirmText}
        onConfirmTextChange={setDeleteConfirmText}
        onClose={() => setModalState("closed")}
        onDelete={handleDeleteAccount}
      />

      <SubscriptionModal
        visible={modalState === "subscription"}
        currentPlan={currentPlan}
        currentBillingCycle={billingCycle}
        selectedPlan={selectedPlan}
        selectedCycle={selectedCycle}
        isLoading={isSubscriptionLoading || isPaymentLoading}
        proratedAmount={calculateProratedAmount(selectedPlan)}
        onPlanChange={setSelectedPlan}
        onCycleChange={setSelectedCycle}
        onClose={() => setModalState("closed")}
        onSubscribe={handleSubscribe}
        onUpgrade={handleUpgrade}
      />

      <EditChildModal
        visible={modalState === "editChild" || modalState === "editChildDob"}
        showDatePicker={modalState === "editChildDob"}
        initialName={child?.name ?? ""}
        initialNickname={child?.nickname ?? ""}
        initialDob={child ? new Date(child.dateOfBirth) : new Date()}
        initialPhoto={child?.photoUri}
        initialCulture={child?.culturalTradition ?? "none"}
        onClose={() => setModalState("closed")}
        onSave={handleEditChild}
        onShowDatePicker={() => setModalState("editChildDob")}
        onHideDatePicker={() => setModalState("editChild")}
      />

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
          <ModalHeader
            title="Send Feedback"
            onClose={() => {
              setFeedbackText("");
              setModalState("closed");
            }}
          />
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
              Share your thoughts, suggestions, or report issues.
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
            <Button
              variant="primary"
              fullWidth
              disabled={!isFeedbackValid}
              onPress={handleSubmitFeedback}
              testID="submit-feedback-button"
              style={styles.submitFeedbackButton}
            >
              Submit Feedback
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  section: {
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
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 16 },
  settingDescription: { fontSize: 13, marginTop: 2 },
  actionButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  actionButtonDisabled: { opacity: 0.6 },
  familyList: { marginTop: 16 },
  familyMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  familyMemberInfo: { flex: 1 },
  familyMemberEmail: { fontSize: 16 },
  familyMemberRelationship: { fontSize: 13, marginTop: 2 },
  familyMemberLastViewed: { fontSize: 12, marginTop: 4 },
  familyMemberActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  removeButton: { fontSize: 14 },
  digestMemberCard: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  digestMemberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  digestOptions: { marginTop: 12, gap: 12 },
  digestOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  digestOptionLabel: { fontSize: 14 },
  digestFrequencyButtons: { flexDirection: "row", gap: 8 },
  digestFrequencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  digestFrequencyButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  digestFrequencyButtonText: { fontSize: 13, fontWeight: "500" },
  storageContainer: { paddingVertical: 8 },
  storageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  storageTier: { fontSize: 16, fontWeight: "600" },
  storageUsage: { fontSize: 14 },
  progressBarContainer: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  storagePercent: { fontSize: 13, marginTop: 8 },
  upgradePrompt: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${PRIMARY_COLOR}10`,
    borderRadius: 8,
  },
  upgradeText: { fontSize: 14, color: PRIMARY_COLOR, textAlign: "center" },
  photoBookDescription: { fontSize: 14, marginBottom: 12, textAlign: "center" },
  exportInfo: { fontSize: 13, marginTop: 12, textAlign: "center" },
  exportDescription: { fontSize: 13, marginTop: 8, textAlign: "center" },
  legalLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  legalLinkText: { fontSize: 16 },
  legalLinkArrow: { fontSize: 16 },
  feedbackDescription: { fontSize: 14, marginBottom: 12, textAlign: "center" },
  accountInfo: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accountEmail: { fontSize: 16 },
  signOutButton: { paddingVertical: 12, alignItems: "center" },
  signOutText: { fontSize: 16, fontWeight: "500" },
  deleteAccountButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  deleteAccountText: { fontSize: 16 },
  deletionScheduledContainer: { marginTop: 16, padding: 16, borderRadius: 8 },
  deletionScheduledTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  deletionScheduledDate: { fontSize: 14, marginBottom: 12 },
  cancelDeletionButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelDeletionText: { fontSize: 14, fontWeight: "600" },
  modalContainer: { flex: 1 },
  timePickerContainer: { alignItems: "center", paddingVertical: 20 },
  feedbackModalContent: { padding: Spacing.lg },
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 150,
  },
  submitFeedbackButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitFeedbackButtonDisabled: { backgroundColor: "#ccc" },
  submitFeedbackButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  submitFeedbackButtonTextDisabled: { color: "#999" },
});
