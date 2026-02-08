import { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { Camera, Image as ImageIcon, Mic, Type, X } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useCreateEntry } from "@/hooks/use-entries";
import { useChildFlat } from "@/hooks/use-children";
import { useStorage } from "@/contexts/storage-context";
import { useNotifications } from "@/contexts/notification-context";
import { useRateLimit } from "@/hooks/use-rate-limit";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, SemanticColors, Spacing } from "@/constants/theme";
import { Primary } from "@/constants/design-tokens";
import { extractDateFromExif } from "@/utils/exif-date";

type EntryType = "photo" | "video" | "text" | "voice";

interface MediaAsset {
  uri: string;
  fileSize?: number;
  duration?: number;
}

export default function CreateEntryScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  
  const { child } = useChildFlat();
  const createEntry = useCreateEntry();
  const { canUpload, canUploadVideo, tier } = useStorage();
  const { recordEntryPosted } = useNotifications();
  const { canUpload: canUploadWithinRateLimit, recordUpload } = useRateLimit();
  const { uploadVideoFile } = useVideoUpload();

  const [step, setStep] = useState<"type" | "media" | "details">("type");
  const [entryType, setEntryType] = useState<EntryType | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [caption, setCaption] = useState("");
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (type: EntryType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (type === "text") {
      setEntryType(type);
      setStep("details");
      return;
    }

    if (type === "video" && tier === "free") {
      Alert.alert(
        "Video Not Available",
        "Video uploads are available on Standard and Premium plans. Upgrade to start capturing video moments!",
        [{ text: "OK" }]
      );
      return;
    }

    if ((type === "photo" || type === "video") && !canUploadWithinRateLimit) {
      Alert.alert(
        "Upload Limit Reached",
        "You've reached your upload limit. Please try again later.",
        [{ text: "OK" }]
      );
      return;
    }

    setEntryType(type);
    setStep("media");
  };

  const handleMediaSelect = async (source: "gallery" | "camera") => {
    if (!entryType) return;

    const isVideo = entryType === "video";
    const mediaType = isVideo 
      ? ImagePicker.MediaTypeOptions.Videos 
      : ImagePicker.MediaTypeOptions.Images;

    try {
      if (source === "gallery") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Please allow access to your media library.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: mediaType,
          allowsMultipleSelection: !isVideo,
          quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
          const assets: MediaAsset[] = result.assets.map(asset => ({
            uri: asset.uri,
            fileSize: asset.fileSize,
            duration: asset.duration ? asset.duration / 1000 : undefined,
          }));
          
          // Check video duration for video entries
          if (isVideo && assets[0].duration) {
            const maxDuration = tier === "standard" ? 120 : 600; // 2 min or 10 min
            if (assets[0].duration > maxDuration) {
              Alert.alert(
                "Video Too Long",
                `Your ${tier} plan allows videos up to ${maxDuration / 60} minutes.`
              );
              return;
            }
          }

          // Check storage
          const totalSize = assets.reduce((sum, a) => sum + (a.fileSize || 0), 0);
          if (!canUpload(totalSize)) {
            Alert.alert("Storage Full", "You don't have enough storage space.");
            return;
          }

          setMediaAssets(assets);
          
          // Try to extract date from EXIF for photos
          if (!isVideo && assets[0].uri) {
            try {
              const exifData = await extractDateFromExif(assets[0].uri);
              if (exifData.date) {
                setEntryDate(exifData.date);
              }
            } catch {
              // Ignore EXIF extraction errors
            }
          }
          
          setStep("details");
        }
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Please allow access to your camera.");
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: mediaType,
          quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
          setMediaAssets([{
            uri: result.assets[0].uri,
            fileSize: result.assets[0].fileSize,
            duration: result.assets[0].duration ? result.assets[0].duration / 1000 : undefined,
          }]);
          setStep("details");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select media. Please try again.");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!child?.id || !entryType) return;

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // For video uploads, handle separately
      if (entryType === "video" && mediaAssets.length > 0) {
        // Video upload would be handled here with uploadVideoFile
        // Simplified for this implementation
      }

      await createEntry.mutateAsync({
        type: entryType,
        caption: caption.trim() || undefined,
        date: entryDate.toISOString().split("T")[0],
        mediaUris: mediaAssets.map(a => a.uri),
        mediaSizes: mediaAssets.map(a => a.fileSize || 0),
        tags: tags.length > 0 ? tags : undefined,
      });

      recordEntryPosted();
      if (mediaAssets.length > 0) {
        recordUpload();
      }

      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setEntryDate(selectedDate);
    }
  };

  const renderTypeSelection = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.stepTitle}>
        What would you like to add?
      </ThemedText>
      
      <View style={styles.typeGrid}>
        <Pressable
          style={[styles.typeButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => handleTypeSelect("photo")}
        >
          <ImageIcon size={32} color={Primary[500]} />
          <ThemedText style={styles.typeLabel}>Photo</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.typeButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => handleTypeSelect("video")}
        >
          <Camera size={32} color={Primary[500]} />
          <ThemedText style={styles.typeLabel}>Video</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.typeButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => handleTypeSelect("text")}
        >
          <Type size={32} color={Primary[500]} />
          <ThemedText style={styles.typeLabel}>Text</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.typeButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => handleTypeSelect("voice")}
        >
          <Mic size={32} color={Primary[500]} />
          <ThemedText style={styles.typeLabel}>Voice</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const renderMediaSelection = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.stepTitle}>
        Choose source
      </ThemedText>

      <View style={styles.sourceButtons}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => handleMediaSelect("gallery")}
        >
          From Gallery
        </Button>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => handleMediaSelect("camera")}
        >
          Take Photo
        </Button>
      </View>

      <Button variant="ghost" onPress={() => setStep("type")}>
        Back
      </Button>
    </View>
  );

  const renderDetailsForm = () => (
    <ScrollView style={styles.detailsContainer}>
      <ThemedText type="subtitle" style={styles.stepTitle}>
        Add details
      </ThemedText>

      {/* Caption */}
      <View style={styles.field}>
        <ThemedText style={styles.label}>Caption (optional)</ThemedText>
        <TextInput
          style={[
            styles.textArea,
            {
              color: colors.text,
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a caption..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Date */}
      <View style={styles.field}>
        <ThemedText style={styles.label}>Date</ThemedText>
        <Pressable
          style={[
            styles.dateButton,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <ThemedText>
            {entryDate.toLocaleDateString("en-SG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </ThemedText>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={entryDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>

      {/* Tags */}
      <View style={styles.field}>
        <ThemedText style={styles.label}>Tags (optional)</ThemedText>
        <View style={styles.tagInputRow}>
          <TextInput
            style={[
              styles.tagInput,
              {
                color: colors.text,
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Add a tag..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleAddTag}
          />
          <Button variant="secondary" size="sm" onPress={handleAddTag}>
            Add
          </Button>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onPress={() => handleRemoveTag(tag)}
                variant="filled"
              />
            ))}
          </View>
        )}
      </View>

      {/* Media Preview */}
      {mediaAssets.length > 0 && (
        <View style={styles.field}>
          <ThemedText style={styles.label}>
            {mediaAssets.length} {mediaAssets.length === 1 ? "item" : "items"} selected
          </ThemedText>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={handleSubmit}
        >
          Post Entry
        </Button>

        <Button variant="ghost" onPress={() => setStep("type")}>
          Cancel
        </Button>
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ThemedView style={styles.content}>
        {step === "type" && renderTypeSelection()}
        {step === "media" && renderMediaSelection()}
        {step === "details" && renderDetailsForm()}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.xl,
  },
  stepTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "center",
  },
  typeButton: {
    width: "45%",
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  sourceButtons: {
    gap: Spacing.md,
  },
  detailsContainer: {
    flex: 1,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
  },
  tagInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
});
