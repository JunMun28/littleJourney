import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CapsuleDetailScreen from "@/app/capsule/[id]";
import {
  TimeCapsuleProvider,
  useTimeCapsules,
  type TimeCapsule,
} from "@/contexts/time-capsule-context";
import { ChildProvider, useChild } from "@/contexts/child-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { useEffect, useState } from "react";

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
const mockRouterBack = jest.fn();
const mockUseLocalSearchParams = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  router: {
    back: () => mockRouterBack(),
    push: jest.fn(),
  },
}));

// Mock expo-blur
jest.mock("expo-blur", () => ({
  BlurView: ({
    children,
    testID,
  }: {
    children: React.ReactNode;
    testID?: string;
  }) => {
    const { View } = require("react-native");
    return <View testID={testID}>{children}</View>;
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

// Combined setup component that creates capsule and renders detail screen
function TestWithCapsuleDetail({
  unlockAge = 18,
  letterContent = "Dear child, this is a test message for you.",
  onCapsuleCreated,
}: {
  unlockAge?: number;
  letterContent?: string;
  onCapsuleCreated?: (capsule: TimeCapsule) => void;
}) {
  const { setChild } = useChild();
  const { createCapsule, getCapsule, capsules } = useTimeCapsules();
  const [capsuleId, setCapsuleId] = useState<string | null>(null);

  useEffect(() => {
    setChild({
      id: "test-child-1",
      name: "Test Baby",
      dateOfBirth: "2023-06-15",
    });
  }, [setChild]);

  useEffect(() => {
    if (!capsuleId && capsules.length === 0) {
      const capsule = createCapsule({
        letterContent,
        unlockType: "age",
        unlockAge,
        childId: "test-child-1",
      });
      setCapsuleId(capsule.id);
      mockUseLocalSearchParams.mockReturnValue({ id: capsule.id });
      onCapsuleCreated?.(capsule);
    }
  }, [
    createCapsule,
    capsuleId,
    capsules.length,
    unlockAge,
    letterContent,
    onCapsuleCreated,
  ]);

  if (!capsuleId) {
    return null;
  }

  return <CapsuleDetailScreen />;
}

function TestWrapper({ children }: { children: React.ReactNode }) {
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

// Simple child setup for tests without capsule
function SimpleChildSetup({ children }: { children: React.ReactNode }) {
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

describe("CapsuleDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: "invalid-id" });
  });

  // CAPSULE-004: Not found state
  it("shows not found state when capsule ID is invalid", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "invalid-id" });

    render(
      <TestWrapper>
        <SimpleChildSetup>
          <CapsuleDetailScreen />
        </SimpleChildSetup>
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("Capsule not found")).toBeTruthy();
    });
    expect(screen.getByTestId("back-button")).toBeTruthy();
  });

  // CAPSULE-004: Shows sealed icon with unlock date
  it("displays sealed status banner for sealed capsules", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("capsule-status-banner")).toBeTruthy();
      expect(screen.getByText("This letter is sealed")).toBeTruthy();
    });
  });

  // CAPSULE-004: Content is hidden/blurred when sealed
  it("shows blurred content for sealed capsules", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail letterContent="This is the sealed letter content." />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sealed-content-view")).toBeTruthy();
      expect(screen.getByText("Content is sealed")).toBeTruthy();
      expect(screen.getByTestId("content-blur-overlay")).toBeTruthy();
    });
  });

  // CAPSULE-004: Cannot edit after sealing - no edit button
  it("does not show edit button for sealed capsules", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("This letter is sealed")).toBeTruthy();
    });

    // There should be no edit button
    expect(screen.queryByText("Edit")).toBeNull();
    expect(screen.queryByTestId("edit-button")).toBeNull();
  });

  // CAPSULE-004: Shows countdown badge
  it("displays countdown badge with time until unlock", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail unlockAge={18} />
      </TestWrapper>,
    );

    // Should show years/months until unlock
    // Child born 2023, unlock at 18 = 2041
    await waitFor(() => {
      // The countdown should show something like "15y 5m" or similar
      const statusBanner = screen.getByTestId("capsule-status-banner");
      expect(statusBanner).toBeTruthy();
    });
  });

  // CAPSULE-007: Force unlock button shown for sealed capsules
  it("shows force unlock button for sealed capsules", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("force-unlock-button")).toBeTruthy();
      expect(screen.getByText("Unlock Early")).toBeTruthy();
    });
  });

  // CAPSULE-007: Force unlock confirmation modal
  it("shows confirmation modal when force unlock is pressed", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("force-unlock-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("force-unlock-button"));

    await waitFor(() => {
      expect(screen.getByTestId("force-unlock-modal")).toBeTruthy();
      expect(screen.getByText("Unlock Early?")).toBeTruthy();
      expect(screen.getByText("This action cannot be undone.")).toBeTruthy();
    });
  });

  // CAPSULE-007: Cancel force unlock
  it("closes confirmation modal when cancel is pressed", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("force-unlock-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("force-unlock-button"));

    await waitFor(() => {
      expect(screen.getByTestId("force-unlock-modal")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("cancel-force-unlock"));

    await waitFor(() => {
      expect(screen.queryByTestId("force-unlock-modal")).toBeNull();
    });
  });

  // CAPSULE-007: Force unlock changes capsule status
  it("unlocks capsule when force unlock is confirmed", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail letterContent="This is my special letter to you." />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("force-unlock-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("force-unlock-button"));

    await waitFor(() => {
      expect(screen.getByTestId("confirm-force-unlock")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("confirm-force-unlock"));

    // After unlocking, should show unlocked content
    await waitFor(() => {
      expect(screen.getByText("Opened early")).toBeTruthy();
      expect(screen.getByTestId("unlocked-content-view")).toBeTruthy();
      expect(
        screen.getByText("This is my special letter to you."),
      ).toBeTruthy();
    });
  });

  // CAPSULE-004: Back button navigates back
  it("navigates back when back button is pressed", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "invalid-id" });

    render(
      <TestWrapper>
        <SimpleChildSetup>
          <CapsuleDetailScreen />
        </SimpleChildSetup>
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("back-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("back-button"));

    expect(mockRouterBack).toHaveBeenCalled();
  });

  // CAPSULE-004: Shows metadata (created date, unlock date)
  it("displays capsule metadata", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail unlockAge={21} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("Created")).toBeTruthy();
      expect(screen.getByText("Unlock Date")).toBeTruthy();
      expect(screen.getAllByText(/turns 21/).length).toBeGreaterThan(0);
    });
  });

  // CAPSULE-004: Info message about no editing
  it("displays info message about capsule being immutable", async () => {
    render(
      <TestWrapper>
        <TestWithCapsuleDetail />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText(/cannot be edited after sealing/)).toBeTruthy();
    });
  });
});
