import { useState } from "react";
import {
  StyleSheet,
  Pressable,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFamily, type PermissionLevel } from "@/contexts/family-context";

const PRIMARY_COLOR = "#0a7ea4";

const PERMISSION_OPTIONS: {
  value: PermissionLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "view_interact",
    label: "View & Interact",
    description: "Can view, comment, and react to entries",
  },
  {
    value: "view_only",
    label: "View Only",
    description: "Can only view entries",
  },
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InviteFamilyScreen() {
  const router = useRouter();
  const { inviteFamilyMember } = useFamily();

  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [permissionLevel, setPermissionLevel] =
    useState<PermissionLevel>("view_interact");

  const isFormValid = isValidEmail(email) && relationship.trim().length > 0;

  const handleSendInvite = () => {
    if (!isFormValid) return;

    inviteFamilyMember({
      email: email.trim(),
      relationship: relationship.trim(),
      permissionLevel,
    });

    router.push("/first-entry");
  };

  const handleSkip = () => {
    router.push("/first-entry");
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>
            Invite Family
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Share your baby&apos;s journey with loved ones. They&apos;ll receive
            a magic link to view updates - no app download required.
          </ThemedText>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="grandma@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="email-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Relationship</ThemedText>
              <TextInput
                style={styles.input}
                value={relationship}
                onChangeText={setRelationship}
                placeholder="Grandmother, Uncle, etc."
                placeholderTextColor="#999"
                autoCapitalize="words"
                testID="relationship-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Permission Level</ThemedText>
              <View style={styles.permissionOptions}>
                {PERMISSION_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.permissionOption,
                      permissionLevel === option.value &&
                        styles.permissionOptionSelected,
                    ]}
                    onPress={() => setPermissionLevel(option.value)}
                    testID={`permission-${option.value}`}
                  >
                    <View style={styles.radioOuter}>
                      {permissionLevel === option.value && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.permissionText}>
                      <ThemedText style={styles.permissionLabel}>
                        {option.label}
                      </ThemedText>
                      <ThemedText style={styles.permissionDescription}>
                        {option.description}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <ThemedText style={styles.infoText}>
              You can invite more family members anytime from Settings. Links
              expire after 90 days of inactivity.
            </ThemedText>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={[styles.button, !isFormValid && styles.buttonDisabled]}
              onPress={handleSendInvite}
              disabled={!isFormValid}
              testID="send-invite-button"
            >
              <Text style={styles.buttonText}>Send Invite</Text>
            </Pressable>

            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
              testID="skip-button"
            >
              <ThemedText style={styles.skipButtonText}>
                Skip for now
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    opacity: 0.7,
    lineHeight: 22,
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  permissionOptions: {
    gap: 12,
  },
  permissionOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    gap: 12,
  },
  permissionOptionSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: `${PRIMARY_COLOR}10`,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY_COLOR,
  },
  permissionText: {
    flex: 1,
    gap: 4,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  permissionDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
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
  buttonDisabled: {
    backgroundColor: "#ccc",
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
