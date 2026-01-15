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
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";

import { extractDateFromExif, type ExifData } from "@/utils/exif-date";
import { useRateLimit } from "@/hooks/use-rate-limit";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { useImageAnalysis } from "@/hooks/use-image-analysis";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PhotoCarousel } from "@/components/photo-carousel";
import { VideoPlayer } from "@/components/video-player";
import { type Entry, type EntryType } from "@/contexts/entry-context";
import { useAuth } from "@/contexts/auth-context";
import { useInfiniteEntries, useCreateEntry } from "@/hooks/use-entries";
import { useChildFlat } from "@/hooks/use-children";
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
import { trackEvent, AnalyticsEvent } from "@/services/analytics";

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

function LoadingFooter({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  return (
    <View style={styles.loadingFooter}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
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
      <View style={styles.cardMeta}>
        {entry.createdByName && (
          <ThemedText
            style={[styles.cardAttribution, { color: colors.textSecondary }]}
          >
            Posted by {entry.createdByName}
          </ThemedText>
        )}
        <ThemedText style={styles.cardDate}>{formattedDate}</ThemedText>
      </View>
    </Pressable>
  );
}

type CreateStep = "type" | "source" | "caption";
type MediaSource = "gallery" | "camera";

export default function FeedScreen() {
  const { user } = useAuth();
  const {
    entries,
    getOnThisDayEntries,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteEntries({ limit: 20 });
  const createEntry = useCreateEntry();
  const { child } = useChildFlat();
  const { canUpload, canUploadVideo, addUsage, tier, usedBytes } = useStorage();
  const {
    recordEntryPosted,
    sendMemoriesNotification,
    sendStorageWarningNotification,
    sendPhotoBookBirthdayPrompt,
    settings,
  } = useNotifications();
  const {
    draft,
    hasDraft,
    saveDraft,
    clearDraft,
    isLoading: draftLoading,
  } = useDraft();
  const {
    canUpload: canUploadWithinRateLimit,
    rateLimitMessage,
    recordUpload,
  } = useRateLimit();
  const {
    uploadState: videoUploadState,
    uploadVideoFile,
    resetUploadState: resetVideoUploadState,
  } = useVideoUpload();
  const {
    isAnalyzing: isAnalyzingImages,
    labels: aiLabels,
    analyzeImages,
    reset: resetImageAnalysis,
  } = useImageAnalysis();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const onThisDayMemories = getOnThisDayEntries();

  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("type");
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [selectedMediaSizes, setSelectedMediaSizes] = useState<number[]>([]);
  const [videoDuration, setVideoDuration] = useState<number>(0); // For Cloudflare upload
  const [caption, setCaption] = useState("");
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const hasShownDraftPrompt = useRef(false);
  const hasSentMemoriesNotification = useRef(false);
  const hasSentBirthdayPrompt = useRef(false);

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

  // Check for child's first birthday and prompt photo book creation (PRD Section 10.1)
  useEffect(() => {
    if (hasSentBirthdayPrompt.current || !child?.dateOfBirth) return;

    const birthDate = new Date(child.dateOfBirth);
    const today = new Date();

    // Calculate first birthday date
    const firstBirthday = new Date(birthDate);
    firstBirthday.setFullYear(birthDate.getFullYear() + 1);

    // Check if today is the first birthday
    const isTodayFirstBirthday =
      today.getFullYear() === firstBirthday.getFullYear() &&
      today.getMonth() === firstBirthday.getMonth() &&
      today.getDate() === firstBirthday.getDate();

    if (isTodayFirstBirthday) {
      hasSentBirthdayPrompt.current = true;
      sendPhotoBookBirthdayPrompt(child.nickname || child.name);
    }
  }, [child, sendPhotoBookBirthdayPrompt]);

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
    setVideoDuration(0);
    setCaption("");
    setEntryDate(new Date());
    setShowDatePicker(false);
    setTags([]);
    setTagInput("");
    resetVideoUploadState();
    resetImageAnalysis();
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleTypeSelect = async (type: EntryType) => {
    // Check rate limit for photo/video uploads (PRD Section 13.2)
    if (type !== "text" && !canUploadWithinRateLimit) {
      Alert.alert(
        "Upload Limit Reached",
        rateLimitMessage || "Please try again later.",
        [{ text: "OK" }],
      );
      return;
    }

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
      // Go to source selection (gallery or camera)
      setCreateStep("source");
    } else {
      // Photo - go to source selection (gallery or camera)
      setCreateStep("source");
    }
  };

  const handleSourceSelect = async (source: MediaSource) => {
    if (!selectedType || selectedType === "text") return;

    if (selectedType === "video") {
      await handleVideoSource(source);
    } else {
      await handlePhotoSource(source);
    }
  };

  const handleVideoSource = async (source: MediaSource) => {
    if (source === "gallery") {
      // Request media library permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Permission to access media library is required.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        await processVideoAsset(result.assets[0]);
      }
    } else {
      // Camera capture
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Permission to access camera is required.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        await processVideoAsset(result.assets[0]);
      }
    }
  };

  const processVideoAsset = async (video: ImagePicker.ImagePickerAsset) => {
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
    setVideoDuration(duration); // Store for Cloudflare upload
    setCreateStep("caption");
  };

  const handlePhotoSource = async (source: MediaSource) => {
    if (source === "gallery") {
      // Request media library permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Permission to access media library is required.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: true, // Request EXIF data for date extraction (PRD Section 3.4)
      });

      if (!result.canceled && result.assets.length > 0) {
        await processPhotoAssets(result.assets);
      }
    } else {
      // Camera capture
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Permission to access camera is required.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        await processPhotoAssets(result.assets);
      }
    }
  };

  const processPhotoAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const totalSize = assets.reduce((sum, a) => sum + (a.fileSize ?? 0), 0);

    // Check storage limit
    if (!canUpload(totalSize)) {
      Alert.alert(
        "Storage Limit Reached",
        "You don't have enough storage space for these photos. Please upgrade your plan or free up space.",
        [{ text: "OK" }],
      );
      return;
    }

    const imageUris = assets.map((a) => a.uri);
    setSelectedMedia(imageUris);
    setSelectedMediaSizes(assets.map((a) => a.fileSize ?? 0));

    // Extract date from first photo's EXIF (PRD Section 3.4)
    const firstAsset = assets[0];
    const exifDate = extractDateFromExif(firstAsset.exif as ExifData);
    if (exifDate) {
      setEntryDate(new Date(exifDate));
    } else {
      setEntryDate(new Date());
    }

    // Analyze images for AI labels (SEARCH-002)
    // This runs async in the background while user writes caption
    analyzeImages(imageUris);

    setCreateStep("caption");
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    // Use entryDate (may be from EXIF or user-selected)
    const dateString = entryDate.toISOString().split("T")[0];

    // For video entries, upload to Cloudflare Stream first (VIDEO-001)
    let mediaUrisToSave = selectedMedia;
    let thumbnailUrl: string | undefined;

    if (selectedType === "video" && selectedMedia.length > 0) {
      const uploadResult = await uploadVideoFile(
        selectedMedia[0],
        videoDuration,
        {
          childId: child?.id || "",
          date: dateString,
        },
      );

      if (!uploadResult) {
        // Upload failed - error state is already set by useVideoUpload
        Alert.alert(
          "Upload Failed",
          videoUploadState.error || "Failed to upload video. Please try again.",
          [{ text: "OK" }],
        );
        return;
      }

      // Use Cloudflare Stream URL instead of local file URI
      mediaUrisToSave = [uploadResult.streamUrl];
      thumbnailUrl = uploadResult.thumbnailUrl;
    }

    createEntry.mutate(
      {
        type: selectedType,
        mediaUris: mediaUrisToSave.length > 0 ? mediaUrisToSave : undefined,
        thumbnailUrl, // Store Cloudflare thumbnail URL (VIDEO-002)
        caption: caption.trim() || undefined,
        date: dateString,
        tags: tags.length > 0 ? tags : undefined,
        aiLabels: aiLabels.length > 0 ? aiLabels : undefined, // AI labels for semantic search (SEARCH-002)
        createdBy: user?.id,
        createdByName: user?.name || user?.email?.split("@")[0], // Fallback to email prefix
      },
      {
        onSuccess: () => {
          // Track storage usage for uploaded media and check for threshold warnings (PRD Section 7.1)
          if (selectedMediaSizes.length > 0) {
            const totalSize = selectedMediaSizes.reduce(
              (sum, size) => sum + size,
              0,
            );
            const limitBytes = TIER_LIMITS[tier];
            const previousPercent = Math.round((usedBytes / limitBytes) * 100);
            const newPercent = Math.round(
              ((usedBytes + totalSize) / limitBytes) * 100,
            );

            addUsage(totalSize);

            // Record upload for rate limiting (PRD Section 13.2)
            recordUpload();

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

          // Track entry creation (PRD Section 18 - ANALYTICS-001)
          trackEvent(AnalyticsEvent.ENTRY_CREATED, {
            type: selectedType,
            hasCaption: caption.trim().length > 0,
            hasMedia: selectedMedia.length > 0,
            tagCount: tags.length,
          });

          // Clear draft on successful post (PRD Section 3.5)
          clearDraft();
          resetCreation();
        },
      },
    );
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
        ListFooterComponent={<LoadingFooter isLoading={isFetchingNextPage} />}
        contentContainerStyle={
          entries.length === 0 && onThisDayMemories.length === 0
            ? styles.listEmpty
            : styles.list
        }
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
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

          {createStep === "source" && (
            <View style={styles.typeSelection}>
              <ThemedText style={styles.stepTitle}>
                {selectedType === "photo"
                  ? "Choose photo source"
                  : "Choose video source"}
              </ThemedText>
              <View style={styles.sourceOptions}>
                <TouchableOpacity
                  style={[
                    styles.sourceOption,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={() => handleSourceSelect("gallery")}
                >
                  <ThemedText style={styles.typeIcon}>🖼️</ThemedText>
                  <ThemedText type="defaultSemiBold">Gallery</ThemedText>
                  <ThemedText
                    style={[styles.sourceHint, { color: colors.textMuted }]}
                  >
                    Choose from library
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sourceOption,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={() => handleSourceSelect("camera")}
                >
                  <ThemedText style={styles.typeIcon}>📸</ThemedText>
                  <ThemedText type="defaultSemiBold">Camera</ThemedText>
                  <ThemedText
                    style={[styles.sourceHint, { color: colors.textMuted }]}
                  >
                    Take a new {selectedType}
                  </ThemedText>
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

              {/* AI image analysis indicator (SEARCH-002) */}
              {isAnalyzingImages && selectedType === "photo" && (
                <View style={styles.aiAnalysisIndicator}>
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  <ThemedText
                    style={[
                      styles.aiAnalysisText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Analyzing photo content...
                  </ThemedText>
                </View>
              )}

              {/* Video upload progress indicator (VIDEO-001) */}
              {videoUploadState.isUploading && (
                <View style={styles.uploadProgressContainer}>
                  <View style={styles.uploadProgressBar}>
                    <View
                      style={[
                        styles.uploadProgressFill,
                        { width: `${videoUploadState.progress}%` },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.uploadProgressText}>
                    Uploading video... {videoUploadState.progress}%
                  </ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  videoUploadState.isUploading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={videoUploadState.isUploading}
              >
                {videoUploadState.isUploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>Post</ThemedText>
                )}
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
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
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
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
  },
  cardAttribution: {
    fontSize: 12,
  },
  cardDate: {
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
  sourceOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 16,
  },
  sourceOption: {
    flex: 1,
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
  },
  sourceHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  uploadProgressContainer: {
    marginBottom: 16,
  },
  uploadProgressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  uploadProgressFill: {
    height: "100%",
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 4,
  },
  uploadProgressText: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.8,
  },
  aiAnalysisIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  aiAnalysisText: {
    marginLeft: 8,
    fontSize: 14,
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
