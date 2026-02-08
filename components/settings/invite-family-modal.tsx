/**
 * Invite Family Modal Component
 *
 * Modal for inviting family members with email, relationship, and permissions.
 */

import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemeColors, Primary, Spacing } from "@/constants/design-tokens";
import { ModalHeader } from "@/components/ui/modal-header";
import { type PermissionLevel } from "@/contexts/family-context";

interface InviteFamilyModalProps {
  visible: boolean;
  email: string;
  relationship: string;
  permission: PermissionLevel;
  onEmailChange: (email: string) => void;
  onRelationshipChange: (relationship: string) => void;
  onPermissionChange: (permission: PermissionLevel) => void;
  onClose: () => void;
  onInvite: () => void;
}

export function InviteFamilyModal({
  visible,
  email,
  relationship,
  permission,
  onEmailChange,
  onRelationshipChange,
  onPermissionChange,
  onClose,
  onInvite,
}: InviteFamilyModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  const isValid = email.trim().includes("@") && relationship.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[
          styles.container,
          { backgroundColor: colors.backgroundSecondary },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ModalHeader
          title="Invite Family"
          onClose={onClose}
          onAction={onInvite}
          actionLabel="Send"
          actionDisabled={!isValid}
        />

        <View style={styles.content}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Email
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.inputBorder,
              },
            ]}
            value={email}
            onChangeText={onEmailChange}
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
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.inputBorder,
              },
            ]}
            value={relationship}
            onChangeText={onRelationshipChange}
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
                permission === "view_interact" &&
                  styles.permissionOptionSelected,
              ]}
              onPress={() => onPermissionChange("view_interact")}
            >
              <Text
                style={[
                  styles.permissionOptionText,
                  { color: colors.textSecondary },
                  permission === "view_interact" &&
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
                permission === "view_only" && styles.permissionOptionSelected,
              ]}
              onPress={() => onPermissionChange("view_only")}
            >
              <Text
                style={[
                  styles.permissionOptionText,
                  { color: colors.textSecondary },
                  permission === "view_only" &&
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  permissionOptions: {
    flexDirection: "row",
    gap: 12,
  },
  permissionOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  permissionOptionSelected: {
    borderColor: Primary[500],
    backgroundColor: `${Primary[500]}10`,
  },
  permissionOptionText: {
    fontSize: 14,
  },
  permissionOptionTextSelected: {
    color: Primary[500],
    fontWeight: "600",
  },
});
