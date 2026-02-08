import { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
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
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import Animated, {
  FadeInDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { Flame, Target, Sparkles, Calendar, Camera } from "lucide-react-native";

import { extractDateFromExif, type ExifData } from "@/utils/exif-date";
import { useRateLimit } from "@/hooks/use-rate-limit";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { useImageAnalysis } from "@/hooks/use-image-analysis";
import { useMilestoneDetection } from "@/hooks/use-milestone-detection";
import { cardPressIn, cardPressOut, Entering } from "@/utils/animations";
import {
  Primary,
  Secondary,
  Spacing,
  Radius,
  Shadows,
} from "@/constants/design-tokens";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PhotoCarousel } from "@/components/photo-carousel";
import { VideoPlayer } from "@/components/video-player";
import { FAB } from "@/components/ui/fab";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type Entry,
  type EntryType,
  type AiMilestoneSuggestion,
} from "@/contexts/entry-context";
import { useAuth } from "@/contexts/auth-context";
import { useInfiniteEntries, useCreateEntry } from "@/hooks/use-entries";
import { useChildFlat } from "@/hooks/use-children";
import { useStorage, TIER_LIMITS } from "@/contexts/storage-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDraft } from "@/hooks/use-draft";
import { useNotifications } from "@/contexts/notification-context";
import { useOnThisDay, type Memory } from "@/contexts/on-this-day-context";
import { PRIMARY_COLOR, Colors, SemanticColors } from "@/constants/theme";
import { trackEvent, AnalyticsEvent } from "@/services/analytics";
import { useVoiceJournal } from "@/contexts/voice-journal-context";
import { useGamification } from "@/contexts/gamification-context";

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Camera size={64} color={Primary[300]} style={styles.emptyIcon} />
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No moments yet
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        Tap the + button to add your first memory
      </ThemedText>
    </View>
  );
}

// UI-015: Feed header with greeting, child name/age, and avatar
interface FeedHeaderProps {
  childName?: string;
  childAge?: string;
  onAvatarPress?: () => void;
}

function FeedHeader({ childName, childAge, onAvatarPress }: FeedHeaderProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(0).springify()}
      style={styles.feedHeader}
    >
      <View style={styles.feedHeaderContent}>
        <View style={styles.feedHeaderText}>
          <ThemedText
            style={[styles.feedGreeting, { color: colors.textSecondary }]}
          >
            {getGreeting()}
          </ThemedText>
          {childName && (
            <ThemedText type="title" style={styles.feedChildName}>
              {childName}
              {childAge && (
                <ThemedText
                  style={[styles.feedChildAge, { color: colors.textSecondary }]}
                >
                  {" "}
                  • {childAge}
                </ThemedText>
              )}
            </ThemedText>
          )}
        </View>
        {childName && (
          <Pressable onPress={onAvatarPress} hitSlop={8}>
            <Avatar name={childName} size="lg" />
          </Pressable>
        )}
      </View>
    </Animated.View>
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

// Helper: Calculate child's age from date of birth
function getChildAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  if (years >= 2) {
    return `${years} years old`;
  } else if (years === 1) {
    return months > 0 ? `${years}y ${months}m` : "1 year old";
  } else {
    return `${months} month${months !== 1 ? "s" : ""} old`;
  }
}

interface OnThisDayCardProps {
  memories: Memory[];
  onPress: (memory: Memory) => void;
  onDismiss: (memoryId: string) => void;
}

function OnThisDayCard({ memories, onPress, onDismiss }: OnThisDayCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();
  const { getMemoriesByYear } = useOnThisDay();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  if (memories.length === 0) return null;

  const yearsAgoText = (yearsAgo: number) => {
    return yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`;
  };

  // Group memories by year (OTD-003)
  const memoryGroups = getMemoriesByYear();
  const hasMultipleYears = memoryGroups.length > 1;

  // If no year selected, default to most recent year
  const activeYear = selectedYear ?? memoryGroups[0]?.year ?? null;
  const activeGroup = memoryGroups.find((g) => g.year === activeYear);
  const activeMemories = activeGroup?.memories ?? memories;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(2)}
      style={styles.onThisDayCardOuter}
      testID="on-this-day-card"
    >
      <LinearGradient
        colors={[Primary[100], Secondary[100], "#FFF5E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.onThisDayCard}
      >
        <View style={styles.onThisDayHeader}>
          <View style={styles.onThisDayTitleRow}>
            <View style={styles.onThisDayIconContainer}>
              <Sparkles size={20} color={Primary[500]} />
            </View>
            <ThemedText type="subtitle" style={styles.onThisDayTitle}>
              On This Day
            </ThemedText>
          </View>
          <Pressable
            testID="dismiss-all-memories"
            style={styles.onThisDayDismiss}
            onPress={() => memories.forEach((m) => onDismiss(m.id))}
            hitSlop={12}
          >
            <ThemedText
              style={[styles.onThisDayDismissText, { color: colors.textMuted }]}
            >
              Dismiss
            </ThemedText>
          </Pressable>
        </View>

        {/* Year tabs for multi-year memories (OTD-003) */}
        {hasMultipleYears && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.yearTabsContainer}
            contentContainerStyle={styles.yearTabsContent}
            testID="year-tabs"
          >
            {memoryGroups.map((group) => {
              const isActive = group.year === activeYear;
              return (
                <Pressable
                  key={group.year}
                  onPress={() => setSelectedYear(group.year)}
                  style={[
                    styles.yearTab,
                    isActive && styles.yearTabActive,
                    {
                      backgroundColor: isActive
                        ? PRIMARY_COLOR
                        : colors.backgroundSecondary,
                    },
                  ]}
                  testID={`year-tab-${group.year}`}
                >
                  <ThemedText
                    style={[
                      styles.yearTabText,
                      isActive && styles.yearTabTextActive,
                    ]}
                  >
                    {yearsAgoText(group.yearsAgo)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <ThemedText style={styles.onThisDaySubtitle}>
          {hasMultipleYears
            ? `${activeMemories.length} ${activeMemories.length === 1 ? "memory" : "memories"} from ${activeGroup?.yearsAgo ?? 1} ${activeGroup?.yearsAgo === 1 ? "year" : "years"} ago`
            : memories.length === 1
              ? "A memory from the past"
              : `${memories.length} memories from the past`}
        </ThemedText>
        <View style={styles.onThisDayMemories}>
          {activeMemories.slice(0, 3).map((memory) => (
            <Pressable
              key={memory.id}
              style={styles.onThisDayMemory}
              onPress={() => onPress(memory)}
              testID={`memory-item-${memory.id}`}
            >
              {memory.entry.mediaUris && memory.entry.mediaUris.length > 0 ? (
                <Image
                  source={{ uri: memory.entry.mediaUris[0] }}
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
              {!hasMultipleYears && (
                <ThemedText style={styles.onThisDayYears}>
                  {yearsAgoText(memory.yearsAgo)}
                </ThemedText>
              )}
            </Pressable>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// GAME-003: Monthly Goal Card Component
interface MonthlyGoalCardProps {
  currentCount: number;
  goalCount: number;
  isGoalMet: boolean;
  progressPercent: number;
  monthName: string;
}

function MonthlyGoalCard({
  currentCount,
  goalCount,
  isGoalMet,
  progressPercent,
  monthName,
}: MonthlyGoalCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  // Show card always to encourage engagement
  const statusText = isGoalMet
    ? "Goal reached!"
    : `${currentCount} of ${goalCount} entries`;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(1)}
      style={[
        styles.monthlyGoalCard,
        { backgroundColor: colors.backgroundSecondary },
        isGoalMet && styles.monthlyGoalCardComplete,
        Shadows.sm,
      ]}
      testID="monthly-goal-card"
    >
      <View style={styles.monthlyGoalHeader}>
        <View
          style={[
            styles.monthlyGoalIconContainer,
            {
              backgroundColor: isGoalMet
                ? SemanticColors.successLight
                : Primary[100],
            },
          ]}
        >
          {isGoalMet ? (
            <Sparkles size={24} color={SemanticColors.success} />
          ) : (
            <Target size={24} color={Primary[500]} />
          )}
        </View>
        <View style={styles.monthlyGoalInfo}>
          <ThemedText type="subtitle" style={styles.monthlyGoalTitle}>
            {monthName} Goal
          </ThemedText>
          <ThemedText
            style={[styles.monthlyGoalStatus, { color: colors.textSecondary }]}
          >
            {statusText}
          </ThemedText>
        </View>
      </View>
      <View style={styles.monthlyGoalProgressContainer}>
        <ProgressBar
          value={progressPercent}
          successOnComplete
          size="md"
          style={styles.monthlyGoalProgressBarNew}
          testID="monthly-goal-progress"
        />
        <ThemedText
          style={[styles.monthlyGoalPercent, { color: colors.textSecondary }]}
        >
          {progressPercent}%
        </ThemedText>
      </View>
      {isGoalMet && (
        <ThemedText
          style={[
            styles.monthlyGoalCelebration,
            { color: SemanticColors.success },
          ]}
        >
          🏆 Badge unlocked!
        </ThemedText>
      )}
    </Animated.View>
  );
}

// GAME-002: Streak Card Component
interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  // Don't show if no streak yet
  if (currentStreak === 0 && longestStreak === 0) return null;

  const isOnFire = currentStreak >= 7;
  const hasStreak = currentStreak > 0;
  const streakLabel =
    currentStreak === 0
      ? "Start your streak today!"
      : currentStreak === 1
        ? "1 day streak"
        : `${currentStreak} day streak`;

  // Flame color based on streak length
  const flameColor = isOnFire
    ? "#FF6B35"
    : hasStreak
      ? Primary[500]
      : colors.textMuted;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(0)}
      style={[
        styles.streakCard,
        { backgroundColor: colors.backgroundSecondary },
        Shadows.sm,
      ]}
      testID="streak-card"
    >
      <View style={styles.streakMain}>
        <View
          style={[
            styles.streakIconContainer,
            {
              backgroundColor: isOnFire
                ? "#FFF0E6"
                : hasStreak
                  ? Primary[100]
                  : colors.backgroundTertiary,
            },
          ]}
        >
          <Flame
            size={28}
            color={flameColor}
            fill={isOnFire ? "#FF6B35" : undefined}
          />
        </View>
        <View style={styles.streakInfo}>
          <ThemedText type="subtitle" style={styles.streakLabel}>
            {streakLabel}
          </ThemedText>
          {longestStreak > 0 && (
            <ThemedText
              style={[styles.streakBest, { color: colors.textSecondary }]}
            >
              Best: {longestStreak} {longestStreak === 1 ? "day" : "days"}
            </ThemedText>
          )}
        </View>
      </View>
      {currentStreak === 0 && longestStreak > 0 && (
        <ThemedText
          style={[styles.streakEncourage, { color: colors.textSecondary }]}
        >
          Add an entry to start a new streak!
        </ThemedText>
      )}
    </Animated.View>
  );
}

interface EntryCardProps {
  entry: Entry;
  onPress: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function EntryCard({ entry, onPress, index = 0 }: EntryCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const formattedDate = new Date(entry.date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Get relative date (UI-012: "3 days ago" format)
  const getRelativeDate = () => {
    const now = new Date();
    const entryDate = new Date(entry.date);
    const diffTime = Math.abs(now.getTime() - entryDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
    return formattedDate;
  };

  const handlePressIn = useCallback(() => {
    scale.value = cardPressIn();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = cardPressOut();
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get AI tags to display (UI-012)
  const aiTags = entry.aiLabels?.slice(0, 3) || [];
  const hasMedia = entry.mediaUris && entry.mediaUris.length > 0;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : Entering.listItem(index + 3)}
      layout={Layout.springify()}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          { backgroundColor: colors.backgroundSecondary },
          Shadows.sm,
          animatedStyle,
        ]}
      >
        {/* Photo with gradient overlay (UI-012) */}
        {entry.type === "photo" && hasMedia && (
          <View style={styles.cardMediaContainer}>
            <PhotoCarousel images={entry.mediaUris!} onImagePress={onPress} />
            {/* Gradient overlay for text legibility */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.3)"]}
              style={styles.cardGradientOverlay}
              pointerEvents="none"
            />
          </View>
        )}
        {entry.type === "video" && hasMedia && (
          <VideoPlayer
            uri={entry.mediaUris![0]}
            onPress={onPress}
            showControls={true}
          />
        )}

        {/* AI Tags as Chips (UI-012) */}
        {aiTags.length > 0 && (
          <View style={styles.cardAiTags}>
            {aiTags.map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </View>
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
          <View style={styles.cardDateContainer}>
            <Calendar
              size={12}
              color={colors.textMuted}
              style={styles.cardDateIcon}
            />
            <ThemedText
              style={[styles.cardDate, { color: colors.textSecondary }]}
            >
              {getRelativeDate()}
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

type CreateStep = "type" | "source" | "caption" | "voice";
type MediaSource = "gallery" | "camera";

export default function FeedScreen() {
  const { user } = useAuth();
  const {
    entries,
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
    sendStorageWarningNotification,
    sendPhotoBookBirthdayPrompt,
    settings,
  } = useNotifications();
  const {
    memories: onThisDayMemories,
    dismissMemory,
    sendMemoriesNotificationIfNeeded,
    notificationSentToday,
  } = useOnThisDay();
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
  // AI Milestone Detection (AIDETECT-001)
  const {
    isDetecting: isDetectingMilestones,
    suggestions: milestoneSuggestions,
    detectMilestones,
    dismissSuggestion: dismissMilestoneSuggestion,
    reset: resetMilestoneDetection,
  } = useMilestoneDetection();
  // Voice recording (VOICE-001)
  const {
    isRecording,
    currentRecording,
    permissionDenied: voicePermissionDenied,
    startRecording,
    stopRecording,
    discardRecording,
    // Transcription (VOICE-002)
    transcriptionState,
    transcribeRecording,
    clearTranscriptionError,
  } = useVoiceJournal();
  // Gamification: streak and monthly goal (GAME-002, GAME-003)
  const { streakData, monthlyGoalData } = useGamification();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

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
  // Voice recording state (VOICE-001)
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState<number>(0);
  // Voice transcription state (VOICE-002)
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [hasTranscribed, setHasTranscribed] = useState(false);
  // Voice photo attachment state (VOICE-003)
  const [voicePhotoUris, setVoicePhotoUris] = useState<string[]>([]);
  const [voicePhotoSizes, setVoicePhotoSizes] = useState<number[]>([]);
  const hasShownDraftPrompt = useRef(false);
  const hasSentMemoriesNotification = useRef(false);
  const hasSentBirthdayPrompt = useRef(false);

  // OTD-001: Send "On This Day" memories notification once per session
  useEffect(() => {
    if (
      !hasSentMemoriesNotification.current &&
      !notificationSentToday &&
      onThisDayMemories.length > 0 &&
      settings.memories
    ) {
      hasSentMemoriesNotification.current = true;
      sendMemoriesNotificationIfNeeded();
    }
  }, [
    onThisDayMemories.length,
    settings.memories,
    notificationSentToday,
    sendMemoriesNotificationIfNeeded,
  ]);

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
    // Reset voice state (VOICE-001)
    setVoiceUri(null);
    setVoiceDuration(0);
    // Reset voice transcription state (VOICE-002)
    setVoiceTranscript("");
    setHasTranscribed(false);
    clearTranscriptionError();
    // Reset voice photo state (VOICE-003)
    setVoicePhotoUris([]);
    setVoicePhotoSizes([]);
    discardRecording();
    resetVideoUploadState();
    resetImageAnalysis();
    resetMilestoneDetection();
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleTypeSelect = async (type: EntryType) => {
    // Check rate limit for photo/video uploads (PRD Section 13.2)
    // Voice entries don't count toward media upload limits
    if (type !== "text" && type !== "voice" && !canUploadWithinRateLimit) {
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
    } else if (type === "voice") {
      // Go to voice recording step (VOICE-001)
      setCreateStep("voice");
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

    // Detect potential milestones from images (AIDETECT-001)
    // Runs in parallel with image analysis
    detectMilestones(imageUris);

    setCreateStep("caption");
  };

  // Voice recording handlers (VOICE-001)
  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopRecording = async () => {
    const recording = await stopRecording();
    if (recording) {
      setVoiceUri(recording.uri);
      setVoiceDuration(recording.duration);
      setCreateStep("caption");

      // Auto-transcribe voice recording (VOICE-002)
      // Transcription happens in background while user adds caption
      transcribeRecording(recording.uri).then((transcript) => {
        if (transcript) {
          setVoiceTranscript(transcript);
          setHasTranscribed(true);
        }
      });
    }
  };

  // Voice photo attachment handler (VOICE-003)
  const handleVoicePhotoAttach = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
          "You don't have enough storage space for these photos.",
          [{ text: "OK" }],
        );
        return;
      }

      setVoicePhotoUris(result.assets.map((a) => a.uri));
      setVoicePhotoSizes(result.assets.map((a) => a.fileSize ?? 0));
    }
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

    // For voice entries, use voicePhotoUris as mediaUris (VOICE-003)
    if (selectedType === "voice" && voicePhotoUris.length > 0) {
      mediaUrisToSave = voicePhotoUris;
    }

    // Convert milestone suggestions to entry format (AIDETECT-001)
    const aiMilestoneSuggestions: AiMilestoneSuggestion[] | undefined =
      milestoneSuggestions.length > 0
        ? milestoneSuggestions.map((s) => ({
            templateId: s.templateId,
            title: s.template.title,
            confidence: s.confidence,
            status: "pending" as const,
            matchedLabels: s.matchedLabels,
          }))
        : undefined;

    createEntry.mutate(
      {
        type: selectedType,
        mediaUris: mediaUrisToSave.length > 0 ? mediaUrisToSave : undefined,
        thumbnailUrl, // Store Cloudflare thumbnail URL (VIDEO-002)
        caption: caption.trim() || undefined,
        date: dateString,
        tags: tags.length > 0 ? tags : undefined,
        aiLabels: aiLabels.length > 0 ? aiLabels : undefined, // AI labels for semantic search (SEARCH-002)
        aiMilestoneSuggestions, // AI-detected milestone suggestions (AIDETECT-001)
        // Voice entry fields (VOICE-001)
        audioUri: voiceUri || undefined,
        audioDuration: voiceDuration > 0 ? voiceDuration : undefined,
        // Voice transcription (VOICE-002)
        transcript: voiceTranscript.trim() || undefined,
        createdBy: user?.id,
        createdByName: user?.name || user?.email?.split("@")[0], // Fallback to email prefix
      },
      {
        onSuccess: () => {
          // Track storage usage for uploaded media and check for threshold warnings (PRD Section 7.1)
          // Include voice photo sizes for voice entries (VOICE-003)
          const mediaSizesToTrack =
            selectedType === "voice" && voicePhotoSizes.length > 0
              ? voicePhotoSizes
              : selectedMediaSizes;

          if (mediaSizesToTrack.length > 0) {
            const totalSize = mediaSizesToTrack.reduce(
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
            hasMedia: mediaUrisToSave.length > 0,
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
      <FlashList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <EntryCard
            entry={item}
            onPress={() => router.push(`/entry/${item.id}`)}
            index={index}
          />
        )}
        ListHeaderComponent={
          <>
            <FeedHeader
              childName={child?.nickname || child?.name}
              childAge={
                child?.dateOfBirth ? getChildAge(child.dateOfBirth) : undefined
              }
              onAvatarPress={() => router.push("./profile")}
            />
            <StreakCard
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
            />
            <MonthlyGoalCard
              currentCount={monthlyGoalData.currentCount}
              goalCount={monthlyGoalData.goalCount}
              isGoalMet={monthlyGoalData.isGoalMet}
              progressPercent={monthlyGoalData.progressPercent}
              monthName={monthlyGoalData.monthName}
            />
            <OnThisDayCard
              memories={onThisDayMemories}
              onPress={(memory) => router.push(`/memory/${memory.id}`)}
              onDismiss={dismissMemory}
            />
          </>
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
      <FAB
        onPress={() => router.push("./create-entry")}
        accessibilityLabel="Add new entry"
        testID="add-entry-fab"
      />

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
              <View style={styles.typeOptionsGrid}>
                <Card
                  variant="outlined"
                  onPress={() => handleTypeSelect("photo")}
                  style={styles.typeOptionCard}
                  padding="md"
                >
                  <View style={styles.typeOptionContent}>
                    <ThemedText style={styles.typeIcon}>📷</ThemedText>
                    <ThemedText type="defaultSemiBold">Photo</ThemedText>
                    <ThemedText
                      style={[
                        styles.typeOptionHint,
                        { color: colors.textMuted },
                      ]}
                    >
                      Capture moments
                    </ThemedText>
                  </View>
                </Card>
                <Card
                  variant="outlined"
                  onPress={() => handleTypeSelect("video")}
                  style={styles.typeOptionCard}
                  padding="md"
                >
                  <View style={styles.typeOptionContent}>
                    <ThemedText style={styles.typeIcon}>🎬</ThemedText>
                    <ThemedText type="defaultSemiBold">Video</ThemedText>
                    <ThemedText
                      style={[
                        styles.typeOptionHint,
                        { color: colors.textMuted },
                      ]}
                    >
                      Record memories
                    </ThemedText>
                  </View>
                </Card>
                <Card
                  variant="outlined"
                  onPress={() => handleTypeSelect("text")}
                  style={styles.typeOptionCard}
                  padding="md"
                >
                  <View style={styles.typeOptionContent}>
                    <ThemedText style={styles.typeIcon}>✏️</ThemedText>
                    <ThemedText type="defaultSemiBold">Text</ThemedText>
                    <ThemedText
                      style={[
                        styles.typeOptionHint,
                        { color: colors.textMuted },
                      ]}
                    >
                      Write a note
                    </ThemedText>
                  </View>
                </Card>
                <Card
                  variant="outlined"
                  onPress={() => handleTypeSelect("voice")}
                  style={styles.typeOptionCard}
                  padding="md"
                  testID="voice-type-option"
                >
                  <View style={styles.typeOptionContent}>
                    <ThemedText style={styles.typeIcon}>🎙️</ThemedText>
                    <ThemedText type="defaultSemiBold">Voice</ThemedText>
                    <ThemedText
                      style={[
                        styles.typeOptionHint,
                        { color: colors.textMuted },
                      ]}
                    >
                      Voice note
                    </ThemedText>
                  </View>
                </Card>
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
              <View style={styles.sourceOptionsRow}>
                <Card
                  variant="outlined"
                  onPress={() => handleSourceSelect("gallery")}
                  style={styles.sourceOptionCard}
                  padding="lg"
                >
                  <View style={styles.typeOptionContent}>
                    <ThemedText style={styles.typeIcon}>🖼️</ThemedText>
                    <ThemedText type="defaultSemiBold">Gallery</ThemedText>
                    <ThemedText
                      style={[
                        styles.typeOptionHint,
                        { color: colors.textMuted },
                      ]}
                    >
                      Choose from library
                    </ThemedText>
                  </View>
                </Card>
                <Card
                  variant="outlined"
                  onPress={() => handleSourceSelect("camera")}
                  style={styles.sourceOptionCard}
                  padding="lg"
                >
                  <View style={styles.typeOptionContent}>
                    <ThemedText style={styles.typeIcon}>📸</ThemedText>
                    <ThemedText type="defaultSemiBold">Camera</ThemedText>
                    <ThemedText
                      style={[
                        styles.typeOptionHint,
                        { color: colors.textMuted },
                      ]}
                    >
                      Take a new {selectedType}
                    </ThemedText>
                  </View>
                </Card>
              </View>
            </View>
          )}

          {/* Voice recording step (VOICE-001) */}
          {createStep === "voice" && (
            <View
              style={styles.voiceRecordingStep}
              testID="voice-recording-step"
            >
              <ThemedText style={styles.stepTitle}>
                {isRecording ? "Recording..." : "Tap to start recording"}
              </ThemedText>

              {voicePermissionDenied && (
                <View style={styles.permissionError}>
                  <ThemedText style={styles.permissionErrorText}>
                    Microphone permission is required. Please enable it in
                    Settings.
                  </ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                ]}
                onPress={
                  isRecording ? handleStopRecording : handleStartRecording
                }
                testID="record-button"
              >
                <ThemedText style={styles.recordButtonIcon}>
                  {isRecording ? "⏹️" : "🎙️"}
                </ThemedText>
              </TouchableOpacity>

              {isRecording && (
                <ThemedText
                  style={[styles.recordingHint, { color: colors.textMuted }]}
                >
                  Tap to stop recording
                </ThemedText>
              )}

              {currentRecording && !isRecording && (
                <View style={styles.recordingPreview}>
                  <ThemedText style={styles.recordingDuration}>
                    Duration: {Math.round(currentRecording.duration / 1000)}s
                  </ThemedText>
                  <Button
                    variant="primary"
                    onPress={() => {
                      setVoiceUri(currentRecording.uri);
                      setVoiceDuration(currentRecording.duration);
                      setCreateStep("caption");
                    }}
                    testID="use-recording-button"
                  >
                    Use This Recording
                  </Button>
                </View>
              )}

              {/* Photo attachment section (VOICE-003) */}
              <View style={styles.voicePhotoSection}>
                <ThemedText
                  style={[styles.voicePhotoLabel, { color: colors.textMuted }]}
                >
                  Attach Photos (Optional)
                </ThemedText>

                {voicePhotoUris.length > 0 ? (
                  <View style={styles.voicePhotoPreviewContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.voicePhotoPreviewScroll}
                    >
                      {voicePhotoUris.map((uri, index) => (
                        <View key={uri} style={styles.voicePhotoPreviewItem}>
                          <Image
                            source={{ uri }}
                            style={styles.voicePhotoPreviewImage}
                          />
                          <Pressable
                            style={styles.voicePhotoRemove}
                            onPress={() => {
                              setVoicePhotoUris(
                                voicePhotoUris.filter((_, i) => i !== index),
                              );
                              setVoicePhotoSizes(
                                voicePhotoSizes.filter((_, i) => i !== index),
                              );
                            }}
                            hitSlop={8}
                            testID={`remove-voice-photo-${index}`}
                          >
                            <ThemedText style={styles.voicePhotoRemoveText}>
                              ×
                            </ThemedText>
                          </Pressable>
                        </View>
                      ))}
                    </ScrollView>
                    <Pressable
                      style={[
                        styles.addMorePhotosButton,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                      onPress={handleVoicePhotoAttach}
                      testID="add-more-voice-photos"
                    >
                      <ThemedText style={styles.addMorePhotosText}>
                        + Add More
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <Button
                    variant="secondary"
                    onPress={handleVoicePhotoAttach}
                    testID="attach-voice-photo-button"
                    leftIcon={
                      <ThemedText style={styles.attachPhotoIcon}>📷</ThemedText>
                    }
                  >
                    Attach Photo
                  </Button>
                )}
              </View>
            </View>
          )}

          {createStep === "caption" && (
            <View style={styles.captionStep}>
              {/* Voice recording preview (VOICE-001) */}
              {selectedType === "voice" && voiceUri && (
                <View
                  style={[
                    styles.voicePreview,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  testID="voice-preview"
                >
                  <ThemedText style={styles.voicePreviewIcon}>🎙️</ThemedText>
                  <ThemedText style={styles.voicePreviewText}>
                    Voice Note ({Math.round(voiceDuration / 1000)}s)
                  </ThemedText>
                </View>
              )}

              {/* Voice transcription section (VOICE-002) */}
              {selectedType === "voice" && voiceUri && (
                <View
                  style={styles.transcriptionSection}
                  testID="transcription-section"
                >
                  <View style={styles.transcriptionHeader}>
                    <ThemedText
                      style={[
                        styles.transcriptionLabel,
                        { color: colors.textMuted },
                      ]}
                    >
                      Transcript
                    </ThemedText>
                    {transcriptionState.isTranscribing && (
                      <ThemedText
                        style={[
                          styles.transcriptionStatus,
                          { color: PRIMARY_COLOR },
                        ]}
                        testID="transcription-loading"
                      >
                        Transcribing...
                      </ThemedText>
                    )}
                    {hasTranscribed && !transcriptionState.isTranscribing && (
                      <ThemedText
                        style={[
                          styles.transcriptionStatus,
                          { color: SemanticColors.success },
                        ]}
                        testID="transcription-complete"
                      >
                        ✓ Complete
                      </ThemedText>
                    )}
                  </View>
                  {transcriptionState.transcriptionError && (
                    <ThemedText
                      style={[
                        styles.transcriptionError,
                        { color: SemanticColors.error },
                      ]}
                      testID="transcription-error"
                    >
                      {transcriptionState.transcriptionError}
                    </ThemedText>
                  )}
                  <TextInput
                    style={[
                      styles.transcriptInput,
                      {
                        borderColor: colors.inputBorder,
                        color: colors.text,
                        backgroundColor: colors.backgroundSecondary,
                      },
                    ]}
                    placeholder={
                      transcriptionState.isTranscribing
                        ? "Transcribing audio..."
                        : "Edit transcript here..."
                    }
                    placeholderTextColor={colors.placeholder}
                    value={voiceTranscript}
                    onChangeText={setVoiceTranscript}
                    multiline
                    editable={!transcriptionState.isTranscribing}
                    testID="transcript-input"
                  />
                  <ThemedText
                    style={[
                      styles.transcriptionHint,
                      { color: colors.textMuted },
                    ]}
                  >
                    Transcript is searchable and will be saved with your entry
                  </ThemedText>
                </View>
              )}

              {/* Voice photo preview (VOICE-003) */}
              {selectedType === "voice" && voicePhotoUris.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.voicePhotoCaptionPreview}
                  contentContainerStyle={styles.voicePhotoCaptionPreviewContent}
                  testID="voice-photo-caption-preview"
                >
                  {voicePhotoUris.map((uri) => (
                    <Image
                      key={uri}
                      source={{ uri }}
                      style={styles.voicePhotoCaptionImage}
                    />
                  ))}
                </ScrollView>
              )}
              {selectedMedia.length > 0 && selectedType !== "voice" && (
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

              {/* AI Milestone Detection indicator and suggestions (AIDETECT-001) */}
              {isDetectingMilestones && selectedType === "photo" && (
                <View
                  style={styles.aiAnalysisIndicator}
                  testID="milestone-detection-loading"
                >
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  <ThemedText
                    style={[
                      styles.aiAnalysisText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Detecting milestones...
                  </ThemedText>
                </View>
              )}

              {/* Show milestone suggestions (AIDETECT-001) */}
              {!isDetectingMilestones &&
                milestoneSuggestions.length > 0 &&
                selectedType === "photo" && (
                  <View
                    style={styles.milestoneSuggestionsContainer}
                    testID="milestone-suggestions"
                  >
                    <View style={styles.milestoneSuggestionsHeader}>
                      <ThemedText style={styles.milestoneSuggestionsIcon}>
                        🎯
                      </ThemedText>
                      <ThemedText
                        type="defaultSemiBold"
                        style={styles.milestoneSuggestionsTitle}
                      >
                        Milestone Detected
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={[
                        styles.milestoneSuggestionsHint,
                        { color: colors.textSecondary },
                      ]}
                    >
                      We detected a possible milestone in your photo
                    </ThemedText>
                    <View style={styles.milestoneSuggestionsList}>
                      {milestoneSuggestions.map((suggestion) => (
                        <View
                          key={suggestion.templateId}
                          style={[
                            styles.milestoneSuggestionCard,
                            { backgroundColor: colors.backgroundSecondary },
                          ]}
                          testID={`milestone-suggestion-${suggestion.templateId}`}
                        >
                          <View style={styles.milestoneSuggestionInfo}>
                            <ThemedText
                              type="defaultSemiBold"
                              style={styles.milestoneSuggestionTitle}
                            >
                              {suggestion.template.title}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.milestoneSuggestionConfidence,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {Math.round(suggestion.confidence * 100)}% match
                            </ThemedText>
                          </View>
                          <Pressable
                            style={styles.milestoneSuggestionDismiss}
                            onPress={() =>
                              dismissMilestoneSuggestion(suggestion.templateId)
                            }
                            hitSlop={8}
                            testID={`dismiss-milestone-${suggestion.templateId}`}
                          >
                            <ThemedText
                              style={[
                                styles.milestoneSuggestionDismissText,
                                { color: colors.textMuted },
                              ]}
                            >
                              ✕
                            </ThemedText>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                    <ThemedText
                      style={[
                        styles.milestoneSuggestionsFooter,
                        { color: colors.textMuted },
                      ]}
                    >
                      You can link this entry to a milestone after posting
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

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={videoUploadState.isUploading || createEntry.isPending}
                disabled={videoUploadState.isUploading || createEntry.isPending}
                onPress={handleSubmit}
                testID="submit-entry-button"
              >
                {videoUploadState.isUploading ? "Uploading..." : "Post"}
              </Button>
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
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
  // UI-015: Feed Header styles
  feedHeader: {
    marginBottom: Spacing.lg,
  },
  feedHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feedHeaderText: {
    flex: 1,
  },
  feedGreeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  feedChildName: {
    fontSize: 24,
  },
  feedChildAge: {
    fontSize: 16,
    fontWeight: "400",
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  // UI-012: Card media container with gradient overlay
  cardMediaContainer: {
    position: "relative",
  },
  cardGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  // UI-012: AI Tags as Chips
  cardAiTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  cardCaption: {
    padding: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  cardAttribution: {
    fontSize: 12,
  },
  cardDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardDateIcon: {
    marginRight: 4,
  },
  cardDate: {
    fontSize: 13,
  },
  // FAB styles removed - now using FAB component from @/components/ui/fab
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
  typeOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  typeOptionCard: {
    width: "47%",
    marginBottom: Spacing.xs,
  },
  typeOptionContent: {
    alignItems: "center",
  },
  typeOptionHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: "center",
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
  sourceOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  sourceOptionCard: {
    flex: 1,
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
  // UI-013: OnThisDay card with gradient
  onThisDayCardOuter: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadows.md,
  },
  onThisDayCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  onThisDayIconContainer: {
    marginRight: Spacing.sm,
  },
  onThisDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  onThisDayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  onThisDayDismiss: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  onThisDayDismissText: {
    fontSize: 14,
  },
  onThisDayTitle: {
    fontWeight: "600",
  },
  onThisDaySubtitle: {
    opacity: 0.7,
    marginBottom: 12,
  },
  yearTabsContainer: {
    marginBottom: 8,
    marginHorizontal: -4,
  },
  yearTabsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  yearTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  yearTabActive: {
    // Background color set dynamically
  },
  yearTabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  yearTabTextActive: {
    color: "#fff",
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
  // Voice recording styles (VOICE-001)
  voiceRecordingStep: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  recordButtonActive: {
    backgroundColor: "#FFEBEE",
  },
  recordButtonIcon: {
    fontSize: 48,
  },
  recordingHint: {
    fontSize: 14,
    marginTop: 8,
  },
  recordingPreview: {
    alignItems: "center",
    marginTop: 24,
  },
  recordingDuration: {
    fontSize: 16,
    marginBottom: 16,
  },
  useRecordingButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  useRecordingButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  permissionError: {
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionErrorText: {
    color: "#C62828",
    textAlign: "center",
  },
  voicePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  voicePreviewIcon: {
    fontSize: 24,
  },
  voicePreviewText: {
    fontSize: 16,
  },
  // Voice transcription styles (VOICE-002)
  transcriptionSection: {
    width: "100%",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  transcriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  transcriptionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  transcriptionStatus: {
    fontSize: 12,
  },
  transcriptionError: {
    fontSize: 12,
    marginBottom: 8,
  },
  transcriptInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  transcriptionHint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  // Voice photo attachment styles (VOICE-003)
  voicePhotoSection: {
    width: "100%",
    marginTop: 24,
    paddingHorizontal: 16,
  },
  voicePhotoLabel: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  attachPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  attachPhotoIcon: {
    fontSize: 24,
  },
  attachPhotoText: {
    fontSize: 16,
  },
  voicePhotoPreviewContainer: {
    alignItems: "center",
  },
  voicePhotoPreviewScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  voicePhotoPreviewItem: {
    position: "relative",
  },
  voicePhotoPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  voicePhotoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF5252",
    alignItems: "center",
    justifyContent: "center",
  },
  voicePhotoRemoveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: 16,
  },
  addMorePhotosButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addMorePhotosText: {
    fontSize: 14,
  },
  voicePhotoCaptionPreview: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  voicePhotoCaptionPreviewContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  voicePhotoCaptionImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  // UI-014: Monthly goal card styles (GAME-003)
  monthlyGoalCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  monthlyGoalCardComplete: {
    borderWidth: 1,
    borderColor: SemanticColors.success,
  },
  monthlyGoalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  monthlyGoalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  monthlyGoalInfo: {
    flex: 1,
  },
  monthlyGoalTitle: {
    fontWeight: "600",
  },
  monthlyGoalStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  monthlyGoalProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthlyGoalProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  monthlyGoalProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  // New animated progress bar style
  monthlyGoalProgressBarNew: {
    flex: 1,
  },
  monthlyGoalPercent: {
    fontSize: 12,
    minWidth: 32,
    textAlign: "right",
  },
  monthlyGoalCelebration: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  // UI-014: Streak card styles (GAME-002)
  streakCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    flexDirection: "column",
  },
  streakMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakIconContainer: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontWeight: "600",
  },
  streakBest: {
    fontSize: 13,
    marginTop: 2,
  },
  streakEncourage: {
    fontSize: 13,
    marginTop: 8,
  },
  // AI Milestone Detection styles (AIDETECT-001)
  milestoneSuggestionsContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: SemanticColors.goldLight,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  milestoneSuggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  milestoneSuggestionsIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  milestoneSuggestionsTitle: {
    fontSize: 15,
  },
  milestoneSuggestionsHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  milestoneSuggestionsList: {
    gap: 8,
  },
  milestoneSuggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  milestoneSuggestionInfo: {
    flex: 1,
  },
  milestoneSuggestionTitle: {
    fontSize: 15,
  },
  milestoneSuggestionConfidence: {
    fontSize: 12,
    marginTop: 2,
  },
  milestoneSuggestionDismiss: {
    padding: 4,
  },
  milestoneSuggestionDismissText: {
    fontSize: 16,
  },
  milestoneSuggestionsFooter: {
    fontSize: 12,
    marginTop: 12,
    fontStyle: "italic",
  },
});
