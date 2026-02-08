import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Audio, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Confetti, useConfetti } from "@/components/ui";
import {
  CapsuleCard,
  CreateCapsuleModal,
  VoiceRecordingModal,
  VideoSourceModal,
  VideoPreviewModal,
  type CapsuleTemplate,
  type VoiceRecordingState,
} from "@/components/time-capsule";
import {
  useTimeCapsules,
  PRESET_UNLOCK_AGES,
} from "@/contexts/time-capsule-context";
import { useChild } from "@/contexts/child-context";
import { useAuth } from "@/contexts/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PRIMARY_COLOR, Colors, Shadows, Spacing } from "@/constants/theme";

// CAPSULE-002: Max voice recording duration (5 minutes in milliseconds)
const MAX_RECORDING_DURATION_MS = 5 * 60 * 1000;

// CAPSULE-003: Max video duration (2 minutes in seconds for ImagePicker)
const MAX_VIDEO_DURATION_SEC = 2 * 60;

type ModalState = "closed" | "createCapsule";
type UnlockOption = "age" | "custom";

export default function TimeCapsuleScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // UI-025: Confetti celebration on capsule creation
  const {
    active: confettiActive,
    fire: fireConfetti,
    handleComplete: handleConfettiComplete,
  } = useConfetti();

  const { child } = useChild();
  const { isChildView } = useAuth();
  const {
    capsules,
    createCapsule,
    getSealedCapsules,
    getUnlockedCapsules,
    getCapsulesForChildView,
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
    date.setFullYear(date.getFullYear() + 18);
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

  // CAPSULE-006: Child view only sees unlocked capsules
  const childViewCapsules = useMemo(
    () => getCapsulesForChildView(),
    [getCapsulesForChildView],
  );

  const hasCapsules = isChildView
    ? childViewCapsules.length > 0
    : capsules.length > 0;

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

  // CAPSULE-002: Stop voice recording
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

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1000);
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

  // CAPSULE-002: Save voice message
  const handleSaveVoice = useCallback(() => {
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

  // CAPSULE-002: Close voice modal
  const handleCloseVoiceModal = useCallback(() => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
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

  // CAPSULE-003: Video source modal handlers
  const handleOpenVideoSourceModal = useCallback(() => {
    setShowVideoSourceModal(true);
  }, []);

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
      setVideoDuration((asset.duration || 0) * 1000);
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
      setVideoDuration((asset.duration || 0) * 1000);
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

  // CAPSULE-003: Save video message
  const handleSaveVideo = useCallback(() => {
    setShowVideoModal(false);
  }, []);

  // CAPSULE-003: Close video preview modal
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

  // CAPSULE-003: Change video (return to source modal)
  const handleChangeVideo = useCallback(() => {
    setShowVideoModal(false);
    setShowVideoSourceModal(true);
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
    setVoiceUri(null);
    setVoiceDuration(0);
    setVoiceState("idle");
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
      voiceMessageUri: voiceUri || undefined,
      videoMessageUri: videoUri || undefined,
    });

    fireConfetti();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setModalState("closed");
    setLetterContent("");
    setVoiceUri(null);
    setVoiceDuration(0);
    setVideoUri(null);
    setVideoDuration(0);
  };

  const isValidCapsule = letterContent.trim().length > 0;

  // CAPSULE-008: Handle template selection
  const handleSelectTemplate = useCallback((template: CapsuleTemplate) => {
    setLetterContent(template.content);
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

  // CAPSULE-006: Child view empty state
  const renderChildEmptyState = () => (
    <View testID="child-empty-state" style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>⏳</Text>
      <ThemedText type="subtitle" style={styles.emptyStateTitle}>
        No Letters Yet
      </ThemedText>
      <ThemedText
        style={[styles.emptyStateText, { color: colors.textSecondary }]}
      >
        Your parents have written special letters for you! They will appear here
        when it&apos;s time to read them.
      </ThemedText>
    </View>
  );

  const renderEmptyState = () => (
    <View testID="parent-empty-state" style={styles.emptyState}>
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

  // CAPSULE-006: Render child view
  const renderChildView = () => {
    if (!hasCapsules) {
      return renderChildEmptyState();
    }

    return (
      <ScrollView testID="child-capsule-list" style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Your Letters ({childViewCapsules.length})
          </Text>
          {childViewCapsules.map((c, i) => (
            <CapsuleCard
              key={c.id}
              capsule={c}
              index={i}
              childBirthDate={child?.dateOfBirth}
              onPress={handleCapsulePress}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  // CAPSULE-006: Render parent view
  const renderParentView = () => {
    if (!hasCapsules) {
      return renderEmptyState();
    }

    return (
      <ScrollView testID="parent-capsule-list" style={styles.scrollView}>
        {sealedCapsules.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Sealed ({sealedCapsules.length})
            </Text>
            {sealedCapsules.map((c, i) => (
              <CapsuleCard
                key={c.id}
                capsule={c}
                index={i}
                childBirthDate={child?.dateOfBirth}
                onPress={handleCapsulePress}
              />
            ))}
          </View>
        )}
        {unlockedCapsules.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Opened ({unlockedCapsules.length})
            </Text>
            {unlockedCapsules.map((c, i) => (
              <CapsuleCard
                key={c.id}
                capsule={c}
                index={i}
                childBirthDate={child?.dateOfBirth}
                onPress={handleCapsulePress}
              />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* UI-025: Confetti celebration on capsule creation */}
      <Confetti
        active={confettiActive}
        onComplete={handleConfettiComplete}
        origin={{ x: 0.5, y: 0.3 }}
      />

      {/* CAPSULE-006: Conditional rendering based on user role */}
      {isChildView ? renderChildView() : renderParentView()}

      {/* FAB to create new capsule - hidden for child view */}
      {!isChildView && hasCapsules && (
        <Pressable
          testID="create-capsule-fab"
          style={[styles.fab, Shadows.large]}
          onPress={handleOpenCreateModal}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      {/* Create Capsule Modal */}
      <CreateCapsuleModal
        visible={modalState === "createCapsule"}
        letterContent={letterContent}
        unlockOption={unlockOption}
        selectedAge={selectedAge}
        customDate={customDate}
        showDatePicker={showDatePicker}
        voiceUri={voiceUri}
        voiceDuration={voiceDuration}
        videoUri={videoUri}
        videoDuration={videoDuration}
        isValid={isValidCapsule}
        onLetterChange={setLetterContent}
        onUnlockOptionChange={setUnlockOption}
        onAgeChange={setSelectedAge}
        onCustomDateChange={setCustomDate}
        onShowDatePicker={setShowDatePicker}
        onSelectTemplate={handleSelectTemplate}
        onOpenVoiceModal={handleOpenVoiceModal}
        onRemoveVoice={handleRemoveVoice}
        onOpenVideoModal={handleOpenVideoSourceModal}
        onRemoveVideo={handleRemoveVideo}
        onSave={handleSaveCapsule}
        onClose={() => setModalState("closed")}
      />

      {/* CAPSULE-002: Voice Recording Modal */}
      <VoiceRecordingModal
        visible={showVoiceModal}
        voiceState={voiceState}
        recordingDuration={recordingDuration}
        voiceDuration={voiceDuration}
        isPlayingPreview={isPlayingPreview}
        onClose={handleCloseVoiceModal}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onPlayPreview={handlePlayPreview}
        onStopPreview={handleStopPreview}
        onReRecord={handleReRecord}
        onSave={handleSaveVoice}
      />

      {/* CAPSULE-003: Video Source Selection Modal */}
      <VideoSourceModal
        visible={showVideoSourceModal}
        onRecordVideo={handleRecordVideo}
        onSelectVideo={handleSelectVideo}
        onClose={handleCloseVideoSourceModal}
      />

      {/* CAPSULE-003: Video Preview Modal */}
      <VideoPreviewModal
        visible={showVideoModal}
        videoUri={videoUri}
        videoDuration={videoDuration}
        isPlayingVideo={isPlayingVideo}
        onPlayVideo={handlePlayVideo}
        onPauseVideo={handlePauseVideo}
        onChangeVideo={handleChangeVideo}
        onSave={handleSaveVideo}
        onClose={handleCloseVideoModal}
        videoRef={videoRef}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingVideo(false);
          }
        }}
      />
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
});
