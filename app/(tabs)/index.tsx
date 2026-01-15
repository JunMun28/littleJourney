import { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  View,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";

import { extractDateFromExif, type ExifData } from "@/utils/exif-date";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PhotoCarousel } from "@/components/photo-carousel";
import { VideoPlayer } from "@/components/video-player";
import {
  useEntries,
  type Entry,
  type EntryType,
} from "@/contexts/entry-context";
import { useChild } from "@/contexts/child-context";
import { useStorage, TIER_LIMITS } from "@/contexts/storage-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDraft } from "@/hooks/use-draft";
import { useNotifications } from "@/contexts/notification-context";
import {
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Shadows,
} from "@/constants/theme";

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyIcon}>📷</ThemedText>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No moments yet
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        Tap the + button to add your first memory
      </ThemedText>
    </View>
  );
}

interface OnThisDayCardProps {
  memories: Entry[];
  onPress: (entry: Entry) => void;
}

function OnThisDayCard({ memories, onPress }: OnThisDayCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  if (memories.length === 0) return null;

  const yearsAgo = (date: string) => {
    const entryYear = new Date(date).getFullYear();
    const currentYear = new Date().getFullYear();
    const diff = currentYear - entryYear;
    return diff === 1 ? "1 year ago" : `${diff} years ago`;
  };

  return (
    <View style={styles.onThisDayCard}>
      <View style={styles.onThisDayHeader}>
        <ThemedText style={styles.onThisDayIcon}>✨</ThemedText>
        <ThemedText type="subtitle" style={styles.onThisDayTitle}>
          On This Day
        </ThemedText>
      </View>
      <ThemedText style={styles.onThisDaySubtitle}>
        {memories.length === 1
          ? "A memory from the past"
          : `${memories.length} memories from the past`}
      </ThemedText>
      <View style={styles.onThisDayMemories}>
        {memories.slice(0, 3).map((memory) => (
          <Pressable
            key={memory.id}
            style={styles.onThisDayMemory}
            onPress={() => onPress(memory)}
          >
            {memory.mediaUris && memory.mediaUris.length > 0 ? (
              <Image
                source={{ uri: memory.mediaUris[0] }}
                style={styles.onThisDayImage}
              />
            ) : (
              <View
                style={[
                  styles.onThisDayTextPlaceholder,
                  { backgroundColor: colors.backgroundTertiary },
                ]}
              >
                <ThemedText style={styles.onThisDayPlaceholderIcon}>
                  ✏️
                </ThemedText>
              </View>
            )}
            <ThemedText style={styles.onThisDayYears}>
              {yearsAgo(memory.date)}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface EntryCardProps {
  entry: Entry;
  onPress: () => void;
}

function EntryCard({ entry, onPress }: EntryCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const formattedDate = new Date(entry.date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}
    >
      {entry.type === "photo" &&
        entry.mediaUris &&
        entry.mediaUris.length > 0 && (
          <PhotoCarousel images={entry.mediaUris} onImagePress={onPress} />
        )}
      {entry.type === "video" &&
        entry.mediaUris &&
        entry.mediaUris.length > 0 && (
          <VideoPlayer
            uri={entry.mediaUris[0]}
            onPress={onPress}
            showControls={true}
          />
        )}
      {entry.caption && (
        <ThemedText style={styles.cardCaption}>{entry.caption}</ThemedText>
      )}
      <ThemedText style={styles.cardDate}>{formattedDate}</ThemedText>
    </Pressable>
  );
}

type CreateStep = "type" | "media" | "caption";

export default function FeedScreen() {
  const { entries, addEntry, getOnThisDayEntries } = useEntries();
  const { child } = useChild();
  const { canUpload, canUploadVideo, addUsage, tier, usedBytes } = useStorage();
  const {
    recordEntryPosted,
    sendMemoriesNotification,
    sendStorageWarningNotification,
    settings,
  } = useNotifications();
  const {
    draft,
    hasDraft,
    saveDraft,
    clearDraft,
    isLoading: draftLoading,
  } = useDraft();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const onThisDayMemories = getOnThisDayEntries();

  const [refreshing, setRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("type");
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [selectedMediaSizes, setSelectedMediaSizes] = useState<number[]>([]);
  const [caption, setCaption] = useState("");
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const hasShownDraftPrompt = useRef(false);
  const hasSentMemoriesNotification = useRef(false);

  // Send "On This Day" memories notification once per session (PRD Section 4.5)
  useEffect(() => {
    if (
      !hasSentMemoriesNotification.current &&
      onThisDayMemories.length > 0 &&
      settings.memories
    ) {
      hasSentMemoriesNotification.current = true;
      sendMemoriesNotification(onThisDayMemories.length);
    }
  }, [onThisDayMemories.length, settings.memories, sendMemoriesNotification]);

  // Show draft resume prompt when draft exists (PRD Section 3.5)
  useEffect(() => {
    if (!draftLoading && hasDraft && !hasShownDraftPrompt.current) {
      hasShownDraftPrompt.current = true;
      Alert.alert(
        "Resume Draft?",
        "You have an unsaved entry. Would you like to continue where you left off?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => clearDraft(),
          },
          {
            text: "Resume",
            onPress: () => {
              if (draft) {
                setSelectedType(draft.type);
                setSelectedMedia(draft.mediaUris ?? []);
                setSelectedMediaSizes(draft.mediaSizes ?? []);
                setCaption(draft.caption);
                setEntryDate(new Date(draft.date));
                setTags(draft.tags ?? []);
                setCreateStep(draft.type ? "caption" : "type");
                setIsCreating(true);
              }
            },
          },
        ],
      );
    }
  }, [draftLoading, hasDraft, draft, clearDraft]);

  // Auto-save draft when creation state changes (PRD Section 3.5)
  useEffect(() => {
    // Only save when modal is open and we have meaningful state
    if (isCreating && selectedType) {
      saveDraft({
        type: selectedType,
        mediaUris: selectedMedia.length > 0 ? selectedMedia : undefined,
        mediaSizes:
          selectedMediaSizes.length > 0 ? selectedMediaSizes : undefined,
        caption,
        date: entryDate.toISOString().split("T")[0],
        tags: tags.length > 0 ? tags : undefined,
      });
    }
  }, [
    isCreating,
    selectedType,
    selectedMedia,
    selectedMediaSizes,
    caption,
    entryDate,
    tags,
    saveDraft,
  ]);

  const resetCreation = () => {
    setIsCreating(false);
    setCreateStep("type");
    setSelectedType(null);
    setSelectedMedia([]);
    setSelectedMediaSizes([]);
    setCaption("");
    setEntryDate(new Date());
    setShowDatePicker(false);
    setTags([]);
    setTagInput("");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay - will be replaced with TanStack Query invalidation
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleTypeSelect = async (type: EntryType) => {
    setSelectedType(type);

    if (type === "text") {
      // Skip media selection for text entries
      setCreateStep("caption");
    } else if (type === "video") {
      // Check video permission for tier first
      if (tier === "free") {
        Alert.alert(
          "Video Not Available",
          "Video uploads are available on Standard and Premium plans. Upgrade to start capturing video moments!",
          [{ text: "OK" }],
        );
        setSelectedType(null);
        return;
      }

      // Request permission and open picker
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access media library is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const video = result.assets[0];
        const duration = video.duration ? video.duration / 1000 : 0; // ms to seconds
        const fileSize = video.fileSize ?? 0;

        // Check video duration limit
        if (!canUploadVideo(duration)) {
          const maxMinutes = tier === "standard" ? 2 : 10;
          Alert.alert(
            "Video Too Long",
            `Your ${tier} plan allows videos up to ${maxMinutes} minutes. This video is ${Math.ceil(duration / 60)} minutes.`,
            [{ text: "OK" }],
          );
          return;
        }

        // Check storage limit
        if (!canUpload(fileSize)) {
          Alert.alert(
            "Storage Limit Reached",
            "You don't have enough storage space for this video. Please upgrade your plan or free up space.",
            [{ text: "OK" }],
          );
          return;
        }

        setSelectedMedia([video.uri]);
        setSelectedMediaSizes([fileSize]);
        setCreateStep("caption");
      }
    } else {
      // Photo flow
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access media library is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: true, // Request EXIF data for date extraction (PRD Section 3.4)
      });

      if (!result.canceled && result.assets.length > 0) {
        const totalSize = result.assets.reduce(
          (sum, a) => sum + (a.fileSize ?? 0),
          0,
        );

        // Check storage limit
        if (!canUpload(totalSize)) {
          Alert.alert(
            "Storage Limit Reached",
            "You don't have enough storage space for these photos. Please upgrade your plan or free up space.",
            [{ text: "OK" }],
          );
          return;
        }

        setSelectedMedia(result.assets.map((a) => a.uri));
        setSelectedMediaSizes(result.assets.map((a) => a.fileSize ?? 0));

        // Extract date from first photo's EXIF (PRD Section 3.4)
        const firstAsset = result.assets[0];
        const exifDate = extractDateFromExif(firstAsset.exif as ExifData);
        if (exifDate) {
          setEntryDate(new Date(exifDate));
        } else {
          setEntryDate(new Date());
        }

        setCreateStep("caption");
      }
    }
  };

  const handleSubmit = () => {
    if (!selectedType) return;

    // Use entryDate (may be from EXIF or user-selected)
    const dateString = entryDate.toISOString().split("T")[0];

    addEntry({
      type: selectedType,
      mediaUris: selectedMedia.length > 0 ? selectedMedia : undefined,
      caption: caption.trim() || undefined,
      date: dateString,
      tags: tags.length > 0 ? tags : undefined,
    });

    // Track storage usage for uploaded media and check for threshold warnings (PRD Section 7.1)
    if (selectedMediaSizes.length > 0) {
      const totalSize = selectedMediaSizes.reduce((sum, size) => sum + size, 0);
      const limitBytes = TIER_LIMITS[tier];
      const previousPercent = Math.round((usedBytes / limitBytes) * 100);
      const newPercent = Math.round(
        ((usedBytes + totalSize) / limitBytes) * 100,
      );

      addUsage(totalSize);

      // Check if we crossed a storage threshold (80%, 90%, 100%)
      const thresholds = [80, 90, 100];
      for (const threshold of thresholds) {
        if (previousPercent < threshold && newPercent >= threshold) {
          sendStorageWarningNotification(threshold);
          break; // Only send one notification (the first threshold crossed)
        }
      }
    }

    // Reset notification frequency to daily (PRD Section 7.3)
    recordEntryPosted();

    // Clear draft on successful post (PRD Section 3.5)
    clearDraft();
    resetCreation();
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => router.push(`/entry/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <OnThisDayCard
            memories={onThisDayMemories}
            onPress={(entry) => router.push(`/entry/${entry.id}`)}
          />
        }
        ListEmptyComponent={EmptyState}
        contentContainerStyle={
          entries.length === 0 && onThisDayMemories.length === 0
            ? styles.listEmpty
            : styles.list
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_COLOR}
            colors={[PRIMARY_COLOR]}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreating(true)}
        accessibilityLabel="Add new entry"
      >
        <ThemedText style={styles.fabIcon}>+</ThemedText>
      </TouchableOpacity>

      {/* Entry Creation Modal */}
      <Modal
        visible={isCreating}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetCreation}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Pressable onPress={resetCreation}>
              <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">New Entry</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          {createStep === "type" && (
            <View style={styles.typeSelection}>
              <ThemedText style={styles.stepTitle}>
                What would you like to add?
              </ThemedText>
              <View style={styles.typeOptions}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={() => handleTypeSelect("photo")}
                >
                  <ThemedText style={styles.typeIcon}>📷</ThemedText>
                  <ThemedText>Photo</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={() => handleTypeSelect("video")}
                >
                  <ThemedText style={styles.typeIcon}>🎬</ThemedText>
                  <ThemedText>Video</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={() => handleTypeSelect("text")}
                >
                  <ThemedText style={styles.typeIcon}>✏️</ThemedText>
                  <ThemedText>Text</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {createStep === "caption" && (
            <View style={styles.captionStep}>
              {selectedMedia.length > 0 && (
                <Image
                  source={{ uri: selectedMedia[0] }}
                  style={styles.previewImage}
                />
              )}
              <TextInput
                style={[
                  styles.captionInput,
                  {
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder={`What's ${child?.nickname || child?.name || "your little one"} up to?`}
                placeholderTextColor={colors.placeholder}
                value={caption}
                onChangeText={setCaption}
                multiline
                autoFocus={selectedType === "text"}
              />

              {/* Date picker row (PRD Section 3.4: editable date pre-filled from EXIF) */}
              <Pressable
                style={[styles.dateRow, { borderColor: colors.inputBorder }]}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText style={{ color: colors.textSecondary }}>
                  Date
                </ThemedText>
                <ThemedText>
                  {entryDate.toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </ThemedText>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={entryDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") {
                      setShowDatePicker(false);
                    }
                    if (selectedDate) {
                      setEntryDate(selectedDate);
                    }
                  }}
                />
              )}

              {/* Tags input (PRD Section 3.1, 3.2 step 6) */}
              <View style={styles.tagsSection}>
                <ThemedText style={{ color: colors.textSecondary }}>
                  Tags (optional)
                </ThemedText>
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View
                      key={`${tag}-${index}`}
                      style={[
                        styles.tag,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <ThemedText style={styles.tagText}>{tag}</ThemedText>
                      <Pressable
                        onPress={() =>
                          setTags(tags.filter((_, i) => i !== index))
                        }
                        hitSlop={8}
                      >
                        <ThemedText
                          style={[
                            styles.tagRemove,
                            { color: colors.textSecondary },
                          ]}
                        >
                          ×
                        </ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </View>
                <TextInput
                  style={[
                    styles.tagInput,
                    {
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Type a tag and press enter"
                  placeholderTextColor={colors.placeholder}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={() => {
                    const trimmed = tagInput.trim().toLowerCase();
                    if (trimmed && !tags.includes(trimmed)) {
                      setTags([...tags, trimmed]);
                    }
                    setTagInput("");
                  }}
                  returnKeyType="done"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <ThemedText style={styles.submitButtonText}>Post</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardCaption: {
    padding: 12,
    paddingBottom: 4,
  },
  cardDate: {
    padding: 12,
    paddingTop: 4,
    opacity: 0.6,
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.large,
  },
  fabIcon: {
    fontSize: 32,
    color: "#fff",
    marginTop: -2,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
  typeSelection: {
    flex: 1,
    padding: 24,
  },
  stepTitle: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
  },
  typeOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  typeOption: {
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    minWidth: 100,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  captionStep: {
    flex: 1,
    padding: 16,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  captionInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    marginRight: 4,
  },
  tagRemove: {
    fontSize: 18,
    lineHeight: 18,
  },
  tagInput: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  onThisDayCard: {
    backgroundColor: SemanticColors.goldLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  onThisDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  onThisDayIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  onThisDayTitle: {
    fontWeight: "600",
  },
  onThisDaySubtitle: {
    opacity: 0.7,
    marginBottom: 12,
  },
  onThisDayMemories: {
    flexDirection: "row",
    gap: 12,
  },
  onThisDayMemory: {
    alignItems: "center",
  },
  onThisDayImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  onThisDayTextPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  onThisDayPlaceholderIcon: {
    fontSize: 24,
  },
  onThisDayYears: {
    fontSize: 12,
    opacity: 0.7,
  },
});
