import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Audio } from "expo-av";

export interface VoiceRecording {
  id: string;
  uri: string;
  duration: number; // milliseconds
  caption?: string;
  transcript?: string; // AI transcription (VOICE-002)
  photoUri?: string; // Attached photo (VOICE-003)
  createdAt: string;
}

// Transcription state for VOICE-002
export interface TranscriptionState {
  isTranscribing: boolean;
  transcriptionError: string | null;
}

interface VoiceJournalContextValue {
  // State
  isRecording: boolean;
  isPlaying: boolean;
  recordings: VoiceRecording[];
  currentRecording: { uri: string; duration: number } | null;
  permissionDenied: boolean;
  playbackProgress: number; // 0-1
  currentPlayingId: string | null;
  // Transcription state (VOICE-002)
  transcriptionState: TranscriptionState;

  // Recording actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<VoiceRecording | null>;
  saveRecording: (caption?: string, photoUri?: string) => void;
  discardRecording: () => void;

  // Playback actions
  playRecording: (id: string) => Promise<void>;
  pausePlayback: () => Promise<void>;
  stopPlayback: () => Promise<void>;

  // Transcription actions (VOICE-002)
  transcribeRecording: (uri: string) => Promise<string | null>;
  clearTranscriptionError: () => void;

  // Management
  deleteRecording: (id: string) => void;
  updateRecording: (id: string, updates: Partial<VoiceRecording>) => void;
}

const VoiceJournalContext = createContext<VoiceJournalContextValue | null>(
  null,
);

interface VoiceJournalProviderProps {
  children: ReactNode;
}

function generateId(): string {
  return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Mock transcription function for VOICE-002
// In production, this would call a speech-to-text API (e.g., Google Speech-to-Text, Whisper)
async function mockTranscribeAudio(
  _uri: string,
  durationMs: number,
): Promise<string> {
  // Simulate AI processing time based on audio duration
  const processingTime = Math.min(durationMs * 0.1, 3000); // Max 3 seconds
  await new Promise((resolve) => setTimeout(resolve, processingTime));

  // Return a placeholder transcript
  // In production, this would return actual transcription from AI service
  return "Voice note transcription will appear here once connected to a speech-to-text service.";
}

export function VoiceJournalProvider({ children }: VoiceJournalProviderProps) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<{
    uri: string;
    duration: number;
  } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  // Transcription state (VOICE-002)
  const [transcriptionState, setTranscriptionState] =
    useState<TranscriptionState>({
      isTranscribing: false,
      transcriptionError: null,
    });

  // Refs for audio objects
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
    }
  }, []);

  const stopRecording =
    useCallback(async (): Promise<VoiceRecording | null> => {
      try {
        if (!recordingRef.current) {
          return null;
        }

        const recording = recordingRef.current;

        // Get status before stopping
        const status = await recording.getStatusAsync();

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        // Reset audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });

        recordingRef.current = null;
        setIsRecording(false);

        if (!uri) {
          return null;
        }

        const recordingData = {
          uri,
          duration: status.durationMillis || 0,
        };
        setCurrentRecording(recordingData);

        return {
          id: "", // Will be set when saved
          ...recordingData,
          createdAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Failed to stop recording:", error);
        setIsRecording(false);
        return null;
      }
    }, []);

  const saveRecording = useCallback(
    (caption?: string, photoUri?: string): void => {
      if (!currentRecording) return;

      const voiceRecording: VoiceRecording = {
        id: generateId(),
        uri: currentRecording.uri,
        duration: currentRecording.duration,
        caption,
        photoUri,
        createdAt: new Date().toISOString(),
      };

      setRecordings((prev) => [voiceRecording, ...prev]);
      setCurrentRecording(null);
    },
    [currentRecording],
  );

  const discardRecording = useCallback((): void => {
    setCurrentRecording(null);
  }, []);

  const playRecording = useCallback(
    async (id: string): Promise<void> => {
      try {
        // Stop any existing playback
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const recording = recordings.find((r) => r.id === id);
        if (!recording) return;

        const { sound } = await Audio.Sound.createAsync({ uri: recording.uri });
        soundRef.current = sound;

        // Set up playback status updates
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackProgress(0);
              setCurrentPlayingId(null);
            } else if (status.durationMillis) {
              setPlaybackProgress(
                status.positionMillis / status.durationMillis,
              );
            }
          }
        });

        await sound.playAsync();
        setIsPlaying(true);
        setCurrentPlayingId(id);
      } catch (error) {
        console.error("Failed to play recording:", error);
        setIsPlaying(false);
      }
    },
    [recordings],
  );

  const pausePlayback = useCallback(async (): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Failed to pause playback:", error);
    }
  }, []);

  const stopPlayback = useCallback(async (): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
        setPlaybackProgress(0);
        setCurrentPlayingId(null);
      }
    } catch (error) {
      console.error("Failed to stop playback:", error);
    }
  }, []);

  // Transcription function (VOICE-002)
  const transcribeRecording = useCallback(
    async (uri: string): Promise<string | null> => {
      try {
        setTranscriptionState({
          isTranscribing: true,
          transcriptionError: null,
        });

        // Get duration from current recording if available
        const duration = currentRecording?.duration || 5000;

        // Call mock transcription (would be real API in production)
        const transcript = await mockTranscribeAudio(uri, duration);

        setTranscriptionState({
          isTranscribing: false,
          transcriptionError: null,
        });

        return transcript;
      } catch (error) {
        console.error("Failed to transcribe recording:", error);
        setTranscriptionState({
          isTranscribing: false,
          transcriptionError:
            error instanceof Error
              ? error.message
              : "Transcription failed. Please try again.",
        });
        return null;
      }
    },
    [currentRecording?.duration],
  );

  // Clear transcription error (VOICE-002)
  const clearTranscriptionError = useCallback((): void => {
    setTranscriptionState((prev) => ({
      ...prev,
      transcriptionError: null,
    }));
  }, []);

  const deleteRecording = useCallback((id: string): void => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRecording = useCallback(
    (id: string, updates: Partial<VoiceRecording>): void => {
      setRecordings((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );
    },
    [],
  );

  const value: VoiceJournalContextValue = {
    isRecording,
    isPlaying,
    recordings,
    currentRecording,
    permissionDenied,
    playbackProgress,
    currentPlayingId,
    transcriptionState, // VOICE-002
    startRecording,
    stopRecording,
    saveRecording,
    discardRecording,
    playRecording,
    pausePlayback,
    stopPlayback,
    transcribeRecording, // VOICE-002
    clearTranscriptionError, // VOICE-002
    deleteRecording,
    updateRecording,
  };

  return (
    <VoiceJournalContext.Provider value={value}>
      {children}
    </VoiceJournalContext.Provider>
  );
}

export function useVoiceJournal(): VoiceJournalContextValue {
  const context = useContext(VoiceJournalContext);
  if (context === null) {
    throw new Error(
      "useVoiceJournal must be used within a VoiceJournalProvider",
    );
  }
  return context;
}
