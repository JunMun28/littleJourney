import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import MilestonesScreen from "@/app/(tabs)/milestones";
import { MilestoneProvider, useMilestones } from "@/contexts/milestone-context";
import { ChildProvider, useChild } from "@/contexts/child-context";
import { useEffect } from "react";
import { View, Text } from "react-native";

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
      <View testID="date-time-picker">
        <Text>{value.toISOString()}</Text>
        <Pressable
          testID="select-date"
          onPress={() => onChange({}, new Date("2024-07-20"))}
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

// Wrapper with child set up
function TestWrapper({
  children,
  culturalTradition = "none" as const,
}: {
  children: React.ReactNode;
  culturalTradition?: "chinese" | "malay" | "indian" | "none";
}) {
  return (
    <ChildProvider>
      <MilestoneProvider>
        <ChildSetup culturalTradition={culturalTradition}>
          {children}
        </ChildSetup>
      </MilestoneProvider>
    </ChildProvider>
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

// Helper to add a milestone for testing
function WithMilestone({ children }: { children: React.ReactNode }) {
  const { addMilestone } = useMilestones();
  useEffect(() => {
    addMilestone({
      templateId: "first_smile",
      childId: "child-1",
      milestoneDate: "2024-07-15",
    });
  }, [addMilestone]);
  return <>{children}</>;
}

describe("MilestonesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state when no milestones", () => {
    render(
      <TestWrapper>
        <MilestonesScreen />
      </TestWrapper>,
    );

    expect(screen.getByText("No Milestones Yet")).toBeTruthy();
    expect(screen.getByText("Add First Milestone")).toBeTruthy();
  });

  it("renders milestone cards in upcoming section", async () => {
    render(
      <TestWrapper>
        <WithMilestone>
          <MilestonesScreen />
        </WithMilestone>
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Upcoming/)).toBeTruthy();
    });
    expect(screen.getByText("First Smile")).toBeTruthy();
  });

  it("opens completion modal when tapping upcoming milestone card", async () => {
    render(
      <TestWrapper>
        <WithMilestone>
          <MilestonesScreen />
        </WithMilestone>
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
    render(
      <TestWrapper>
        <WithMilestone>
          <MilestonesScreen />
        </WithMilestone>
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
    render(
      <TestWrapper>
        <WithMilestone>
          <MilestonesScreen />
        </WithMilestone>
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
});
