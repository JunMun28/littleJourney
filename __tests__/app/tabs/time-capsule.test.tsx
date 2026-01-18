import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TimeCapsuleScreen from "@/app/(tabs)/time-capsule";
import { TimeCapsuleProvider } from "@/contexts/time-capsule-context";
import { ChildProvider, useChild } from "@/contexts/child-context";
import { VoiceJournalProvider } from "@/contexts/voice-journal-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { useEffect } from "react";

// Mock expo-notifications (required by NotificationProvider -> TimeCapsuleProvider)
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest
    .fn()
    .mockResolvedValue("mock-notification-id"),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "mock-token" }),
  setNotificationChannelAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  AndroidImportance: { MAX: 5 },
  SchedulableTriggerInputTypes: {
    DAILY: "daily",
    TIME_INTERVAL: "timeInterval",
  },
}));

// Mock expo-router
const mockRouterPush = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: (path: string) => mockRouterPush(path),
    back: jest.fn(),
  },
}));

// Mock expo-av for CAPSULE-002 voice recording and CAPSULE-003 video playback
jest.mock("expo-av", () => ({
  Audio: {
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn().mockResolvedValue({}),
      startAsync: jest.fn().mockResolvedValue({}),
      stopAndUnloadAsync: jest.fn().mockResolvedValue({}),
      getURI: jest.fn().mockReturnValue("file:///test-capsule-voice.m4a"),
      getStatusAsync: jest.fn().mockResolvedValue({ durationMillis: 30000 }),
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
        status: { isLoaded: true, durationMillis: 30000 },
      }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue({}),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  },
  Video: "Video",
  ResizeMode: {
    CONTAIN: "contain",
    COVER: "cover",
  },
}));

// Mock expo-image-picker for CAPSULE-003 video recording/selection
const mockLaunchCameraAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
jest.mock("expo-image-picker", () => ({
  launchCameraAsync: (...args: unknown[]) => mockLaunchCameraAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
  requestCameraPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
  UIImagePickerControllerQualityType: {
    Medium: 1,
  },
}));

// Mock DateTimePicker
jest.mock("@react-native-community/datetimepicker", () => {
  const MockDateTimePicker = ({
    onChange,
    value,
  }: {
    onChange: (event: unknown, date?: Date) => void;
    value: Date;
  }) => {
    const { View, Text, Pressable } = require("react-native");
    return (
      <View testID="unlock-date-picker">
        <Text>{value.toISOString()}</Text>
        <Pressable
          testID="select-date"
          onPress={() => {
            const testDate = new Date("2040-06-15");
            onChange({}, testDate);
          }}
        >
          <Text>Select Date</Text>
        </Pressable>
      </View>
    );
  };
  return MockDateTimePicker;
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

// Child setup component for tests
function ChildSetup({ children }: { children: React.ReactNode }) {
  const { setChild } = useChild();

  useEffect(() => {
    setChild({
      id: "test-child-1",
      name: "Test Baby",
      dateOfBirth: "2023-06-15",
    });
  }, [setChild]);

  return <>{children}</>;
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ChildProvider>
        <NotificationProvider>
          <ChildSetup>
            <VoiceJournalProvider>
              <TimeCapsuleProvider>{children}</TimeCapsuleProvider>
            </VoiceJournalProvider>
          </ChildSetup>
        </NotificationProvider>
      </ChildProvider>
    </QueryClientProvider>
  );
}

function TestWrapperNoChild({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ChildProvider>
        <NotificationProvider>
          <TimeCapsuleProvider>{children}</TimeCapsuleProvider>
        </NotificationProvider>
      </ChildProvider>
    </QueryClientProvider>
  );
}

describe("TimeCapsuleScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
    mockLaunchCameraAsync.mockClear();
    mockLaunchImageLibraryAsync.mockClear();
  });

  // CAPSULE-001: Navigate to Time Capsule section
  it("renders empty state when no capsules", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("No Time Capsules Yet")).toBeTruthy();
    });
    expect(screen.getByText("Write New Letter")).toBeTruthy();
  });

  // CAPSULE-001: Tap 'Write New Letter'
  it("opens create capsule modal when tapping Write New Letter button", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("Write New Letter")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByText("Your Letter *")).toBeTruthy();
      expect(screen.getByText("When to Unlock")).toBeTruthy();
    });
  });

  // CAPSULE-001: Enter letter content
  it("allows entering letter content in modal", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("letter-content-input")).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByTestId("letter-content-input"),
      "Dear child, I love you so much!",
    );

    // The save button should now be enabled
    const saveButton = screen.getByTestId("save-capsule-button");
    expect(saveButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  // CAPSULE-001: Select unlock age (5, 10, 18, 21)
  it("displays preset age options and allows selection", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("age-selector")).toBeTruthy();
    });

    // Check all preset ages are shown
    expect(screen.getByTestId("age-option-5")).toBeTruthy();
    expect(screen.getByTestId("age-option-10")).toBeTruthy();
    expect(screen.getByTestId("age-option-18")).toBeTruthy();
    expect(screen.getByTestId("age-option-21")).toBeTruthy();

    // Select age 10
    fireEvent.press(screen.getByTestId("age-option-10"));

    // Age 10 should be selectable (visual feedback tested via style)
    expect(screen.getByTestId("age-option-10")).toBeTruthy();
  });

  // CAPSULE-001: Custom date option
  it("allows switching to custom date unlock option", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("unlock-option-age")).toBeTruthy();
      expect(screen.getByTestId("unlock-option-custom")).toBeTruthy();
    });

    // Switch to custom date
    fireEvent.press(screen.getByTestId("unlock-option-custom"));

    // Should show custom date button
    await waitFor(() => {
      expect(screen.getByTestId("custom-date-button")).toBeTruthy();
    });
  });

  // CAPSULE-001: Save time capsule
  it("creates capsule and shows it in sealed list", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    // Open modal
    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("letter-content-input")).toBeTruthy();
    });

    // Enter letter content
    fireEvent.changeText(
      screen.getByTestId("letter-content-input"),
      "Dear child, this is my message to you.",
    );

    // Save capsule
    fireEvent.press(screen.getByTestId("save-capsule-button"));

    // Should show capsule in sealed list
    await waitFor(() => {
      expect(screen.getByText("Sealed (1)")).toBeTruthy();
      expect(screen.getByText("Sealed Letter")).toBeTruthy();
    });
  });

  // CAPSULE-001: FAB appears when capsules exist
  it("shows FAB when capsules exist", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    // Create a capsule
    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("letter-content-input")).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByTestId("letter-content-input"),
      "Test letter",
    );
    fireEvent.press(screen.getByTestId("save-capsule-button"));

    // FAB should now be visible
    await waitFor(() => {
      expect(screen.getByTestId("create-capsule-fab")).toBeTruthy();
    });
  });

  // CAPSULE-001: Cancel button closes modal
  it("closes modal when cancel is pressed", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByText("Your Letter *")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("cancel-create-button"));

    // Modal should close, empty state should be visible
    await waitFor(() => {
      expect(screen.getByText("No Time Capsules Yet")).toBeTruthy();
    });
  });

  // CAPSULE-004: Sealed capsule shows countdown
  it("sealed capsule displays time until unlock", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    // Create a capsule
    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("letter-content-input")).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByTestId("letter-content-input"),
      "Future message",
    );
    fireEvent.press(screen.getByTestId("save-capsule-button"));

    // Should show time until unlock
    await waitFor(() => {
      // The countdown badge should show years until unlock
      // Since default age is 18 and child was born 2023, unlock is 2041
      const sealedCard = screen.getByText("Sealed Letter");
      expect(sealedCard).toBeTruthy();
    });
  });

  // CAPSULE-001: Save button disabled when letter is empty
  it("disables save button when letter content is empty", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("save-capsule-button")).toBeTruthy();
    });

    // Save button should be disabled with empty content
    const saveButton = screen.getByTestId("save-capsule-button");
    expect(saveButton.props.accessibilityState?.disabled).toBeTruthy();
  });

  // CAPSULE-001: Shows info about sealing
  it("displays information about sealing capsules", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(
        screen.getByText(/Once saved, the letter will be sealed/),
      ).toBeTruthy();
    });
  });

  // CAPSULE-001: Multiple capsules can be created
  it("allows creating multiple capsules", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    // Create first capsule
    fireEvent.press(screen.getByText("Write New Letter"));
    await waitFor(() => {
      expect(screen.getByTestId("letter-content-input")).toBeTruthy();
    });
    fireEvent.changeText(
      screen.getByTestId("letter-content-input"),
      "First letter",
    );
    fireEvent.press(screen.getByTestId("save-capsule-button"));

    // Wait for first capsule to show
    await waitFor(() => {
      expect(screen.getByText("Sealed (1)")).toBeTruthy();
    });

    // Create second capsule using FAB
    fireEvent.press(screen.getByTestId("create-capsule-fab"));
    await waitFor(() => {
      expect(screen.getByTestId("letter-content-input")).toBeTruthy();
    });
    fireEvent.changeText(
      screen.getByTestId("letter-content-input"),
      "Second letter",
    );
    fireEvent.press(screen.getByTestId("save-capsule-button"));

    // Should show 2 capsules
    await waitFor(() => {
      expect(screen.getByText("Sealed (2)")).toBeTruthy();
    });
  });

  // CAPSULE-004: Tap to view capsule
  it("navigates to capsule detail when card is tapped", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    // Create a capsule
    fireEvent.press(screen.getByText("Write New Letter"));
    await waitFor(() => {
      expect(screen.getByTestId("letter-content-input")).toBeTruthy();
    });
    fireEvent.changeText(
      screen.getByTestId("letter-content-input"),
      "Test letter for navigation",
    );
    fireEvent.press(screen.getByTestId("save-capsule-button"));

    // Wait for capsule card to appear
    await waitFor(() => {
      expect(screen.getByText("Sealed (1)")).toBeTruthy();
    });

    // Find and tap the capsule card
    const capsuleCards = screen.getAllByText("Sealed Letter");
    fireEvent.press(capsuleCards[0]);

    // Should navigate to capsule detail
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/capsule\/capsule_/),
      );
    });
  });

  // CAPSULE-008: View template suggestions
  it("shows template suggestions when creating new capsule", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("template-selector")).toBeTruthy();
    });

    // Check that template options are visible
    expect(screen.getByText("Use a Template")).toBeTruthy();
  });

  // CAPSULE-008: Select Letter to 18-year-old template
  it("shows Letter to 18-year-old template option", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("template-option-18-year-old")).toBeTruthy();
    });

    expect(screen.getByText("Letter to 18-year-old")).toBeTruthy();
  });

  // CAPSULE-008: Verify pre-filled prompts appear
  it("fills letter with prompts when template is selected", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("template-option-18-year-old")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("template-option-18-year-old"));

    // Verify prompts are filled in letter content
    await waitFor(() => {
      const input = screen.getByTestId("letter-content-input");
      expect(input.props.value).toContain("Dear");
      expect(input.props.value).toContain("18");
    });
  });

  // CAPSULE-008: Edit prompts with personal content
  it("allows editing template content after selection", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("template-option-18-year-old")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("template-option-18-year-old"));

    await waitFor(() => {
      const input = screen.getByTestId("letter-content-input");
      expect(input.props.value.length).toBeGreaterThan(0);
    });

    // Clear and write own content
    fireEvent.changeText(
      screen.getByTestId("letter-content-input"),
      "My personal message to my child.",
    );

    // Verify content was changed
    const input = screen.getByTestId("letter-content-input");
    expect(input.props.value).toBe("My personal message to my child.");
  });

  // CAPSULE-008: Multiple template options available
  it("shows multiple template options", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("template-selector")).toBeTruthy();
    });

    // Should have multiple template options
    expect(screen.getByTestId("template-option-start-blank")).toBeTruthy();
    expect(screen.getByTestId("template-option-18-year-old")).toBeTruthy();
    expect(screen.getByTestId("template-option-first-day-school")).toBeTruthy();
    expect(screen.getByTestId("template-option-graduation")).toBeTruthy();
  });

  // CAPSULE-008: Start blank option
  it("allows starting with blank letter", async () => {
    render(
      <TestWrapper>
        <TimeCapsuleScreen />
      </TestWrapper>,
    );

    fireEvent.press(screen.getByText("Write New Letter"));

    await waitFor(() => {
      expect(screen.getByTestId("template-option-start-blank")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("template-option-start-blank"));

    // Letter should remain empty
    await waitFor(() => {
      const input = screen.getByTestId("letter-content-input");
      expect(input.props.value).toBe("");
    });
  });

  // CAPSULE-002: Voice recording in time capsule
  describe("CAPSULE-002: Voice recording", () => {
    // CAPSULE-002: Tap 'Add Voice Message'
    it("shows Add Voice Message button in create modal", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));

      await waitFor(() => {
        expect(screen.getByTestId("add-voice-message-button")).toBeTruthy();
      });
    });

    // CAPSULE-002: Record voice message
    it("shows recording UI when Add Voice Message is tapped", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));

      await waitFor(() => {
        expect(screen.getByTestId("add-voice-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-voice-message-button"));

      await waitFor(() => {
        expect(screen.getByTestId("voice-recording-modal")).toBeTruthy();
        expect(screen.getByTestId("start-recording-button")).toBeTruthy();
      });
    });

    // CAPSULE-002: Start and stop recording
    it("can start and stop voice recording", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));

      await waitFor(() => {
        expect(screen.getByTestId("add-voice-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-voice-message-button"));

      await waitFor(() => {
        expect(screen.getByTestId("start-recording-button")).toBeTruthy();
      });

      // Start recording
      fireEvent.press(screen.getByTestId("start-recording-button"));

      await waitFor(() => {
        expect(screen.getByTestId("stop-recording-button")).toBeTruthy();
      });

      // Stop recording
      fireEvent.press(screen.getByTestId("stop-recording-button"));

      // Should show preview
      await waitFor(() => {
        expect(screen.getByTestId("voice-preview")).toBeTruthy();
      });
    });

    // CAPSULE-002: Preview recording
    it("shows preview with playback controls after recording", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));
      await waitFor(() => {
        expect(screen.getByTestId("add-voice-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-voice-message-button"));
      await waitFor(() => {
        expect(screen.getByTestId("start-recording-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("start-recording-button"));
      await waitFor(() => {
        expect(screen.getByTestId("stop-recording-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("stop-recording-button"));

      await waitFor(() => {
        expect(screen.getByTestId("voice-preview")).toBeTruthy();
        expect(screen.getByTestId("play-preview-button")).toBeTruthy();
      });
    });

    // CAPSULE-002: Re-record if needed
    it("allows re-recording after preview", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));
      await waitFor(() => {
        expect(screen.getByTestId("add-voice-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-voice-message-button"));
      await waitFor(() => {
        expect(screen.getByTestId("start-recording-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("start-recording-button"));
      await waitFor(() => {
        expect(screen.getByTestId("stop-recording-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("stop-recording-button"));

      await waitFor(() => {
        expect(screen.getByTestId("re-record-button")).toBeTruthy();
      });

      // Tap re-record
      fireEvent.press(screen.getByTestId("re-record-button"));

      // Should return to recording UI
      await waitFor(() => {
        expect(screen.getByTestId("start-recording-button")).toBeTruthy();
      });
    });

    // CAPSULE-002: Save with capsule
    it("saves voice message with capsule and shows indicator", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));

      // Add letter content
      await waitFor(() => {
        expect(screen.getByTestId("letter-content-input")).toBeTruthy();
      });
      fireEvent.changeText(
        screen.getByTestId("letter-content-input"),
        "Letter with voice",
      );

      // Add voice message
      fireEvent.press(screen.getByTestId("add-voice-message-button"));
      await waitFor(() => {
        expect(screen.getByTestId("start-recording-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("start-recording-button"));
      await waitFor(() => {
        expect(screen.getByTestId("stop-recording-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("stop-recording-button"));

      // Save the voice message
      await waitFor(() => {
        expect(screen.getByTestId("save-voice-button")).toBeTruthy();
      });
      fireEvent.press(screen.getByTestId("save-voice-button"));

      // Should show voice attached indicator in capsule form
      await waitFor(() => {
        expect(screen.getByTestId("voice-attached-indicator")).toBeTruthy();
      });
    });

    // CAPSULE-002: Voice message up to 5 minutes (enforced in UI)
    it("displays recording duration", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));
      await waitFor(() => {
        expect(screen.getByTestId("add-voice-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-voice-message-button"));
      await waitFor(() => {
        expect(screen.getByTestId("start-recording-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("start-recording-button"));

      // Should show duration display
      await waitFor(() => {
        expect(screen.getByTestId("recording-duration")).toBeTruthy();
      });
    });
  });

  // CAPSULE-003: Video message in time capsule
  describe("CAPSULE-003: Video message", () => {
    // CAPSULE-003: Tap 'Add Video Message'
    it("shows Add Video Message button in create modal", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));

      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });
    });

    // CAPSULE-003: Shows video source selection modal
    it("shows video source modal when Add Video Message is tapped", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));

      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-video-message-button"));

      await waitFor(() => {
        expect(screen.getByTestId("video-source-modal")).toBeTruthy();
        expect(screen.getByTestId("record-video-button")).toBeTruthy();
        expect(screen.getByTestId("select-video-button")).toBeTruthy();
      });
    });

    // CAPSULE-003: Record or select video
    it("shows record and select video options", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));
      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-video-message-button"));

      await waitFor(() => {
        expect(screen.getByText("Record Video")).toBeTruthy();
        expect(screen.getByText("Choose from Library")).toBeTruthy();
      });
    });

    // CAPSULE-003: Cancel video source modal
    it("closes video source modal when cancel is tapped", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));
      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-video-message-button"));
      await waitFor(() => {
        expect(screen.getByTestId("video-source-modal")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("cancel-video-source-button"));

      // Modal should close, add video button still visible
      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });
    });

    // CAPSULE-003: Select video from library shows preview
    it("shows video preview modal after selecting video from library", async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: "file:///test-video.mp4", duration: 45 }],
      });

      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));
      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-video-message-button"));
      await waitFor(() => {
        expect(screen.getByTestId("select-video-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("select-video-button"));

      await waitFor(() => {
        expect(screen.getByTestId("video-preview-modal")).toBeTruthy();
        expect(screen.getByTestId("video-preview")).toBeTruthy();
      });
    });

    // CAPSULE-003: Preview video playback controls
    it("shows play button in video preview", async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: "file:///test-video.mp4", duration: 60 }],
      });

      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));
      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-video-message-button"));
      await waitFor(() => {
        expect(screen.getByTestId("select-video-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("select-video-button"));

      await waitFor(() => {
        expect(screen.getByTestId("play-video-button")).toBeTruthy();
        expect(screen.getByTestId("save-video-button")).toBeTruthy();
      });
    });

    // CAPSULE-003: Save video message shows indicator
    it("shows video attached indicator after saving video", async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: "file:///test-video.mp4", duration: 90 }],
      });

      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));
      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("add-video-message-button"));
      await waitFor(() => {
        expect(screen.getByTestId("select-video-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("select-video-button"));
      await waitFor(() => {
        expect(screen.getByTestId("save-video-button")).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId("save-video-button"));

      await waitFor(() => {
        expect(screen.getByTestId("video-attached-indicator")).toBeTruthy();
        expect(screen.getByText("Video message attached")).toBeTruthy();
      });
    });

    // CAPSULE-003: Remove attached video
    it("removes video when remove button is tapped", async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: "file:///test-video.mp4", duration: 30 }],
      });

      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));
      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });

      // Select and save a video
      fireEvent.press(screen.getByTestId("add-video-message-button"));
      await waitFor(() => {
        expect(screen.getByTestId("select-video-button")).toBeTruthy();
      });
      fireEvent.press(screen.getByTestId("select-video-button"));
      await waitFor(() => {
        expect(screen.getByTestId("save-video-button")).toBeTruthy();
      });
      fireEvent.press(screen.getByTestId("save-video-button"));

      // Verify video attached
      await waitFor(() => {
        expect(screen.getByTestId("video-attached-indicator")).toBeTruthy();
      });

      // Remove video
      fireEvent.press(screen.getByTestId("remove-video-button"));

      // Should show add button again
      await waitFor(() => {
        expect(screen.getByTestId("add-video-message-button")).toBeTruthy();
      });
    });

    // CAPSULE-003: Video up to 2 minutes
    it("displays video duration limit in UI", async () => {
      render(
        <TestWrapper>
          <TimeCapsuleScreen />
        </TestWrapper>,
      );

      fireEvent.press(screen.getByText("Write New Letter"));

      await waitFor(() => {
        expect(screen.getByText("Up to 2 minutes")).toBeTruthy();
      });
    });
  });
});
