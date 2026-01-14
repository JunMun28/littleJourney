import { useState } from "react";
import {
  StyleSheet,
  Pressable,
  Text,
  TextInput,
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";
import { useChild } from "@/contexts/child-context";
import { useThemeColor } from "@/hooks/use-theme-color";

const PRIMARY_COLOR = "#0a7ea4";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function AddChildScreen() {
  const { completeOnboarding } = useAuth();
  const { setChild } = useChild();
  const textColor = useThemeColor({}, "text");

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; dob?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { name?: string; dob?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!dateOfBirth) {
      newErrors.dob = "Date of birth is required";
    } else if (dateOfBirth > new Date()) {
      newErrors.dob = "Date of birth cannot be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setDateOfBirth(selectedDate);
      if (errors.dob) {
        setErrors((prev) => ({ ...prev, dob: undefined }));
      }
    }
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setChild({
      name: name.trim(),
      dateOfBirth: toISODateString(dateOfBirth!),
      nickname: nickname.trim() || undefined,
    });

    await completeOnboarding();
  };

  const isFormValid = name.trim() && dateOfBirth;

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
            Add Your Child
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Tell us about your little one to get started
          </ThemedText>

          <View style={styles.form}>
            {/* Name field */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                Name <Text style={styles.required}>*</Text>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor: errors.name ? "#dc2626" : "#ccc",
                  },
                ]}
                placeholder="Enter child's name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                autoCapitalize="words"
                testID="name-input"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Nickname field (optional) */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                Nickname <Text style={styles.optional}>(optional)</Text>
              </ThemedText>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Shown to family instead of name"
                placeholderTextColor="#999"
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="words"
                testID="nickname-input"
              />
            </View>

            {/* Date of birth field */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                Date of Birth <Text style={styles.required}>*</Text>
              </ThemedText>
              <Pressable
                style={[
                  styles.dateButton,
                  { borderColor: errors.dob ? "#dc2626" : "#ccc" },
                ]}
                onPress={() => setShowDatePicker(true)}
                testID="dob-button"
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    { color: dateOfBirth ? textColor : "#999" },
                  ]}
                >
                  {dateOfBirth ? formatDate(dateOfBirth) : "Select date"}
                </Text>
              </Pressable>
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={dateOfBirth || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    testID="date-picker"
                  />
                  {Platform.OS === "ios" && (
                    <Pressable
                      style={styles.datePickerDone}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>

          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: isFormValid ? PRIMARY_COLOR : "#ccc",
              },
            ]}
            onPress={handleContinue}
            disabled={!isFormValid}
            testID="continue-button"
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
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
    paddingTop: 48,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
  },
  form: {
    flex: 1,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: {
    color: "#dc2626",
  },
  optional: {
    fontWeight: "400",
    opacity: 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
  },
  datePickerContainer: {
    marginTop: 8,
  },
  datePickerDone: {
    alignItems: "flex-end",
    paddingVertical: 8,
  },
  datePickerDoneText: {
    color: PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
});
