import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MilestonesScreen from "@/app/(tabs)/milestones";
import { ChildProvider, useChild } from "@/contexts/child-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { milestoneApi, clearAllMockData } from "@/services/api-client";
import { useEffect } from "react";
import { View, Text } from "react-native";

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

// Wrapper with child set up
function TestWrapper({
  children,
  culturalTradition = "none" as const,
}: {
  children: React.ReactNode;
  culturalTradition?: "chinese" | "malay" | "indian" | "none";
}) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <ChildProvider>
          <ChildSetup culturalTradition={culturalTradition}>
            {children}
          </ChildSetup>
        </ChildProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

// Sets up child in context for tests
function ChildSetup({
  children,
  culturalTradition,
}: {
  children: React.ReactNode;
  culturalTradition: "chinese" | "malay" | "indian" | "none";
}) {
  const { setChild } = useChild();
  useEffect(() => {
    setChild({
      name: "Test Baby",
      dateOfBirth: "2024-06-15",
      culturalTradition,
    });
  }, [setChild, culturalTradition]);
  return <>{children}</>;
}

// Sets up child with recent birth date (for future milestone tests)
function FutureChildSetup({ children }: { children: React.ReactNode }) {
  const { setChild } = useChild();
  useEffect(() => {
    // Use today's date so future milestones (like Zhua Zhou at 365 days) are in the future
    const today = new Date();
    setChild({
      name: "Test Baby",
      dateOfBirth: today.toISOString().split("T")[0],
      culturalTradition: "chinese", // Include cultural milestones
    });
  }, [setChild]);
  return <>{children}</>;
}

// Async helper to add a milestone before rendering
async function addTestMilestone() {
  await milestoneApi.createMilestone({
    templateId: "first_smile",
    childId: "child-1",
    milestoneDate: "2024-07-15",
  });
}

describe("MilestonesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllMockData();
  });

  it("renders empty state when no milestones", async () => {
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
    await addTestMilestone();

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

  it("opens completion modal when tapping upcoming milestone card", async () => {
    await addTestMilestone();

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
    await addTestMilestone();

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
    await addTestMilestone();

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
      // Use a future date for the child DOB so milestone will be in future
      const queryClient = createTestQueryClient();
      const futureChildWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <ChildProvider>
              <FutureChildSetup>{children}</FutureChildSetup>
            </ChildProvider>
          </NotificationProvider>
        </QueryClientProvider>
      );

      render(<MilestonesScreen />, { wrapper: futureChildWrapper });

      // Open template selection
      fireEvent.press(screen.getByText("Add First Milestone"));

      await waitFor(() => {
        expect(screen.getByText("Add Milestone")).toBeTruthy();
      });

      // Add a milestone from template (Zhua Zhou is 365 days from birth - in future)
      // Use regex to match the text that includes Zhua Zhou (with titleLocal in nested Text)
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
      render(
        <TestWrapper>
          <MilestonesScreen />
        </TestWrapper>,
      );

      // Open template selection
      fireEvent.press(screen.getByText("Add First Milestone"));

      await waitFor(() => {
        expect(screen.getByText("+ Custom Milestone")).toBeTruthy();
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
      await addTestMilestone();

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
      await addTestMilestone();

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
});
