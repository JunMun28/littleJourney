/**
 * Edit Child Modal Component
 *
 * Modal for editing child profile information.
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ThemeColors,
  Primary,
  Semantic,
  Spacing,
} from "@/constants/design-tokens";
import { ModalHeader } from "@/components/ui/modal-header";
import { type CulturalTradition } from "@/contexts/child-context";

interface EditChildModalProps {
  visible: boolean;
  showDatePicker: boolean;
  initialName: string;
  initialNickname: string;
  initialDob: Date;
  initialPhoto?: string;
  initialCulture: CulturalTradition;
  onClose: () => void;
  onSave: (data: {
    name: string;
    nickname?: string;
    dateOfBirth: string;
    photoUri?: string;
    culturalTradition: CulturalTradition;
  }) => void;
  onShowDatePicker: () => void;
  onHideDatePicker: () => void;
}

function getCultureLabel(culture: CulturalTradition): string {
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
}

export function EditChildModal({
  visible,
  showDatePicker,
  initialName,
  initialNickname,
  initialDob,
  initialPhoto,
  initialCulture,
  onClose,
  onSave,
  onShowDatePicker,
  onHideDatePicker,
}: EditChildModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = ThemeColors[colorScheme];

  const [name, setName] = useState(initialName);
  const [nickname, setNickname] = useState(initialNickname);
  const [dob, setDob] = useState(initialDob);
  const [photo, setPhoto] = useState(initialPhoto);
  const [culture, setCulture] = useState(initialCulture);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setNickname(initialNickname);
      setDob(initialDob);
      setPhoto(initialPhoto);
      setCulture(initialCulture);
    }
  }, [
    visible,
    initialName,
    initialNickname,
    initialDob,
    initialPhoto,
    initialCulture,
  ]);

  const isValid = name.trim().length > 0;

  const handleDobChange = (
    _event: DateTimePickerEvent,
    date: Date | undefined,
  ) => {
    if (Platform.OS === "android") {
      onHideDatePicker();
    }
    if (date) {
      setDob(date);
    }
  };

  const handlePickPhoto = async () => {
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
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      dateOfBirth: dob.toISOString().split("T")[0],
      photoUri: photo,
      culturalTradition: culture,
    });
  };

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
          title="Edit Child Profile"
          onClose={onClose}
          onAction={handleSave}
          actionLabel="Save"
          actionDisabled={!isValid}
        />

        <ScrollView style={styles.content}>
          <View style={styles.photoSection}>
            <Pressable
              style={styles.photoButton}
              onPress={handlePickPhoto}
              testID="edit-child-photo-button"
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoImage} />
              ) : (
                <View
                  style={[
                    styles.photoPlaceholder,
                    {
                      backgroundColor: colors.backgroundTertiary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={styles.photoPlaceholderEmoji}>📷</Text>
                  <Text
                    style={[styles.photoLabel, { color: colors.textSecondary }]}
                  >
                    Add Photo
                  </Text>
                </View>
              )}
            </Pressable>
            {photo && (
              <Pressable
                onPress={() => setPhoto(undefined)}
                style={styles.removePhotoButton}
              >
                <Text
                  style={[styles.removePhotoText, { color: Semantic.error }]}
                >
                  Remove Photo
                </Text>
              </Pressable>
            )}
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Name *
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
            value={name}
            onChangeText={setName}
            placeholder="Child's name"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="words"
            testID="edit-child-name-input"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Nickname
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
            value={nickname}
            onChangeText={setNickname}
            placeholder="Optional nickname"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="words"
            testID="edit-child-nickname-input"
          />

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
            onPress={onShowDatePicker}
            testID="edit-child-dob-button"
          >
            <Text style={[styles.dateButtonText, { color: colors.text }]}>
              {dob.toLocaleDateString("en-SG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </Pressable>

          {showDatePicker && (
            <View
              style={[
                styles.dobPickerContainer,
                { backgroundColor: colors.card },
              ]}
            >
              <DateTimePicker
                testID="edit-child-dob-picker"
                value={dob}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDobChange}
                maximumDate={new Date()}
              />
            </View>
          )}

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Cultural Tradition
          </Text>
          <View style={styles.cultureOptions}>
            {(["chinese", "malay", "indian", "none"] as const).map(
              (cultureOption) => (
                <Pressable
                  key={cultureOption}
                  style={[
                    styles.cultureOption,
                    {
                      backgroundColor: colors.backgroundTertiary,
                      borderColor: colors.border,
                    },
                    culture === cultureOption && styles.cultureOptionSelected,
                  ]}
                  onPress={() => setCulture(cultureOption)}
                  testID={`culture-option-${cultureOption}`}
                >
                  <Text
                    style={[
                      styles.cultureOptionText,
                      { color: colors.textSecondary },
                      culture === cultureOption &&
                        styles.cultureOptionTextSelected,
                    ]}
                  >
                    {getCultureLabel(cultureOption)}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        </ScrollView>
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
  photoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  photoLabel: {
    fontSize: 12,
  },
  removePhotoButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  removePhotoText: {
    fontSize: 14,
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
  dateButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
  dobPickerContainer: {
    marginTop: 12,
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
    borderWidth: 1,
  },
  cultureOptionSelected: {
    backgroundColor: `${Primary[500]}10`,
    borderColor: Primary[500],
  },
  cultureOptionText: {
    fontSize: 14,
  },
  cultureOptionTextSelected: {
    color: Primary[500],
    fontWeight: "600",
  },
});
