import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Audio, Video, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  useTimeCapsules,
  type TimeCapsule,
  PRESET_UNLOCK_AGES,
} from "@/contexts/time-capsule-context";
import { useChild } from "@/contexts/child-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Shadows,
  Spacing,
} from "@/constants/theme";

// CAPSULE-002: Max voice recording duration (5 minutes in milliseconds)
const MAX_RECORDING_DURATION_MS = 5 * 60 * 1000;

// CAPSULE-003: Max video duration (2 minutes in seconds for ImagePicker)
const MAX_VIDEO_DURATION_SEC = 2 * 60;

type ModalState = "closed" | "createCapsule";
type UnlockOption = "age" | "custom";

// CAPSULE-002: Voice recording state types
type VoiceRecordingState = "idle" | "recording" | "preview";

// Helper to format duration in mm:ss
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// CAPSULE-008: Time capsule templates
interface CapsuleTemplate {
  id: string;
  title: string;
  icon: string;
  content: string;
  suggestedAge?: number; // Auto-select this unlock age
}

const CAPSULE_TEMPLATES: CapsuleTemplate[] = [
  {
    id: "start-blank",
    title: "Start Blank",
    icon: "📝",
    content: "",
  },
  {
    id: "18-year-old",
    title: "Letter to 18-year-old",
    icon: "🎓",
    suggestedAge: 18,
    content: `Dear [Child's Name],

Today you turn 18, and you're officially an adult! I'm writing this letter when you were still so young, and I want you to know how much you mean to me.

When you were little, your favorite thing to do was [favorite activity]. Your smile could light up any room, and watching you discover the world has been the greatest joy of my life.

There are a few things I hope you always remember:

1. You are capable of achieving anything you set your mind to.

2. It's okay to make mistakes - that's how we learn and grow.

3. Always be kind to others and to yourself.

4. Your family will always be here for you, no matter what.

As you step into adulthood, I want you to know that I am incredibly proud of the person you've become. Follow your dreams, be brave, and never stop learning.

With all my love,
[Your Name]`,
  },
  {
    id: "first-day-school",
    title: "First Day of School",
    icon: "🏫",
    suggestedAge: 5,
    content: `Dear [Child's Name],

Today was your very first day of school! I can barely believe how fast you've grown.

You woke up this morning feeling [nervous/excited/curious], and watching you walk through those school gates was such a special moment for me.

You looked so [description] in your uniform/clothes, carrying your new backpack that was almost bigger than you!

Some things I want you to remember about today:
- Your teacher's name was [teacher name]
- You made friends with [if applicable]
- The first thing you told me when you came home was [blank]

I hope school becomes a place where you discover amazing things, make wonderful friends, and grow into the incredible person I know you'll be.

Love always,
[Your Name]`,
  },
  {
    id: "graduation",
    title: "For Graduation Day",
    icon: "🎉",
    suggestedAge: 21,
    content: `Dear [Child's Name],

Congratulations on your graduation! This is such a momentous achievement, and I am bursting with pride.

When I wrote this letter, you were just [age] years old. I remember looking at you and dreaming of all the wonderful things you would accomplish. Now, seeing you graduate, I know those dreams were just the beginning.

The world is full of possibilities waiting for you. As you step into this new chapter:

- Remember where you came from, but don't let it limit where you can go.

- Stay curious - learning doesn't end with graduation.

- Build meaningful relationships - success means nothing without people to share it with.

- Take care of your health - it's your greatest asset.

- Call home sometimes - we miss you!

Whatever path you choose, know that your family is cheering you on every step of the way.

With immense pride and love,
[Your Name]`,
  },
];

// Calculate unlock date from age
function calculateUnlockDateFromAge(
  birthDate: string,
  unlockAge: number,
): Date {
  const birth = new Date(birthDate);
  const unlockDate = new Date(birth);
  unlockDate.setFullYear(birth.getFullYear() + unlockAge);
  return unlockDate;
}

// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Calculate time until unlock
function getTimeUntilUnlock(
  capsule: TimeCapsule,
  childBirthDate?: string,
): string {
  let unlockDate: Date;

  if (capsule.unlockType === "age" && capsule.unlockAge && childBirthDate) {
    unlockDate = calculateUnlockDateFromAge(childBirthDate, capsule.unlockAge);
  } else if (capsule.unlockType === "custom_date" && capsule.unlockDate) {
    unlockDate = new Date(capsule.unlockDate);
  } else {
    return "Unknown";
  }

  const now = new Date();
  const diffMs = unlockDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Ready to unlock";
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;
  const diffMonths = Math.floor(remainingDays / 30);

  if (diffYears > 0) {
    return diffMonths > 0
      ? `${diffYears}y ${diffMonths}m`
      : `${diffYears} year${diffYears > 1 ? "s" : ""}`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  }
}

export default function TimeCapsuleScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { child } = useChild();
  const {
    capsules,
    createCapsule,
    getSealedCapsules,
    getUnlockedCapsules,
    checkAndUnlockCapsules,
  } = useTimeCapsules();

  // CAPSULE-005: Check and unlock capsules on mount
  useEffect(() => {
    checkAndUnlockCapsules();
  }, [checkAndUnlockCapsules]);

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [letterContent, setLetterContent] = useState("");
  const [unlockOption, setUnlockOption] = useState<UnlockOption>("age");
  const [selectedAge, setSelectedAge] = useState<number>(18);
  const [customDate, setCustomDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 18); // Default 18 years from now
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // CAPSULE-002: Voice recording state
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceRecordingState>("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // CAPSULE-003: Video message state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showVideoSourceModal, setShowVideoSourceModal] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const videoRef = useRef<Video | null>(null);

  const sealedCapsules = useMemo(
    () => getSealedCapsules(),
    [getSealedCapsules],
  );
  const unlockedCapsules = useMemo(
    () => getUnlockedCapsules(),
    [getUnlockedCapsules],
  );

  const hasCapsules = capsules.length > 0;

  // CAPSULE-002: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // CAPSULE-002: Stop voice recording (defined first to avoid circular dependency)
  const handleStopRecording = useCallback(async () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (!recordingRef.current) {
        return;
      }

      const recording = recordingRef.current;
      const status = await recording.getStatusAsync();
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      recordingRef.current = null;

      if (uri) {
        setVoiceUri(uri);
        setVoiceDuration(status.durationMillis || 0);
        setVoiceState("preview");
      } else {
        setVoiceState("idle");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setVoiceState("idle");
    }
  }, []);

  // CAPSULE-002: Start voice recording
  const handleStartRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await recording.startAsync();

      recordingRef.current = recording;
      setVoiceState("recording");
      setRecordingDuration(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const next = prev + 1000;
          // Auto-stop at 5 minutes (will be handled via useEffect)
          return next;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, []);

  // CAPSULE-002: Play voice preview
  const handlePlayPreview = useCallback(async () => {
    if (!voiceUri) return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: voiceUri });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingPreview(false);
        }
      });

      await sound.playAsync();
      setIsPlayingPreview(true);
    } catch (error) {
      console.error("Failed to play preview:", error);
    }
  }, [voiceUri]);

  // CAPSULE-002: Stop preview playback
  const handleStopPreview = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlayingPreview(false);
    }
  }, []);

  // CAPSULE-002: Re-record voice message
  const handleReRecord = useCallback(() => {
    setVoiceUri(null);
    setVoiceDuration(0);
    setVoiceState("idle");
    setRecordingDuration(0);
  }, []);

  // CAPSULE-002: Save voice message to capsule form
  const handleSaveVoice = useCallback(() => {
    // Voice is already saved in voiceUri state
    setShowVoiceModal(false);
    setVoiceState("idle");
    setRecordingDuration(0);
  }, []);

  // CAPSULE-002: Open voice recording modal
  const handleOpenVoiceModal = useCallback(() => {
    setShowVoiceModal(true);
    setVoiceState("idle");
    setRecordingDuration(0);
  }, []);

  // CAPSULE-002: Close voice modal (cancel)
  const handleCloseVoiceModal = useCallback(() => {
    // If we have a recording in progress, stop it
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    // Don't clear voiceUri if we already have a saved voice message
    if (voiceState !== "preview" || !voiceUri) {
      setVoiceUri(null);
      setVoiceDuration(0);
    }
    setShowVoiceModal(false);
    setVoiceState("idle");
    setRecordingDuration(0);
  }, [voiceState, voiceUri]);

  // CAPSULE-002: Remove attached voice message
  const handleRemoveVoice = useCallback(() => {
    setVoiceUri(null);
    setVoiceDuration(0);
  }, []);

  // CAPSULE-003: Open video source selection modal
  const handleOpenVideoSourceModal = useCallback(() => {
    setShowVideoSourceModal(true);
  }, []);

  // CAPSULE-003: Close video source modal
  const handleCloseVideoSourceModal = useCallback(() => {
    setShowVideoSourceModal(false);
  }, []);

  // CAPSULE-003: Record video with camera
  const handleRecordVideo = useCallback(async () => {
    setShowVideoSourceModal(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: MAX_VIDEO_DURATION_SEC,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setVideoUri(asset.uri);
      setVideoDuration((asset.duration || 0) * 1000); // Convert to ms
      setShowVideoModal(true);
    }
  }, []);

  // CAPSULE-003: Select video from library
  const handleSelectVideo = useCallback(async () => {
    setShowVideoSourceModal(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: MAX_VIDEO_DURATION_SEC,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setVideoUri(asset.uri);
      setVideoDuration((asset.duration || 0) * 1000); // Convert to ms
      setShowVideoModal(true);
    }
  }, []);

  // CAPSULE-003: Play video preview
  const handlePlayVideo = useCallback(async () => {
    if (videoRef.current) {
      await videoRef.current.playAsync();
      setIsPlayingVideo(true);
    }
  }, []);

  // CAPSULE-003: Pause video preview
  const handlePauseVideo = useCallback(async () => {
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
      setIsPlayingVideo(false);
    }
  }, []);

  // CAPSULE-003: Save video message to capsule form
  const handleSaveVideo = useCallback(() => {
    setShowVideoModal(false);
  }, []);

  // CAPSULE-003: Close video preview modal (cancel)
  const handleCloseVideoModal = useCallback(() => {
    setVideoUri(null);
    setVideoDuration(0);
    setShowVideoModal(false);
    setIsPlayingVideo(false);
  }, []);

  // CAPSULE-003: Remove attached video message
  const handleRemoveVideo = useCallback(() => {
    setVideoUri(null);
    setVideoDuration(0);
    setIsPlayingVideo(false);
  }, []);

  // CAPSULE-002: Auto-stop at 5 minutes
  useEffect(() => {
    if (
      voiceState === "recording" &&
      recordingDuration >= MAX_RECORDING_DURATION_MS
    ) {
      handleStopRecording();
    }
  }, [voiceState, recordingDuration, handleStopRecording]);

  const handleOpenCreateModal = () => {
    setLetterContent("");
    setUnlockOption("age");
    setSelectedAge(18);
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 18);
    setCustomDate(defaultDate);
    // CAPSULE-002: Reset voice state
    setVoiceUri(null);
    setVoiceDuration(0);
    setVoiceState("idle");
    // CAPSULE-003: Reset video state
    setVideoUri(null);
    setVideoDuration(0);
    setIsPlayingVideo(false);
    setModalState("createCapsule");
  };

  const handleSaveCapsule = () => {
    if (!letterContent.trim()) return;

    createCapsule({
      letterContent: letterContent.trim(),
      unlockType: unlockOption === "age" ? "age" : "custom_date",
      unlockAge: unlockOption === "age" ? selectedAge : undefined,
      unlockDate:
        unlockOption === "custom"
          ? customDate.toISOString().split("T")[0]
          : undefined,
      childId: child?.id,
      // CAPSULE-002: Include voice message URI if recorded
      voiceMessageUri: voiceUri || undefined,
      // CAPSULE-003: Include video message URI if recorded
      videoMessageUri: videoUri || undefined,
    });

    setModalState("closed");
    setLetterContent("");
    // CAPSULE-002: Reset voice state
    setVoiceUri(null);
    setVoiceDuration(0);
    // CAPSULE-003: Reset video state
    setVideoUri(null);
    setVideoDuration(0);
  };

  const isValidCapsule = letterContent.trim().length > 0;

  // CAPSULE-008: Handle template selection
  const handleSelectTemplate = useCallback((template: CapsuleTemplate) => {
    setLetterContent(template.content);
    // Auto-select suggested unlock age if template has one
    if (
      template.suggestedAge &&
      PRESET_UNLOCK_AGES.includes(
        template.suggestedAge as (typeof PRESET_UNLOCK_AGES)[number],
      )
    ) {
      setSelectedAge(template.suggestedAge);
      setUnlockOption("age");
    }
  }, []);

  const handleCapsulePress = useCallback((capsuleId: string) => {
    router.push(`/capsule/${capsuleId}`);
  }, []);

  const renderCapsuleCard = (capsule: TimeCapsule) => {
    const isSealed = capsule.status === "sealed";
    const isOpenedEarly = capsule.status === "opened_early";
    const timeUntil = getTimeUntilUnlock(capsule, child?.dateOfBirth);

    return (
      <Pressable
        key={capsule.id}
        testID={`capsule-card-${capsule.id}`}
        style={[
          styles.capsuleCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          Shadows.small,
        ]}
        onPress={() => handleCapsulePress(capsule.id)}
      >
        <View style={styles.capsuleHeader}>
          <View style={styles.capsuleIconContainer}>
            <Text style={styles.capsuleIcon}>{isSealed ? "🔒" : "📬"}</Text>
          </View>
          <View style={styles.capsuleInfo}>
            <Text style={[styles.capsuleTitle, { color: colors.text }]}>
              {isSealed ? "Sealed Letter" : "Opened Letter"}
            </Text>
            <Text style={[styles.capsuleDate, { color: colors.textSecondary }]}>
              Created {formatDate(capsule.createdAt)}
            </Text>
          </View>
          {isSealed && (
            <View
              style={[
                styles.countdownBadge,
                { backgroundColor: SemanticColors.infoLight },
              ]}
            >
              <Text
                style={[styles.countdownText, { color: SemanticColors.info }]}
              >
                {timeUntil}
              </Text>
            </View>
          )}
          {isOpenedEarly && (
            <View
              style={[
                styles.countdownBadge,
                { backgroundColor: SemanticColors.warningLight },
              ]}
            >
              <Text
                style={[
                  styles.countdownText,
                  { color: SemanticColors.warningText },
                ]}
              >
                Opened Early
              </Text>
            </View>
          )}
        </View>

        {/* Preview of letter (blurred/hidden if sealed) */}
        {isSealed ? (
          <View style={styles.sealedContent}>
            <Text style={[styles.sealedText, { color: colors.textSecondary }]}>
              Content sealed until{" "}
              {capsule.unlockType === "age" && capsule.unlockAge
                ? `age ${capsule.unlockAge}`
                : capsule.unlockDate
                  ? formatDate(capsule.unlockDate)
                  : "unlock date"}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.capsulePreview, { color: colors.text }]}
            numberOfLines={3}
          >
            {capsule.letterContent}
          </Text>
        )}
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>💌</Text>
      <ThemedText type="subtitle" style={styles.emptyStateTitle}>
        No Time Capsules Yet
      </ThemedText>
      <ThemedText
        style={[styles.emptyStateText, { color: colors.textSecondary }]}
      >
        Write a letter to your child that they can read when they grow up.
        Choose when it unlocks - at age 5, 10, 18, 21, or a custom date.
      </ThemedText>
      <Pressable
        testID="empty-state-create-button"
        style={styles.emptyStateButton}
        onPress={handleOpenCreateModal}
      >
        <Text style={styles.emptyStateButtonText}>Write New Letter</Text>
      </Pressable>
    </View>
  );

  const renderAgeSelector = () => (
    <View testID="age-selector" style={styles.ageSelector}>
      {PRESET_UNLOCK_AGES.map((age) => (
        <Pressable
          key={age}
          testID={`age-option-${age}`}
          style={[
            styles.ageOption,
            selectedAge === age && styles.ageOptionActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedAge(age)}
        >
          <Text
            style={[
              styles.ageOptionText,
              { color: selectedAge === age ? "#fff" : colors.text },
            ]}
          >
            {age}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {!hasCapsules ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.scrollView}>
          {sealedCapsules.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Sealed ({sealedCapsules.length})
              </Text>
              {sealedCapsules.map(renderCapsuleCard)}
            </View>
          )}
          {unlockedCapsules.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Opened ({unlockedCapsules.length})
              </Text>
              {unlockedCapsules.map(renderCapsuleCard)}
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB to create new capsule */}
      {hasCapsules && (
        <Pressable
          testID="create-capsule-fab"
          style={[styles.fab, Shadows.large]}
          onPress={handleOpenCreateModal}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      {/* Create Capsule Modal */}
      <Modal visible={modalState === "createCapsule"} animationType="slide">
        <KeyboardAvoidingView
          style={[styles.fullModal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.fullModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable
              testID="cancel-create-button"
              onPress={() => setModalState("closed")}
            >
              <Text style={styles.backButton}>Cancel</Text>
            </Pressable>
            <ThemedText type="subtitle">Write Letter</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            {/* CAPSULE-008: Template Selector */}
            <Text style={[styles.label, { color: colors.text }]}>
              Use a Template
            </Text>
            <ScrollView
              testID="template-selector"
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateScroll}
              contentContainerStyle={styles.templateScrollContent}
            >
              {CAPSULE_TEMPLATES.map((template) => (
                <Pressable
                  key={template.id}
                  testID={`template-option-${template.id}`}
                  style={[
                    styles.templateOption,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => handleSelectTemplate(template)}
                >
                  <Text style={styles.templateIcon}>{template.icon}</Text>
                  <Text
                    style={[styles.templateTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {template.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.text }]}>
              Your Letter *
            </Text>
            <TextInput
              testID="letter-content-input"
              style={[
                styles.letterInput,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              value={letterContent}
              onChangeText={setLetterContent}
              placeholder="Dear child, ..."
              placeholderTextColor={colors.placeholder}
              multiline
              textAlignVertical="top"
            />

            {/* CAPSULE-002: Voice Message Section */}
            <Text style={[styles.label, { color: colors.text }]}>
              Voice Message (Optional)
            </Text>
            {voiceUri ? (
              <View
                testID="voice-attached-indicator"
                style={[
                  styles.voiceAttachedContainer,
                  { borderColor: colors.border },
                ]}
              >
                <View style={styles.voiceAttachedInfo}>
                  <Text style={styles.voiceIcon}>🎙️</Text>
                  <View>
                    <Text
                      style={[styles.voiceAttachedText, { color: colors.text }]}
                    >
                      Voice message attached
                    </Text>
                    <Text
                      style={[
                        styles.voiceDurationText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatDuration(voiceDuration)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  testID="remove-voice-button"
                  onPress={handleRemoveVoice}
                  style={styles.removeVoiceButton}
                >
                  <Text style={styles.removeVoiceText}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                testID="add-voice-message-button"
                style={[styles.addVoiceButton, { borderColor: colors.border }]}
                onPress={handleOpenVoiceModal}
              >
                <Text style={styles.addVoiceIcon}>🎙️</Text>
                <Text style={[styles.addVoiceText, { color: colors.text }]}>
                  Add Voice Message
                </Text>
                <Text
                  style={[
                    styles.addVoiceSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Up to 5 minutes
                </Text>
              </Pressable>
            )}

            {/* CAPSULE-003: Video Message Section */}
            <Text style={[styles.label, { color: colors.text }]}>
              Video Message (Optional)
            </Text>
            {videoUri ? (
              <View
                testID="video-attached-indicator"
                style={[
                  styles.videoAttachedContainer,
                  { borderColor: colors.border },
                ]}
              >
                <View style={styles.videoAttachedInfo}>
                  <Text style={styles.videoIcon}>🎬</Text>
                  <View>
                    <Text
                      style={[styles.videoAttachedText, { color: colors.text }]}
                    >
                      Video message attached
                    </Text>
                    <Text
                      style={[
                        styles.videoDurationText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatDuration(videoDuration)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  testID="remove-video-button"
                  onPress={handleRemoveVideo}
                  style={styles.removeVideoButton}
                >
                  <Text style={styles.removeVideoText}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                testID="add-video-message-button"
                style={[styles.addVideoButton, { borderColor: colors.border }]}
                onPress={handleOpenVideoSourceModal}
              >
                <Text style={styles.addVideoIcon}>🎬</Text>
                <Text style={[styles.addVideoText, { color: colors.text }]}>
                  Add Video Message
                </Text>
                <Text
                  style={[
                    styles.addVideoSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Up to 2 minutes
                </Text>
              </Pressable>
            )}

            <Text style={[styles.label, { color: colors.text }]}>
              When to Unlock
            </Text>
            <View style={styles.unlockOptionRow}>
              <Pressable
                testID="unlock-option-age"
                style={[
                  styles.unlockOptionButton,
                  unlockOption === "age" && styles.unlockOptionButtonActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setUnlockOption("age")}
              >
                <Text
                  style={[
                    styles.unlockOptionText,
                    { color: unlockOption === "age" ? "#fff" : colors.text },
                  ]}
                >
                  At Age
                </Text>
              </Pressable>
              <Pressable
                testID="unlock-option-custom"
                style={[
                  styles.unlockOptionButton,
                  unlockOption === "custom" && styles.unlockOptionButtonActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setUnlockOption("custom")}
              >
                <Text
                  style={[
                    styles.unlockOptionText,
                    { color: unlockOption === "custom" ? "#fff" : colors.text },
                  ]}
                >
                  Custom Date
                </Text>
              </Pressable>
            </View>

            {unlockOption === "age" && (
              <>
                <Text
                  style={[styles.helperText, { color: colors.textSecondary }]}
                >
                  Select the age when your child can read this letter:
                </Text>
                {renderAgeSelector()}
              </>
            )}

            {unlockOption === "custom" && (
              <>
                <Text
                  style={[styles.helperText, { color: colors.textSecondary }]}
                >
                  Choose a specific date for the letter to unlock:
                </Text>
                <Pressable
                  testID="custom-date-button"
                  style={[
                    styles.dateButton,
                    { borderColor: colors.inputBorder },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {customDate.toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    testID="unlock-date-picker"
                    value={customDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={new Date()}
                    onChange={(_, date) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (date) setCustomDate(date);
                    }}
                  />
                )}
              </>
            )}

            <View style={styles.infoBox}>
              <Text style={[styles.infoIcon]}>🔒</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Once saved, the letter will be sealed and cannot be edited.
                Content stays hidden until the unlock date.
              </Text>
            </View>

            <Pressable
              testID="save-capsule-button"
              style={[
                styles.submitButton,
                !isValidCapsule && styles.submitButtonDisabled,
              ]}
              onPress={handleSaveCapsule}
              disabled={!isValidCapsule}
            >
              <Text style={styles.submitButtonText}>Seal & Save</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* CAPSULE-002: Voice Recording Modal */}
      <Modal
        visible={showVoiceModal}
        animationType="slide"
        transparent={true}
        testID="voice-recording-modal"
      >
        <View style={styles.voiceModalOverlay}>
          <View
            style={[
              styles.voiceModalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.voiceModalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Pressable
                testID="close-voice-modal-button"
                onPress={handleCloseVoiceModal}
              >
                <Text style={styles.backButton}>Cancel</Text>
              </Pressable>
              <ThemedText type="subtitle">Voice Message</ThemedText>
              <View style={{ width: 60 }} />
            </View>

            <View style={styles.voiceModalBody}>
              {voiceState === "idle" && (
                <>
                  <Text
                    style={[
                      styles.voiceModalInstruction,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tap to start recording your voice message
                  </Text>
                  <Pressable
                    testID="start-recording-button"
                    style={styles.recordButton}
                    onPress={handleStartRecording}
                  >
                    <Text style={styles.recordButtonIcon}>🎙️</Text>
                    <Text style={styles.recordButtonText}>Start Recording</Text>
                  </Pressable>
                  <Text
                    style={[
                      styles.voiceModalSubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Maximum 5 minutes
                  </Text>
                </>
              )}

              {voiceState === "recording" && (
                <>
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text
                      style={[
                        styles.recordingLabel,
                        { color: SemanticColors.error },
                      ]}
                    >
                      Recording
                    </Text>
                  </View>
                  <Text
                    testID="recording-duration"
                    style={[styles.durationDisplay, { color: colors.text }]}
                  >
                    {formatDuration(recordingDuration)}
                  </Text>
                  <Pressable
                    testID="stop-recording-button"
                    style={styles.stopButton}
                    onPress={handleStopRecording}
                  >
                    <View style={styles.stopButtonIcon} />
                    <Text style={styles.stopButtonText}>Stop</Text>
                  </Pressable>
                </>
              )}

              {voiceState === "preview" && (
                <View testID="voice-preview" style={styles.previewContainer}>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>
                    Preview
                  </Text>
                  <Text
                    style={[
                      styles.previewDuration,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Duration: {formatDuration(voiceDuration)}
                  </Text>

                  <Pressable
                    testID="play-preview-button"
                    style={[
                      styles.playPreviewButton,
                      isPlayingPreview && styles.playPreviewButtonActive,
                    ]}
                    onPress={
                      isPlayingPreview ? handleStopPreview : handlePlayPreview
                    }
                  >
                    <Text style={styles.playPreviewIcon}>
                      {isPlayingPreview ? "⏹️" : "▶️"}
                    </Text>
                    <Text style={styles.playPreviewText}>
                      {isPlayingPreview ? "Stop" : "Play"}
                    </Text>
                  </Pressable>

                  <View style={styles.previewActions}>
                    <Pressable
                      testID="re-record-button"
                      style={[
                        styles.previewActionButton,
                        { borderColor: colors.border },
                      ]}
                      onPress={handleReRecord}
                    >
                      <Text
                        style={[
                          styles.previewActionText,
                          { color: colors.text },
                        ]}
                      >
                        Re-record
                      </Text>
                    </Pressable>
                    <Pressable
                      testID="save-voice-button"
                      style={styles.saveVoiceButton}
                      onPress={handleSaveVoice}
                    >
                      <Text style={styles.saveVoiceButtonText}>
                        Use Recording
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* CAPSULE-003: Video Source Selection Modal */}
      <Modal
        visible={showVideoSourceModal}
        animationType="fade"
        transparent={true}
        testID="video-source-modal"
      >
        <View style={styles.videoSourceModalOverlay}>
          <View
            style={[
              styles.videoSourceModalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.videoSourceTitle, { color: colors.text }]}>
              Add Video Message
            </Text>

            <Pressable
              testID="record-video-button"
              style={[styles.videoSourceOption, { borderColor: colors.border }]}
              onPress={handleRecordVideo}
            >
              <Text style={styles.videoSourceIcon}>📹</Text>
              <View>
                <Text
                  style={[
                    styles.videoSourceOptionTitle,
                    { color: colors.text },
                  ]}
                >
                  Record Video
                </Text>
                <Text
                  style={[
                    styles.videoSourceOptionSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Use camera to record a new video
                </Text>
              </View>
            </Pressable>

            <Pressable
              testID="select-video-button"
              style={[styles.videoSourceOption, { borderColor: colors.border }]}
              onPress={handleSelectVideo}
            >
              <Text style={styles.videoSourceIcon}>📁</Text>
              <View>
                <Text
                  style={[
                    styles.videoSourceOptionTitle,
                    { color: colors.text },
                  ]}
                >
                  Choose from Library
                </Text>
                <Text
                  style={[
                    styles.videoSourceOptionSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Select an existing video
                </Text>
              </View>
            </Pressable>

            <Pressable
              testID="cancel-video-source-button"
              style={styles.videoSourceCancelButton}
              onPress={handleCloseVideoSourceModal}
            >
              <Text style={styles.videoSourceCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CAPSULE-003: Video Preview Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        transparent={true}
        testID="video-preview-modal"
      >
        <View style={styles.videoModalOverlay}>
          <View
            style={[
              styles.videoModalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.videoModalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Pressable
                testID="close-video-modal-button"
                onPress={handleCloseVideoModal}
              >
                <Text style={styles.backButton}>Cancel</Text>
              </Pressable>
              <ThemedText type="subtitle">Video Preview</ThemedText>
              <View style={{ width: 60 }} />
            </View>

            <View style={styles.videoModalBody}>
              {videoUri && (
                <View
                  testID="video-preview"
                  style={styles.videoPreviewContainer}
                >
                  <Video
                    ref={videoRef}
                    source={{ uri: videoUri }}
                    style={styles.videoPlayer}
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                    onPlaybackStatusUpdate={(status) => {
                      if (status.isLoaded && status.didJustFinish) {
                        setIsPlayingVideo(false);
                      }
                    }}
                  />

                  <Text
                    style={[
                      styles.videoPreviewDuration,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Duration: {formatDuration(videoDuration)}
                  </Text>

                  <Pressable
                    testID="play-video-button"
                    style={[
                      styles.playVideoButton,
                      isPlayingVideo && styles.playVideoButtonActive,
                    ]}
                    onPress={
                      isPlayingVideo ? handlePauseVideo : handlePlayVideo
                    }
                  >
                    <Text style={styles.playVideoIcon}>
                      {isPlayingVideo ? "⏸️" : "▶️"}
                    </Text>
                    <Text style={styles.playVideoText}>
                      {isPlayingVideo ? "Pause" : "Play"}
                    </Text>
                  </Pressable>

                  <View style={styles.videoPreviewActions}>
                    <Pressable
                      testID="change-video-button"
                      style={[
                        styles.videoPreviewActionButton,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => {
                        setShowVideoModal(false);
                        setShowVideoSourceModal(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.videoPreviewActionText,
                          { color: colors.text },
                        ]}
                      >
                        Change Video
                      </Text>
                    </Pressable>
                    <Pressable
                      testID="save-video-button"
                      style={styles.saveVideoButton}
                      onPress={handleSaveVideo}
                    >
                      <Text style={styles.saveVideoButtonText}>Use Video</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  capsuleCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  capsuleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  capsuleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SemanticColors.infoLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  capsuleIcon: {
    fontSize: 20,
  },
  capsuleInfo: {
    flex: 1,
  },
  capsuleTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  capsuleDate: {
    fontSize: 12,
    marginTop: 2,
  },
  countdownBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sealedContent: {
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
  },
  sealedText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  capsulePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyStateText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 36,
  },
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
  // CAPSULE-008: Template selector styles
  templateScroll: {
    marginBottom: Spacing.lg,
  },
  templateScrollContent: {
    gap: Spacing.sm,
  },
  templateOption: {
    width: 100,
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  templateTitle: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  letterInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 200,
    marginBottom: Spacing.xl,
  },
  helperText: {
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  unlockOptionRow: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  unlockOptionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  unlockOptionButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  unlockOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  ageSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.xl,
  },
  ageOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ageOptionActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  ageOptionText: {
    fontSize: 18,
    fontWeight: "700",
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
  infoBox: {
    flexDirection: "row",
    backgroundColor: SemanticColors.infoLight,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.xl,
    alignItems: "flex-start",
  },
  infoIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // CAPSULE-002: Voice recording styles
  addVoiceButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.lg,
    alignItems: "center",
    borderStyle: "dashed",
    marginBottom: Spacing.xl,
  },
  addVoiceIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  addVoiceText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addVoiceSubtext: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  voiceAttachedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: SemanticColors.successLight,
    borderColor: SemanticColors.success,
  },
  voiceAttachedInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  voiceAttachedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  voiceDurationText: {
    fontSize: 12,
    marginTop: 2,
  },
  removeVoiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeVoiceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  voiceModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 350,
  },
  voiceModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  voiceModalBody: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceModalInstruction: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  voiceModalSubtext: {
    fontSize: 12,
    marginTop: Spacing.md,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SemanticColors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: SemanticColors.error,
    marginRight: Spacing.sm,
  },
  recordingLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  durationDisplay: {
    fontSize: 48,
    fontWeight: "300",
    marginBottom: Spacing.xl,
    fontVariant: ["tabular-nums"],
  },
  stopButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  stopButtonIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  previewContainer: {
    width: "100%",
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  previewDuration: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  playPreviewButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  playPreviewButtonActive: {
    backgroundColor: "#333",
  },
  playPreviewIcon: {
    fontSize: 24,
  },
  playPreviewText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  previewActions: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  previewActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  previewActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveVoiceButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    alignItems: "center",
  },
  saveVoiceButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // CAPSULE-003: Video message styles
  addVideoButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.lg,
    alignItems: "center",
    borderStyle: "dashed",
    marginBottom: Spacing.xl,
  },
  addVideoIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  addVideoText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addVideoSubtext: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  videoAttachedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: "#E8F4FD",
    borderColor: "#4A90D9",
  },
  videoAttachedInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  videoIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  videoAttachedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  videoDurationText: {
    fontSize: 12,
    marginTop: 2,
  },
  removeVideoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeVideoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  videoSourceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  videoSourceModalContent: {
    borderRadius: 16,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 340,
  },
  videoSourceTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  videoSourceOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  videoSourceIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  videoSourceOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  videoSourceOptionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  videoSourceCancelButton: {
    marginTop: Spacing.md,
    alignItems: "center",
    padding: Spacing.md,
  },
  videoSourceCancelText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  videoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  videoModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 500,
  },
  videoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  videoModalBody: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPreviewContainer: {
    width: "100%",
    alignItems: "center",
  },
  videoPlayer: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  videoPreviewDuration: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  playVideoButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  playVideoButtonActive: {
    backgroundColor: "#333",
  },
  playVideoIcon: {
    fontSize: 24,
  },
  playVideoText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  videoPreviewActions: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  videoPreviewActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  videoPreviewActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveVideoButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    alignItems: "center",
  },
  saveVideoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
