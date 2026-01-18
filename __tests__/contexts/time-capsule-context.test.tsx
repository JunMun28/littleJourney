import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  TimeCapsuleProvider,
  useTimeCapsules,
  type TimeCapsule,
  type CapsuleStatus,
} from "@/contexts/time-capsule-context";
import { ChildProvider, useChild } from "@/contexts/child-context";
import { NotificationProvider } from "@/contexts/notification-context";
import * as Notifications from "expo-notifications";

// Mock expo-notifications
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

function TestConsumer() {
  const {
    capsules,
    createCapsule,
    getCapsule,
    getSealedCapsules,
    getUnlockedCapsules,
  } = useTimeCapsules();

  const sealed = getSealedCapsules();
  const unlocked = getUnlockedCapsules();

  return (
    <>
      <Text testID="count">{capsules.length}</Text>
      <Text testID="sealed-count">{sealed.length}</Text>
      <Text testID="unlocked-count">{unlocked.length}</Text>
      <Text testID="first-content">{capsules[0]?.letterContent ?? "none"}</Text>
      <Text testID="first-status">{capsules[0]?.status ?? "none"}</Text>
      <Text testID="first-photo-count">
        {capsules[0]?.attachedPhotoUris?.length ?? 0}
      </Text>
      <Text testID="first-unlock-type">
        {capsules[0]?.unlockType ?? "none"}
      </Text>
      <Text
        testID="create-basic-letter"
        onPress={() =>
          createCapsule({
            letterContent: "Dear future you, I love you!",
            unlockType: "age",
            unlockAge: 18,
          })
        }
      >
        Create Basic
      </Text>
      <Text
        testID="create-with-photos"
        onPress={() =>
          createCapsule({
            letterContent: "Your first steps were magical",
            attachedPhotoUris: ["file:///photo1.jpg", "file:///photo2.jpg"],
            unlockType: "age",
            unlockAge: 21,
          })
        }
      >
        Create With Photos
      </Text>
      <Text
        testID="create-custom-date"
        onPress={() =>
          createCapsule({
            letterContent: "Open this on your graduation day",
            unlockType: "custom_date",
            unlockDate: "2040-06-15",
          })
        }
      >
        Create Custom Date
      </Text>
      <Text
        testID="create-preset-5"
        onPress={() =>
          createCapsule({
            letterContent: "For when you turn 5",
            unlockType: "age",
            unlockAge: 5,
          })
        }
      >
        Create Age 5
      </Text>
    </>
  );
}

// Helper wrapper with all required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChildProvider>
      <NotificationProvider>
        <TimeCapsuleProvider>{children}</TimeCapsuleProvider>
      </NotificationProvider>
    </ChildProvider>
  );
}

describe("TimeCapsuleContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("provides empty capsules initially", () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("sealed-count")).toHaveTextContent("0");
    expect(screen.getByTestId("unlocked-count")).toHaveTextContent("0");
  });

  it("creates a basic letter time capsule", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("create-basic-letter").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-content")).toHaveTextContent(
      "Dear future you, I love you!",
    );
    expect(screen.getByTestId("first-status")).toHaveTextContent("sealed");
    expect(screen.getByTestId("first-unlock-type")).toHaveTextContent("age");
    expect(screen.getByTestId("sealed-count")).toHaveTextContent("1");
  });

  it("creates a time capsule with attached photos", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("create-with-photos").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-photo-count")).toHaveTextContent("2");
    });
    expect(screen.getByTestId("first-content")).toHaveTextContent(
      "Your first steps were magical",
    );
  });

  it("creates a time capsule with custom unlock date", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("create-custom-date").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-unlock-type")).toHaveTextContent(
        "custom_date",
      );
    });
    expect(screen.getByTestId("first-status")).toHaveTextContent("sealed");
  });

  it("creates capsule with preset unlock age", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("create-preset-5").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-unlock-type")).toHaveTextContent("age");
  });

  it("newly created capsules are sealed by default", async () => {
    render(
      <TestWrapper>
        <TestConsumer />
      </TestWrapper>,
    );

    await act(async () => {
      screen.getByTestId("create-basic-letter").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-status")).toHaveTextContent("sealed");
    });
    expect(screen.getByTestId("sealed-count")).toHaveTextContent("1");
    expect(screen.getByTestId("unlocked-count")).toHaveTextContent("0");
  });

  it("throws when useTimeCapsules is used outside TimeCapsuleProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useTimeCapsules must be used within a TimeCapsuleProvider",
    );

    consoleSpy.mockRestore();
  });
});

// Test component for CAPSULE-005 unlock notification
function UnlockTestConsumer() {
  const {
    capsules,
    createCapsule,
    checkAndUnlockCapsules,
    getUnlockedCapsules,
  } = useTimeCapsules();
  const { setChild } = useChild();

  const unlocked = getUnlockedCapsules();

  return (
    <>
      <Text testID="capsule-count">{capsules.length}</Text>
      <Text testID="unlocked-count">{unlocked.length}</Text>
      <Text testID="first-status">{capsules[0]?.status ?? "none"}</Text>
      <Text
        testID="set-child-born-20-years-ago"
        onPress={() => {
          const twentyYearsAgo = new Date();
          twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
          setChild({
            name: "Test Child",
            dateOfBirth: twentyYearsAgo.toISOString().split("T")[0],
          });
        }}
      >
        Set Child
      </Text>
      <Text
        testID="create-capsule-unlock-at-18"
        onPress={() =>
          createCapsule({
            letterContent: "For when you turn 18",
            unlockType: "age",
            unlockAge: 18,
          })
        }
      >
        Create Age 18
      </Text>
      <Text
        testID="create-capsule-unlock-at-25"
        onPress={() =>
          createCapsule({
            letterContent: "For when you turn 25",
            unlockType: "age",
            unlockAge: 25,
          })
        }
      >
        Create Age 25
      </Text>
      <Text
        testID="create-capsule-custom-date-past"
        onPress={() => {
          const pastDate = new Date();
          pastDate.setFullYear(pastDate.getFullYear() - 1);
          createCapsule({
            letterContent: "This should be unlocked",
            unlockType: "custom_date",
            unlockDate: pastDate.toISOString().split("T")[0],
          });
        }}
      >
        Create Past Date
      </Text>
      <Text testID="check-and-unlock" onPress={() => checkAndUnlockCapsules()}>
        Check Unlock
      </Text>
    </>
  );
}

function renderWithProviders() {
  return render(
    <ChildProvider>
      <NotificationProvider>
        <TimeCapsuleProvider>
          <UnlockTestConsumer />
        </TimeCapsuleProvider>
      </NotificationProvider>
    </ChildProvider>,
  );
}

describe("CAPSULE-005: Time capsule delivery notification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("unlocks capsule when child reaches unlock age", async () => {
    renderWithProviders();

    // Set child born 20 years ago
    await act(async () => {
      screen.getByTestId("set-child-born-20-years-ago").props.onPress();
    });

    // Create capsule that unlocks at age 18 (child is 20, so should unlock)
    await act(async () => {
      screen.getByTestId("create-capsule-unlock-at-18").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("capsule-count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-status")).toHaveTextContent("sealed");

    // Check and unlock capsules
    await act(async () => {
      screen.getByTestId("check-and-unlock").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-status")).toHaveTextContent("unlocked");
    });
    expect(screen.getByTestId("unlocked-count")).toHaveTextContent("1");
  });

  it("does not unlock capsule when child has not reached unlock age", async () => {
    renderWithProviders();

    // Set child born 20 years ago
    await act(async () => {
      screen.getByTestId("set-child-born-20-years-ago").props.onPress();
    });

    // Create capsule that unlocks at age 25 (child is 20, should NOT unlock)
    await act(async () => {
      screen.getByTestId("create-capsule-unlock-at-25").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("capsule-count")).toHaveTextContent("1");
    });

    // Check and unlock capsules
    await act(async () => {
      screen.getByTestId("check-and-unlock").props.onPress();
    });

    // Should still be sealed
    expect(screen.getByTestId("first-status")).toHaveTextContent("sealed");
    expect(screen.getByTestId("unlocked-count")).toHaveTextContent("0");
  });

  it("unlocks capsule when custom date has passed", async () => {
    renderWithProviders();

    // Create capsule with past custom date
    await act(async () => {
      screen.getByTestId("create-capsule-custom-date-past").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("capsule-count")).toHaveTextContent("1");
    });

    // Check and unlock capsules
    await act(async () => {
      screen.getByTestId("check-and-unlock").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-status")).toHaveTextContent("unlocked");
    });
  });

  it("sends notification when capsule unlocks", async () => {
    renderWithProviders();

    // Create capsule with past custom date
    await act(async () => {
      screen.getByTestId("create-capsule-custom-date-past").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("capsule-count")).toHaveTextContent("1");
    });

    // Check and unlock capsules
    await act(async () => {
      screen.getByTestId("check-and-unlock").props.onPress();
    });

    // First verify that the capsule was unlocked
    await waitFor(() => {
      expect(screen.getByTestId("first-status")).toHaveTextContent("unlocked");
    });

    // Verify notification was sent
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining("Time Capsule"),
          data: expect.objectContaining({ type: "capsule_unlocked" }),
        }),
        trigger: null,
      }),
    );
  });
});
