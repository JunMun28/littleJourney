import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import {
  VoiceJournalProvider,
  useVoiceJournal,
  type VoiceRecording,
} from "@/contexts/voice-journal-context";
import { Audio } from "expo-av";

// Mock expo-av
jest.mock("expo-av", () => ({
  Audio: {
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn().mockResolvedValue({}),
      startAsync: jest.fn().mockResolvedValue({}),
      stopAndUnloadAsync: jest.fn().mockResolvedValue({}),
      getURI: jest.fn().mockReturnValue("file:///test-recording.m4a"),
      getStatusAsync: jest.fn().mockResolvedValue({ durationMillis: 5000 }),
    })),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue({}),
          pauseAsync: jest.fn().mockResolvedValue({}),
          stopAsync: jest.fn().mockResolvedValue({}),
          unloadAsync: jest.fn().mockResolvedValue({}),
          setOnPlaybackStatusUpdate: jest.fn(),
          getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true }),
        },
        status: { isLoaded: true, durationMillis: 5000 },
      }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue({}),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <VoiceJournalProvider>{children}</VoiceJournalProvider>;
}

describe("VoiceJournalContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useVoiceJournal hook", () => {
    it("throws error when used outside provider", () => {
      // Suppress console.error for this test
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useVoiceJournal());
      }).toThrow("useVoiceJournal must be used within a VoiceJournalProvider");

      spy.mockRestore();
    });

    it("provides initial state", () => {
      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      expect(result.current.isRecording).toBe(false);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.recordings).toEqual([]);
      expect(result.current.currentRecording).toBeNull();
    });
  });

  describe("recording functionality", () => {
    it("requests permission before recording", async () => {
      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    });

    it("starts recording and sets isRecording to true", async () => {
      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);
    });

    it("stops recording and returns recording data", async () => {
      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      let recordingResult: VoiceRecording | null = null;
      await act(async () => {
        recordingResult = await result.current.stopRecording();
      });

      expect(result.current.isRecording).toBe(false);
      expect(recordingResult).not.toBeNull();
      expect(recordingResult!.uri).toBe("file:///test-recording.m4a");
      expect(recordingResult!.duration).toBe(5000);
    });

    it("adds recording to recordings list after save", async () => {
      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      await act(async () => {
        result.current.saveRecording("Test voice note");
      });

      expect(result.current.recordings.length).toBe(1);
      expect(result.current.recordings[0].caption).toBe("Test voice note");
    });

    it("handles permission denied", async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: false,
      });

      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(false);
      expect(result.current.permissionDenied).toBe(true);
    });
  });

  describe("playback functionality", () => {
    it("plays recording and sets isPlaying to true", async () => {
      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      // Create a recording first
      await act(async () => {
        await result.current.startRecording();
      });
      await act(async () => {
        await result.current.stopRecording();
      });
      await act(async () => {
        result.current.saveRecording("Test");
      });

      const recordingId = result.current.recordings[0].id;

      await act(async () => {
        await result.current.playRecording(recordingId);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it("pauses playback", async () => {
      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });
      await act(async () => {
        await result.current.stopRecording();
      });
      await act(async () => {
        result.current.saveRecording("Test");
      });

      const recordingId = result.current.recordings[0].id;

      await act(async () => {
        await result.current.playRecording(recordingId);
      });
      await act(async () => {
        await result.current.pausePlayback();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("recording management", () => {
    it("deletes recording", async () => {
      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });
      await act(async () => {
        await result.current.stopRecording();
      });
      await act(async () => {
        result.current.saveRecording("Test");
      });

      expect(result.current.recordings.length).toBe(1);
      const recordingId = result.current.recordings[0].id;

      await act(async () => {
        result.current.deleteRecording(recordingId);
      });

      expect(result.current.recordings.length).toBe(0);
    });

    it("discards current recording without saving", async () => {
      const { result } = renderHook(() => useVoiceJournal(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });
      await act(async () => {
        await result.current.stopRecording();
      });

      expect(result.current.currentRecording).not.toBeNull();

      await act(async () => {
        result.current.discardRecording();
      });

      expect(result.current.currentRecording).toBeNull();
      expect(result.current.recordings.length).toBe(0);
    });
  });
});
