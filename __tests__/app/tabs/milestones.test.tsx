import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MilestonesScreen from "@/app/(tabs)/milestones";
import { NotificationProvider } from "@/contexts/notification-context";
import { CommunityProvider, useCommunity } from "@/contexts/community-context";
import {
  milestoneApi,
  childApi,
  clearAllMockData,
} from "@/services/api-client";
import { Text, Pressable } from "react-native";

// Mock expo-notifications
const mockScheduleMilestoneReminder = jest.fn();
const mockCancelMilestoneReminder = jest.fn();

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest
    .fn()
    .mockResolvedValue({ data: "mock-push-token" }),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest
    .fn()
    .mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest
    .fn()
    .mockReturnValue({ remove: jest.fn() }),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: {
    DAILY: "daily",
    TIME_INTERVAL: "timeInterval",
  },
  AndroidImportance: {
    MAX: 5,
  },
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

// Mock DateTimePicker - returns a date 30 days in the future for testing
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
      <View testID="date-time-picker">
        <Text>{value.toISOString()}</Text>
        <Pressable
          testID="select-date"
          onPress={() => {
            // Set date 30 days in the future for reminder scheduling to work
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            onChange({}, futureDate);
          }}
        >
          <Text>Select Date</Text>
        </Pressable>
      </View>
    );
  };
  return MockDateTimePicker;
});

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: "test-photo.jpg" }],
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    status: "granted",
  }),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper for tests
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <CommunityProvider>{children}</CommunityProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

// Helper component to enable community sharing for tests
function CommunityEnabler({ children }: { children: React.ReactNode }) {
  const { setCommunityDataSharingEnabled } = useCommunity();
  return (
    <>
      <Pressable
        testID="enable-community"
        onPress={() => setCommunityDataSharingEnabled(true)}
      >
        <Text>Enable Community</Text>
      </Pressable>
      {children}
    </>
  );
}

// Helper to create test child via API - returns child with guaranteed ID
async function createTestChild(
  culturalTradition: "chinese" | "malay" | "indian" | "none" = "none",
  dateOfBirth = "2024-06-15",
): Promise<{ id: string }> {
  const result = await childApi.createChild({
    name: "Test Baby",
    dateOfBirth,
    culturalTradition,
  });
  if ("data" in result && result.data && result.data.id) {
    return { id: result.data.id };
  }
  throw new Error("Failed to create test child with ID");
}

// Async helper to add a milestone before rendering (uses actual child ID)
async function addTestMilestone(childId: string) {
  await milestoneApi.createMilestone({
    templateId: "first_smile",
    childId,
    milestoneDate: "2024-07-15",
  });
}

describe("MilestonesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllMockData();
  });

  it("renders empty state when no milestones", async () => {
    await createTestChild();

    render(
      <TestWrapper>
        <MilestonesScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("No Milestones Yet")).toBeTruthy();
    });
    expect(screen.getByText("Add First Milestone")).toBeTruthy();
  });

  it("renders milestone cards in upcoming section", async () => {
    const child = await createTestChild();
    await addTestMilestone(child.id!);

    render(
      <TestWrapper>
        <MilestonesScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Upcoming/)).toBeTruthy();
    });
    expect(screen.getByText("First Smile")).toBeTruthy();
  });

  // PRD Section 5.3 - Upcoming milestones with countdown
  describe("milestone countdown", () => {
    it("shows countdown days for upcoming milestones", async () => {
      const child = await createTestChild();
      // Create milestone 10 days from now using local date to avoid timezone issues
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      futureDate.setHours(12, 0, 0, 0); // Set to noon to avoid edge cases
      const futureDateStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`;
      await milestoneApi.createMilestone({
        templateId: "first_smile",
        childId: child.id,
        milestoneDate: futureDateStr,
      });

      render(
        <TestWrapper>
          <MilestonesScreen />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/in 10 days/i)).toBeTruthy();
      });
    });

    it("shows 'Tomorrow' for milestone 1 day away", async () => {
      const child = await createTestChild();
      // Use local date to avoid timezone issues
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0); // Set to noon to avoid edge cases
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
      await milestoneApi.createMilestone({
        templateId: "first_smile",
        childId: child.id,
        milestoneDate: tomorrowStr,
      });

      render(
        <TestWrapper>
          <MilestonesScreen />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/Tomorrow/i)).toBeTruthy();
      });
    });

    it("shows 'Today' for milestone on current day", async () => {
      const child = await createTestChild();
      // Use local date to avoid timezone issues
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Set to noon to avoid edge cases
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      await milestoneApi.createMilestone({
        templateId: "first_smile",
        childId: child.id,
        milestoneDate: todayStr,
      });

      render(
        <TestWrapper>
          <MilestonesScreen />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/Today/i)).toBeTruthy();
      });
    });
  });

  it("opens completion modal when tapping upcoming milestone card", async () => {
    const child = await createTestChild();
    await addTestMilestone(child.id!);

    render(
      <TestWrapper>
        <MilestonesScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("First Smile")).toBeTruthy();
    });

    // Tap the milestone card
    fireEvent.press(screen.getByText("First Smile"));

    // Should show completion modal
    await waitFor(() => {
      expect(screen.getByText("Mark as Completed")).toBeTruthy();
    });
  });

  it("completes milestone with celebration date and notes", async () => {
    const child = await createTestChild();
    await addTestMilestone(child.id!);

    render(
      <TestWrapper>
        <MilestonesScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("First Smile")).toBeTruthy();
    });

    // Tap the milestone card
    fireEvent.press(screen.getByText("First Smile"));

    await waitFor(() => {
      expect(screen.getByText("Mark as Completed")).toBeTruthy();
    });

    // Add notes
    fireEvent.changeText(
      screen.getByPlaceholderText("Add notes about this milestone..."),
      "Such a special moment!",
    );

    // Complete the milestone
    fireEvent.press(screen.getByText("Complete Milestone"));

    // Should move to completed section (look for section title with count)
    await waitFor(() => {
      expect(screen.getByText(/Completed \(1\)/)).toBeTruthy();
    });
    expect(screen.queryByText(/Upcoming/)).toBeNull();
  });

  it("shows delete option in completion modal", async () => {
    const child = await createTestChild();
    await addTestMilestone(child.id!);

    render(
      <TestWrapper>
        <MilestonesScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("First Smile")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("First Smile"));

    await waitFor(() => {
      expect(screen.getByText("Delete Milestone")).toBeTruthy();
    });
  });

  it("uses child ID from API when creating milestones", async () => {
    const child = await createTestChild("chinese");

    render(
      <TestWrapper>
        <MilestonesScreen />
      </TestWrapper>,
    );

    // Open template selection
    await waitFor(() => {
      expect(screen.getByText("Add First Milestone")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Add First Milestone"));

    // Wait for Chinese templates to appear (child loaded)
    await waitFor(() => {
      expect(screen.getByText(/Full Month/)).toBeTruthy();
    });

    // Add milestone
    fireEvent.press(screen.getByText("First Smile"));

    // Wait for milestone to be created and verify it uses correct childId
    await waitFor(async () => {
      const result = await milestoneApi.getMilestones();
      // Verify milestone was created with correct childId
      if (!("data" in result) || !result.data) {
        throw new Error("Expected data in result");
      }
      const milestones = result.data;
      expect(milestones.length).toBeGreaterThan(0);
      // Find the milestone we just created
      const createdMilestone = milestones.find((m) => m.childId === child.id);
      expect(createdMilestone).toBeTruthy();
    });
  });

  // Milestone reminder notification integration tests (PRD 7.1)
  describe("milestone reminder notifications", () => {
    const mockScheduleNotification =
      require("expo-notifications").scheduleNotificationAsync;
    const mockCancelNotification =
      require("expo-notifications").cancelScheduledNotificationAsync;

    beforeEach(() => {
      mockScheduleNotification.mockClear();
      mockCancelNotification.mockClear();
    });

    it("schedules reminder notification when adding milestone from template", async () => {
      // Create child with today's DOB so Zhua Zhou (365 days) is in the future
      const today = new Date().toISOString().split("T")[0];
      await createTestChild("chinese", today);

      render(
        <TestWrapper>
          <MilestonesScreen />
        </TestWrapper>,
      );

      // Open template selection
      await waitFor(() => {
        expect(screen.getByText("Add First Milestone")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Add First Milestone"));

      // Wait for Chinese milestones to appear (child data loaded)
      await waitFor(() => {
        expect(screen.getByText(/Zhua Zhou/)).toBeTruthy();
      });

      // Add a milestone from template (Zhua Zhou is 365 days from birth - in future)
      fireEvent.press(screen.getByText(/Zhua Zhou/));

      // Should schedule a reminder notification
      await waitFor(() => {
        expect(mockScheduleNotification).toHaveBeenCalled();
      });

      // Check the notification was scheduled with milestone-reminder identifier
      const calls = mockScheduleNotification.mock.calls;
      const reminderCall = calls.find(
        (call: unknown[]) =>
          typeof call[0] === "object" &&
          call[0] !== null &&
          "identifier" in call[0] &&
          String((call[0] as { identifier: string }).identifier).includes(
            "milestone-reminder",
          ),
      );
      expect(reminderCall).toBeTruthy();
    });

    it("schedules reminder notification when adding custom milestone", async () => {
      // Create child with specific cultural tradition so we know templates list is from loaded child
      await createTestChild("chinese");

      render(
        <TestWrapper>
          <MilestonesScreen />
        </TestWrapper>,
      );

      // Wait for child to load and modal to be available
      await waitFor(() => {
        expect(screen.getByText("Add First Milestone")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Add First Milestone"));

      // Wait for Chinese templates to appear (confirms child data is loaded with ID)
      await waitFor(() => {
        expect(screen.getByText(/Full Month/)).toBeTruthy();
      });

      // Open custom milestone modal
      fireEvent.press(screen.getByText("+ Custom Milestone"));

      await waitFor(() => {
        expect(screen.getByText("Custom Milestone")).toBeTruthy();
      });

      // Fill in custom milestone
      fireEvent.changeText(
        screen.getByPlaceholderText("e.g., First Laugh"),
        "First High Five",
      );

      // Open date picker and select future date (triggers mock)
      const dateButton = screen.getByText(
        new Date().toLocaleDateString("en-SG"),
      );
      fireEvent.press(dateButton);

      await waitFor(() => {
        expect(screen.getByTestId("date-time-picker")).toBeTruthy();
      });

      // Select the future date from mock
      fireEvent.press(screen.getByTestId("select-date"));

      // Submit
      fireEvent.press(screen.getByText("Add Milestone"));

      // Should schedule a reminder notification
      await waitFor(() => {
        expect(mockScheduleNotification).toHaveBeenCalled();
      });
    });

    it("cancels reminder notification when completing milestone", async () => {
      const child = await createTestChild();
      await addTestMilestone(child.id!);

      render(
        <TestWrapper>
          <MilestonesScreen />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("First Smile")).toBeTruthy();
      });

      // Open completion modal
      fireEvent.press(screen.getByText("First Smile"));

      await waitFor(() => {
        expect(screen.getByText("Complete Milestone")).toBeTruthy();
      });

      // Complete the milestone
      fireEvent.press(screen.getByText("Complete Milestone"));

      // Should cancel the reminder notification
      await waitFor(() => {
        expect(mockCancelNotification).toHaveBeenCalled();
      });
    });

    it("cancels reminder notification when deleting milestone", async () => {
      const child = await createTestChild();
      await addTestMilestone(child.id!);

      render(
        <TestWrapper>
          <MilestonesScreen />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("First Smile")).toBeTruthy();
      });

      // Open completion modal
      fireEvent.press(screen.getByText("First Smile"));

      await waitFor(() => {
        expect(screen.getByText("Delete Milestone")).toBeTruthy();
      });

      // Delete the milestone
      fireEvent.press(screen.getByText("Delete Milestone"));

      // Should cancel the reminder notification
      await waitFor(() => {
        expect(mockCancelNotification).toHaveBeenCalled();
      });
    });
  });

  // COMMUNITY-002: Milestone statistics
  describe("community milestone statistics", () => {
    it("does not show statistics when community sharing is disabled", async () => {
      const child = await createTestChild();
      await addTestMilestone(child.id!);

      render(
        <TestWrapper>
          <MilestonesScreen />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("First Smile")).toBeTruthy();
      });

      // Open completion modal
      fireEvent.press(screen.getByText("First Smile"));

      await waitFor(() => {
        expect(screen.getByText("Mark as Completed")).toBeTruthy();
      });

      // Should not show community statistics
      expect(screen.queryByText(/Community Statistics/i)).toBeNull();
      expect(screen.queryByText(/typical range/i)).toBeNull();
    });

    it("shows community statistics when sharing is enabled", async () => {
      const child = await createTestChild();
      await addTestMilestone(child.id!);

      render(
        <TestWrapper>
          <CommunityEnabler>
            <MilestonesScreen />
          </CommunityEnabler>
        </TestWrapper>,
      );

      // Enable community sharing
      fireEvent.press(screen.getByTestId("enable-community"));

      await waitFor(() => {
        expect(screen.getByText("First Smile")).toBeTruthy();
      });

      // Open completion modal
      fireEvent.press(screen.getByText("First Smile"));

      await waitFor(() => {
        expect(screen.getByText("Mark as Completed")).toBeTruthy();
      });

      // Should show community statistics section
      await waitFor(() => {
        expect(screen.getByText(/Community Statistics/i)).toBeTruthy();
      });
    });

    it("shows typical range for milestone", async () => {
      const child = await createTestChild();
      await addTestMilestone(child.id!);

      render(
        <TestWrapper>
          <CommunityEnabler>
            <MilestonesScreen />
          </CommunityEnabler>
        </TestWrapper>,
      );

      // Enable community sharing
      fireEvent.press(screen.getByTestId("enable-community"));

      await waitFor(() => {
        expect(screen.getByText("First Smile")).toBeTruthy();
      });

      // Open completion modal
      fireEvent.press(screen.getByText("First Smile"));

      await waitFor(() => {
        expect(screen.getByText(/Typical range/i)).toBeTruthy();
      });
    });

    it("shows disclaimer about individual variation", async () => {
      const child = await createTestChild();
      await addTestMilestone(child.id!);

      render(
        <TestWrapper>
          <CommunityEnabler>
            <MilestonesScreen />
          </CommunityEnabler>
        </TestWrapper>,
      );

      // Enable community sharing
      fireEvent.press(screen.getByTestId("enable-community"));

      await waitFor(() => {
        expect(screen.getByText("First Smile")).toBeTruthy();
      });

      // Open completion modal
      fireEvent.press(screen.getByText("First Smile"));

      await waitFor(() => {
        // PRD: "Verify disclaimer about individual variation"
        expect(screen.getByText(/Every child develops/i)).toBeTruthy();
      });
    });

    it("does not show identifiable data", async () => {
      const child = await createTestChild();
      await addTestMilestone(child.id!);

      render(
        <TestWrapper>
          <CommunityEnabler>
            <MilestonesScreen />
          </CommunityEnabler>
        </TestWrapper>,
      );

      // Enable community sharing
      fireEvent.press(screen.getByTestId("enable-community"));

      await waitFor(() => {
        expect(screen.getByText("First Smile")).toBeTruthy();
      });

      // Open completion modal
      fireEvent.press(screen.getByText("First Smile"));

      await waitFor(() => {
        expect(screen.getByText(/Community Statistics/i)).toBeTruthy();
      });

      // Should not show any identifiable data (names, specific dates, etc.)
      expect(screen.queryByText(/Test Baby/i)).toBeNull();
    });
  });
});
