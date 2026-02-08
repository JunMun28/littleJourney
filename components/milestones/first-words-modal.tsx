/**
 * First Words Modal Component
 *
 * Modal for adding first words milestone with language selection.
 */

import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PRIMARY_COLOR, Colors, Spacing } from "@/constants/theme";
import {
  LANGUAGE_LABELS,
  type FirstWordLanguage,
} from "@/contexts/milestone-context";

interface FirstWordsModalProps {
  visible: boolean;
  firstWord: string;
  firstWordRomanization: string;
  firstWordLanguage: FirstWordLanguage;
  firstWordsDate: Date;
  showDatePicker: boolean;
  onWordChange: (word: string) => void;
  onRomanizationChange: (romanization: string) => void;
  onLanguageChange: (language: FirstWordLanguage) => void;
  onDateChange: (date: Date) => void;
  onShowDatePicker: (show: boolean) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function FirstWordsModal({
  visible,
  firstWord,
  firstWordRomanization,
  firstWordLanguage,
  firstWordsDate,
  showDatePicker,
  onWordChange,
  onRomanizationChange,
  onLanguageChange,
  onDateChange,
  onShowDatePicker,
  onSubmit,
  onClose,
}: FirstWordsModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const isValid = firstWord.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={[styles.fullModal, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[styles.fullModalHeader, { borderBottomColor: colors.border }]}
        >
          <Pressable onPress={onClose}>
            <Text style={styles.backButton}>← Back</Text>
          </Pressable>
          <ThemedText type="subtitle">First Words</ThemedText>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.formContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Language *</Text>
          <View style={styles.languageOptions}>
            {(
              Object.entries(LANGUAGE_LABELS) as [FirstWordLanguage, string][]
            ).map(([key, label]) => (
              <Pressable
                key={key}
                style={[
                  styles.languageOption,
                  {
                    borderColor:
                      firstWordLanguage === key
                        ? PRIMARY_COLOR
                        : colors.inputBorder,
                    backgroundColor:
                      firstWordLanguage === key
                        ? `${PRIMARY_COLOR}15`
                        : colors.background,
                  },
                ]}
                onPress={() => onLanguageChange(key)}
                testID={`language-option-${key}`}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    {
                      color:
                        firstWordLanguage === key ? PRIMARY_COLOR : colors.text,
                      fontWeight: firstWordLanguage === key ? "600" : "400",
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>The Word *</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.background,
                color: colors.text,
              },
            ]}
            value={firstWord}
            onChangeText={onWordChange}
            placeholder={
              firstWordLanguage === "english"
                ? 'e.g., "Mama"'
                : firstWordLanguage === "mandarin"
                  ? 'e.g., "妈妈"'
                  : firstWordLanguage === "malay"
                    ? 'e.g., "Mak"'
                    : 'e.g., "அம்மா"'
            }
            placeholderTextColor={colors.placeholder}
            testID="first-word-input"
          />

          {(firstWordLanguage === "mandarin" ||
            firstWordLanguage === "tamil") && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                Romanization{" "}
                {firstWordLanguage === "mandarin" ? "(Pinyin)" : "(Optional)"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.background,
                    color: colors.text,
                  },
                ]}
                value={firstWordRomanization}
                onChangeText={onRomanizationChange}
                placeholder={
                  firstWordLanguage === "mandarin" ? "e.g., māmā" : ""
                }
                placeholderTextColor={colors.placeholder}
                testID="first-word-romanization-input"
              />
            </>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Date</Text>
          <Pressable
            style={[styles.dateButton, { borderColor: colors.inputBorder }]}
            onPress={() => onShowDatePicker(true)}
          >
            <Text style={[styles.dateButtonText, { color: colors.text }]}>
              {firstWordsDate.toLocaleDateString("en-SG")}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={firstWordsDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, date) => {
                onShowDatePicker(Platform.OS === "ios");
                if (date) onDateChange(date);
              }}
            />
          )}

          <Pressable
            style={[
              styles.submitButton,
              !isValid && styles.submitButtonDisabled,
            ]}
            onPress={onSubmit}
            disabled={!isValid}
            testID="add-first-words-button"
          >
            <Text style={styles.submitButtonText}>Add First Words</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullModal: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  formContainer: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dateButtonText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  languageOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageOptionText: {
    fontSize: 14,
  },
});
