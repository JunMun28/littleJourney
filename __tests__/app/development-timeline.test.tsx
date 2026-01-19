import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";

import DevelopmentTimelineScreen from "@/app/development-timeline";
import { ChildProvider } from "@/contexts/child-context";
import { MilestoneProvider, useMilestones } from "@/contexts/milestone-context";
import { EntryProvider } from "@/contexts/entry-context";
import { NotificationProvider } from "@/contexts/notification-context";

// Mock expo-router
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  Stack: { Screen: () => null },
}));

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-id"),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest
    .fn()
    .mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest
    .fn()
    .mockReturnValue({ remove: jest.fn() }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "mock-token" }),
  setNotificationChannelAsync: jest.fn(),
  SchedulableTriggerInputTypes: {
    DAILY: "daily",
    TIME_INTERVAL: "timeInterval",
  },
  AndroidImportance: {
    MAX: 5,
  },
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
}));

// Mock react-native-svg
jest.mock("react-native-svg", () => ({
  Svg: "Svg",
  Line: "Line",
  Circle: "Circle",
  Rect: "Rect",
  Text: "SvgText",
  G: "G",
}));

// Mock child context
const mockSetChild = jest.fn();
const mockChildValue = {
  child: {
    id: "child-1",
    name: "Test Baby",
    dateOfBirth: "2024-01-15", // ~1 year old for testing
  },
  setChild: mockSetChild,
  updateChild: jest.fn(),
  clearChild: jest.fn(),
};

jest.mock("@/contexts/child-context", () => ({
  ...jest.requireActual("@/contexts/child-context"),
  useChild: () => mockChildValue,
}));

// Helper to add milestones via context
function MilestoneAdder({ onReady }: { onReady: () => void }) {
  const { addMilestone } = useMilestones();
  React.useEffect(() => {
    // Add a completed milestone
    addMilestone({
      templateId: "first_smile",
      childId: "child-1",
      milestoneDate: "2024-04-15", // 3 months old
    });
    // Add an upcoming milestone
    addMilestone({
      templateId: "first_steps",
      childId: "child-1",
      milestoneDate: "2025-03-15", // Future
    });
    onReady();
  }, [addMilestone, onReady]);
  return null;
}

// Test wrapper with all required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NotificationProvider>
    <ChildProvider>
      <EntryProvider>
        <MilestoneProvider>{children}</MilestoneProvider>
      </EntryProvider>
    </ChildProvider>
  </NotificationProvider>
);

describe("DevelopmentTimelineScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBack.mockClear();
    mockPush.mockClear();
  });

  describe("AIDETECT-006: Development timeline visualization", () => {
    it("renders the Development tab/screen title", () => {
      render(
        <TestWrapper>
          <DevelopmentTimelineScreen />
        </TestWrapper>,
      );

      expect(screen.getByText("Development Timeline")).toBeTruthy();
    });

    it("shows empty state when no milestones", () => {
      render(
        <TestWrapper>
          <DevelopmentTimelineScreen />
        </TestWrapper>,
      );

      expect(screen.getByText(/No milestones yet/i)).toBeTruthy();
      expect(
        screen.getByText(/Track milestones to see them on your timeline/i),
      ).toBeTruthy();
    });

    it("displays child info header with name", () => {
      render(
        <TestWrapper>
          <DevelopmentTimelineScreen />
        </TestWrapper>,
      );

      expect(screen.getByText("Test Baby")).toBeTruthy();
    });

    it("shows child age in header", () => {
      render(
        <TestWrapper>
          <DevelopmentTimelineScreen />
        </TestWrapper>,
      );

      // Child born 2024-01-15, so around 1 year old
      expect(screen.getByText(/year.*old/i)).toBeTruthy();
    });

    it("shows timeline when milestones exist", () => {
      let ready = false;
      render(
        <TestWrapper>
          <MilestoneAdder
            onReady={() => {
              ready = true;
            }}
          />
          <DevelopmentTimelineScreen />
        </TestWrapper>,
      );

      // Wait for milestones to be added
      expect(ready).toBe(true);

      // Should show timeline component
      expect(screen.getByTestId("development-timeline")).toBeTruthy();
    });

    it("shows legend when milestones exist", () => {
      render(
        <TestWrapper>
          <MilestoneAdder onReady={() => {}} />
          <DevelopmentTimelineScreen />
        </TestWrapper>,
      );

      // Legend should show completed and upcoming milestone indicators
      expect(screen.getByTestId("timeline-legend")).toBeTruthy();
      // Use getAllByText since "Completed" may appear in stats too
      expect(screen.getAllByText(/Completed/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Upcoming/i).length).toBeGreaterThan(0);
    });

    it("shows age axis when milestones exist", () => {
      render(
        <TestWrapper>
          <MilestoneAdder onReady={() => {}} />
          <DevelopmentTimelineScreen />
        </TestWrapper>,
      );

      // Should show age markers on timeline
      expect(screen.getByTestId("age-axis")).toBeTruthy();
    });

    it("displays milestone list below timeline", () => {
      render(
        <TestWrapper>
          <MilestoneAdder onReady={() => {}} />
          <DevelopmentTimelineScreen />
        </TestWrapper>,
      );

      // Should show the milestone names
      expect(screen.getByText("First Smile")).toBeTruthy();
      expect(screen.getByText("First Steps")).toBeTruthy();
    });

    it("navigates back when back button pressed", () => {
      render(
        <TestWrapper>
          <DevelopmentTimelineScreen />
        </TestWrapper>,
      );

      const backButton = screen.getByText("← Back");
      fireEvent.press(backButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
