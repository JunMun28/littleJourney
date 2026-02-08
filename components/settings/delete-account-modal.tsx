/**
 * Delete Account Modal Component
 *
 * Confirmation modal for account deletion with 30-day grace period.
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
import { ThemeColors, Semantic, Spacing } from "@/constants/design-tokens";
import { ModalHeader } from "@/components/ui/modal-header";

interface DeleteAccountModalProps {
  visible: boolean;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteAccountModal({
  visible,
  confirmText,
  onConfirmTextChange,
  onClose,
  onDelete,
}: DeleteAccountModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  const isValid = confirmText === "DELETE";

  const handleClose = () => {
    onConfirmTextChange("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[
          styles.container,
          { backgroundColor: colors.backgroundSecondary },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ModalHeader title="Delete Account" onClose={handleClose} />

        <View style={styles.content}>
          <Text style={[styles.warningTitle, { color: Semantic.error }]}>
            ⚠️ Warning
          </Text>
          <Text style={[styles.warningText, { color: colors.text }]}>
            This will permanently delete your account and all your data,
            including:
          </Text>
          <View style={styles.warningList}>
            <Text style={[styles.warningItem, { color: colors.textSecondary }]}>
              • All journal entries
            </Text>
            <Text style={[styles.warningItem, { color: colors.textSecondary }]}>
              • All photos and videos
            </Text>
            <Text style={[styles.warningItem, { color: colors.textSecondary }]}>
              • Child profiles
            </Text>
            <Text style={[styles.warningItem, { color: colors.textSecondary }]}>
              • Milestones
            </Text>
            <Text style={[styles.warningItem, { color: colors.textSecondary }]}>
              • Family member access
            </Text>
          </View>

          <Text
            style={[
              styles.gracePeriod,
              {
                backgroundColor: colors.backgroundTertiary,
                color: colors.textSecondary,
              },
            ]}
          >
            You will have 30 days to cancel this request. After that, your data
            will be permanently deleted and cannot be recovered.
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Type DELETE to confirm
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
            value={confirmText}
            onChangeText={onConfirmTextChange}
            placeholder="DELETE"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="characters"
            testID="delete-confirm-input"
          />

          <Pressable
            style={[
              styles.deleteButton,
              !isValid && styles.deleteButtonDisabled,
            ]}
            onPress={onDelete}
            disabled={!isValid}
            testID="confirm-delete-button"
          >
            <Text
              style={[
                styles.deleteButtonText,
                !isValid && styles.deleteButtonTextDisabled,
              ]}
            >
              Delete My Account
            </Text>
          </Pressable>
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
  warningTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  warningText: {
    fontSize: 16,
    marginBottom: 12,
  },
  warningList: {
    marginBottom: 16,
  },
  warningItem: {
    fontSize: 15,
    marginBottom: 4,
  },
  gracePeriod: {
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
  deleteButton: {
    backgroundColor: Semantic.error,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  deleteButtonDisabled: {
    backgroundColor: "#ccc",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  deleteButtonTextDisabled: {
    color: "#999",
  },
});
