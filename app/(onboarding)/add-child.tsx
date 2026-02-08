import { useState } from "react";
import {
  StyleSheet,
  Pressable,
  TextInput,
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Alert,
  useColorScheme,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { useCreateChild } from "@/hooks/use-children";
import {
  Colors,
  SemanticColors,
  Spacing,
} from "@/constants/theme";

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
  const createChildMutation = useCreateChild();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
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

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to add a photo.",
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
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    if (!validateForm()) return;

    createChildMutation.mutate(
      {
        name: name.trim(),
        dateOfBirth: toISODateString(dateOfBirth!),
        nickname: nickname.trim() || undefined,
        photoUri: photoUri || undefined,
      },
      {
        onSuccess: () => {
          router.push("/(onboarding)/select-culture");
        },
      },
    );
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
            {/* Photo picker */}
            <View style={styles.photoSection}>
              <Pressable
                style={[
                  styles.photoButton,
                  { borderColor: colors.inputBorder },
                ]}
                onPress={handlePickPhoto}
                testID="photo-button"
              >
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoPreview}
                    testID="photo-preview"
                  />
                ) : (
                  <View
                    style={[
                      styles.photoPlaceholder,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                    testID="photo-placeholder"
                  >
                    <ThemedText style={styles.photoPlaceholderIcon}>📷</ThemedText>
                    <ThemedText
                      style={[
                        styles.photoPlaceholderText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Add Photo
                    </ThemedText>
                  </View>
                )}
              </Pressable>
              <ThemedText
                style={[styles.photoHint, { color: colors.textMuted }]}
              >
                Optional profile photo
              </ThemedText>
            </View>

            {/* Name field */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                Name <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: errors.name
                      ? SemanticColors.error
                      : colors.inputBorder,
                  },
                ]}
                placeholder="Enter child's name"
                placeholderTextColor={colors.placeholder}
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
                <ThemedText type="caption" style={styles.errorText}>{errors.name}</ThemedText>
              )}
            </View>

            {/* Nickname field (optional) */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                Nickname{" "}
                <ThemedText style={[styles.optional, { color: colors.textMuted }]}>
                  (optional)
                </ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="Shown to family instead of name"
                placeholderTextColor={colors.placeholder}
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="words"
                testID="nickname-input"
              />
            </View>

            {/* Date of birth field */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                Date of Birth <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <Pressable
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: errors.dob
                      ? SemanticColors.error
                      : colors.inputBorder,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
                testID="dob-button"
              >
                <ThemedText
                  style={[
                    styles.dateButtonText,
                    { color: dateOfBirth ? colors.text : colors.placeholder },
                  ]}
                >
                  {dateOfBirth ? formatDate(dateOfBirth) : "Select date"}
                </ThemedText>
              </Pressable>
              {errors.dob && <ThemedText type="caption" style={styles.errorText}>{errors.dob}</ThemedText>}

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
                      <ThemedText type="bodyMedium" style={[styles.datePickerDoneText, { color: PRIMARY_COLOR }]}>Done</ThemedText>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isFormValid}
            onPress={handleContinue}
            testID="continue-button"
          >
            Continue
          </Button>
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
    padding: Spacing.xl,
    paddingTop: 48,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xxl,
    opacity: 0.7,
  },
  form: {
    flex: 1,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  photoPlaceholderIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  photoPlaceholderText: {
    fontSize: 12,
  },
  photoHint: {
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  required: {
    color: SemanticColors.error,
  },
  optional: {
    fontWeight: "400",
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.md,
    padding: Spacing.lg,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: Spacing.md,
    padding: Spacing.lg,
  },
  dateButtonText: {
    fontSize: 16,
  },
  datePickerContainer: {
    marginTop: Spacing.sm,
  },
  datePickerDone: {
    alignItems: "flex-end",
    paddingVertical: Spacing.sm,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: SemanticColors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
  },

});
