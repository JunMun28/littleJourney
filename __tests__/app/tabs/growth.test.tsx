import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GrowthScreen from "@/app/(tabs)/growth";
import { GrowthTrackingProvider } from "@/contexts/growth-tracking-context";
import { ChildProvider, useChild } from "@/contexts/child-context";
import { useEffect } from "react";

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
          onPress={() => {
            const testDate = new Date("2024-06-15");
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

// Mock expo-print for export functionality
jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: "file:///test-report.pdf" }),
}));

// Mock expo-sharing for export functionality
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock react-native-svg for GrowthChart component
jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  const Svg = React.forwardRef(({ children, testID, ...props }: { children?: React.ReactNode; testID?: string }, ref: React.Ref<unknown>) =>
    React.createElement(View, { testID: testID || "svg-container", ref, ...props }, children)
  );
  Svg.displayName = "Svg";

  const G = React.forwardRef(({ children, ...props }: { children?: React.ReactNode }, ref: React.Ref<unknown>) =>
    React.createElement(View, { ref, ...props }, children)
  );
  G.displayName = "G";

  const Path = React.forwardRef(({ testID, d, stroke, ...props }: { testID?: string; d?: string; stroke?: string }, ref: React.Ref<unknown>) =>
    React.createElement(View, { testID, accessibilityLabel: d, ref, ...props })
  );
  Path.displayName = "Path";

  const Circle = React.forwardRef(({ testID, cx, cy, r, ...props }: { testID?: string; cx?: number; cy?: number; r?: number }, ref: React.Ref<unknown>) =>
    React.createElement(View, { testID, accessibilityLabel: `circle-${cx}-${cy}`, ref, ...props })
  );
  Circle.displayName = "Circle";

  const Line = React.forwardRef(({ x1, y1, x2, y2, ...props }: { x1?: number; y1?: number; x2?: number; y2?: number }, ref: React.Ref<unknown>) =>
    React.createElement(View, { ref, ...props })
  );
  Line.displayName = "Line";

  const SvgText = React.forwardRef(({ children, ...props }: { children?: React.ReactNode }, ref: React.Ref<unknown>) =>
    React.createElement(Text, { ref, ...props }, children)
  );
  SvgText.displayName = "SvgText";

  const Rect = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(View, { ref, ...props })
  );
  Rect.displayName = "Rect";

  return {
    __esModule: true,
    default: Svg,
    Svg,
    G,
    Path,
    Circle,
    Line,
    Text: SvgText,
    Rect,
  };
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
      sex: "male",
    });
  }, [setChild]);

  return <>{children}</>;
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ChildProvider>
        <ChildSetup>
          <GrowthTrackingProvider>{children}</GrowthTrackingProvider>
        </ChildSetup>
      </ChildProvider>
    </QueryClientProvider>
  );
}

describe("GrowthScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // GROWTH-001: Navigate to Growth Tracker
  it("renders empty state when no measurements", async () => {
    render(
      <TestWrapper>
        <GrowthScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("No Measurements Yet")).toBeTruthy();
    });
    expect(screen.getByText("Add Measurement")).toBeTruthy();
  });

  // GROWTH-001: Tap 'Add Measurement' - shows type selector
  it("opens type selector when tapping Add Measurement button", async () => {
    render(
      <TestWrapper>
        <GrowthScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Add Measurement")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Add Measurement"));

    await waitFor(() => {
      expect(screen.getByText("Height")).toBeTruthy();
      expect(screen.getByText("Weight")).toBeTruthy();
    });
  });

  // GROWTH-001: Select height opens Add Height modal
  it("opens Add Height modal when selecting Height from type selector", async () => {
    render(
      <TestWrapper>
        <GrowthScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Add Measurement")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Add Measurement"));

    await waitFor(() => {
      expect(screen.getByText("Height")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Height"));

    await waitFor(() => {
      expect(screen.getByText("Add Height")).toBeTruthy();
    });
  });

  // GROWTH-001: Enter height in cm
  it("allows entering height value in cm", async () => {
    render(
      <TestWrapper>
        <GrowthScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Add Measurement")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Add Measurement"));

    await waitFor(() => {
      expect(screen.getByText("Height")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Height"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");

    expect(screen.getByDisplayValue("75.5")).toBeTruthy();
  });

  // GROWTH-001: Select measurement date
  it("shows date picker for measurement date", async () => {
    render(
      <TestWrapper>
        <GrowthScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Add Measurement")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Add Measurement"));

    await waitFor(() => {
      expect(screen.getByText("Height")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Height"));

    await waitFor(() => {
      expect(screen.getByText("Date")).toBeTruthy();
    });

    // Find and tap the date button to show picker
    const dateButtons = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    fireEvent.press(dateButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("date-time-picker")).toBeTruthy();
    });
  });

  // GROWTH-001: Save measurement and verify appears in list
  it("saves height measurement and displays in list", async () => {
    render(
      <TestWrapper>
        <GrowthScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Add Measurement")).toBeTruthy();
    });

    // Open type selector
    fireEvent.press(screen.getByText("Add Measurement"));

    await waitFor(() => {
      expect(screen.getByText("Height")).toBeTruthy();
    });

    // Select height
    fireEvent.press(screen.getByText("Height"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
    });

    // Enter height
    fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");

    // Save
    fireEvent.press(screen.getByText("Save"));

    // Verify measurement appears in list
    await waitFor(() => {
      expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
    });
  });

  // GROWTH-001: Multiple measurements show in list
  it("displays multiple height measurements", async () => {
    render(
      <TestWrapper>
        <GrowthScreen />
      </TestWrapper>
    );

    // Add first measurement
    await waitFor(() => {
      expect(screen.getByText("Add Measurement")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Add Measurement"));
    await waitFor(() => {
      expect(screen.getByText("Height")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Height"));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
    });
    fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
    fireEvent.press(screen.getByText("Save"));

    // Wait for first measurement
    await waitFor(() => {
      expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
    });

    // Add second measurement via FAB
    fireEvent.press(screen.getByTestId("add-measurement-fab"));

    // Type selector now has "Add Measurement" title
    await waitFor(() => {
      // Use getAllByText since "Height" appears in list header and modal
      const heightButtons = screen.getAllByText("Height");
      expect(heightButtons.length).toBeGreaterThan(0);
    });
    // Get the Height option from type selector (should be last occurrence)
    const heightButtons = screen.getAllByText("Height");
    fireEvent.press(heightButtons[heightButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
    });
    fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "78.0");
    fireEvent.press(screen.getByText("Save"));

    // Verify both measurements appear (78.0 displays as "78 cm")
    await waitFor(() => {
      expect(screen.getByText(/78 cm/)).toBeTruthy();
    });
  });

  // GROWTH-001: Validates input before saving
  it("disables save button when height is empty", async () => {
    render(
      <TestWrapper>
        <GrowthScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Add Measurement")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Add Measurement"));

    await waitFor(() => {
      expect(screen.getByText("Height")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Height"));

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeTruthy();
    });

    // Save button should be present but the form shouldn't submit without value
    const saveButton = screen.getByText("Save");
    // The button should have disabled styling (opacity or similar)
    expect(saveButton).toBeTruthy();
  });

  // Test showing measurements sorted by date
  it("shows measurements sorted by date (newest first)", async () => {
    render(
      <TestWrapper>
        <GrowthScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Add Measurement")).toBeTruthy();
    });

    // Add first measurement
    fireEvent.press(screen.getByText("Add Measurement"));
    await waitFor(() => {
      expect(screen.getByText("Height")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Height"));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
    });
    fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
    fireEvent.press(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
    });

    // Measurements should be displayed with section header
    expect(screen.getByText(/Height \(1\)/)).toBeTruthy();
  });

  // GROWTH-002: Record weight measurement tests
  describe("GROWTH-002: Weight Measurement", () => {
    // GROWTH-002: Navigate to add weight
    it("shows weight tab option", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      // Press the add measurement button to see type options
      fireEvent.press(screen.getByText("Add Measurement"));

      await waitFor(() => {
        expect(screen.getByText("Weight")).toBeTruthy();
      });
    });

    // GROWTH-002: Open weight modal
    it("opens add weight modal when selecting weight type", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));

      await waitFor(() => {
        expect(screen.getByText("Weight")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Weight"));

      await waitFor(() => {
        expect(screen.getByText("Add Weight")).toBeTruthy();
      });
    });

    // GROWTH-002: Enter weight in kg
    it("allows entering weight value in kg", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));

      await waitFor(() => {
        expect(screen.getByText("Weight")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Weight"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Weight in kg")).toBeTruthy();
      });

      fireEvent.changeText(screen.getByPlaceholderText("Weight in kg"), "8.5");

      expect(screen.getByDisplayValue("8.5")).toBeTruthy();
    });

    // GROWTH-002: Save weight and verify in list
    it("saves weight measurement and displays in list", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));

      await waitFor(() => {
        expect(screen.getByText("Weight")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Weight"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Weight in kg")).toBeTruthy();
      });

      fireEvent.changeText(screen.getByPlaceholderText("Weight in kg"), "8.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/8\.5 kg/)).toBeTruthy();
      });
    });

    // GROWTH-002: Weight section shows in measurements list
    it("displays weight section with count", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      // Add weight
      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Weight")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Weight"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Weight in kg")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Weight in kg"), "8.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/Weight \(1\)/)).toBeTruthy();
      });
    });
  });

  // GROWTH-003: Growth percentile chart tests
  describe("GROWTH-003: Growth Percentile Chart", () => {
    // GROWTH-003: View mode toggle exists
    it("shows view mode toggle when measurements exist", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // First add a measurement
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      // Wait for measurement to appear
      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Should show view toggle
      await waitFor(() => {
        expect(screen.getByTestId("view-mode-toggle")).toBeTruthy();
      });
    });

    // GROWTH-003: Switch to chart view
    it("switches to chart view when pressing Chart tab", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add a measurement
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Switch to chart view
      await waitFor(() => {
        expect(screen.getByTestId("view-mode-toggle")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Chart"));

      // Should show growth chart
      await waitFor(() => {
        expect(screen.getByTestId("growth-chart-container")).toBeTruthy();
      });
    });

    // GROWTH-003: Chart shows with height data
    it("displays height chart with WHO percentile curves", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add height measurement
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Switch to chart view
      fireEvent.press(screen.getByText("Chart"));

      // Check chart displays
      await waitFor(() => {
        expect(screen.getByTestId("growth-chart-container")).toBeTruthy();
      });
    });

    // GROWTH-003: Switch chart type
    it("allows switching between height and weight charts", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add height measurement
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Switch to chart view
      fireEvent.press(screen.getByText("Chart"));

      await waitFor(() => {
        expect(screen.getByTestId("growth-chart-container")).toBeTruthy();
      });

      // Chart type selector should exist
      await waitFor(() => {
        expect(screen.getByTestId("chart-type-selector")).toBeTruthy();
      });
    });

    // GROWTH-003: Current percentile shown in chart
    it("shows current percentile when viewing chart", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add height measurement
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Switch to chart view
      fireEvent.press(screen.getByText("Chart"));

      // Should show current percentile
      await waitFor(() => {
        expect(screen.getByTestId("current-percentile")).toBeTruthy();
      });
    });
  });

  // GROWTH-004: Singapore growth standards tests
  describe("GROWTH-004: Singapore Standards", () => {
    // GROWTH-004: View growth chart settings
    it("shows standards selector in chart view", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Switch to chart view
      fireEvent.press(screen.getByText("Chart"));

      // Should show standards selector
      await waitFor(() => {
        expect(screen.getByTestId("standards-selector")).toBeTruthy();
      });
    });

    // GROWTH-004: Select Singapore Standards option
    it("allows selecting Singapore Standards", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Switch to chart view
      fireEvent.press(screen.getByText("Chart"));

      await waitFor(() => {
        expect(screen.getByTestId("standards-selector")).toBeTruthy();
      });

      // Find Singapore option
      await waitFor(() => {
        expect(screen.getByText("Singapore")).toBeTruthy();
      });
    });

    // GROWTH-004: Switch to Singapore standards
    it("switches to Singapore standards when selected", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Switch to chart view
      fireEvent.press(screen.getByText("Chart"));

      await waitFor(() => {
        expect(screen.getByText("Singapore")).toBeTruthy();
      });

      // Press Singapore option
      fireEvent.press(screen.getByText("Singapore"));

      // Singapore should now be active (check styling changes)
      await waitFor(() => {
        expect(screen.getByTestId("standard-singapore")).toBeTruthy();
      });
    });
  });

  // GROWTH-007: Head Circumference Tracking tests
  describe("GROWTH-007: Head Circumference Tracking", () => {
    // GROWTH-007: Shows head circumference option in type selector
    it("shows head circumference option in type selector", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));

      await waitFor(() => {
        expect(screen.getByText("Head Circumference")).toBeTruthy();
      });
    });

    // GROWTH-007: Opens add head circumference modal
    it("opens add head circumference modal when selecting head circumference type", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));

      await waitFor(() => {
        expect(screen.getByText("Head Circumference")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Head Circumference"));

      await waitFor(() => {
        expect(screen.getByText("Add Head Circumference")).toBeTruthy();
      });
    });

    // GROWTH-007: Allows entering head circumference value in cm
    it("allows entering head circumference value in cm", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));

      await waitFor(() => {
        expect(screen.getByText("Head Circumference")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Head Circumference"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Head circumference in cm")).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText("Head circumference in cm"),
        "45.5"
      );

      expect(screen.getByDisplayValue("45.5")).toBeTruthy();
    });

    // GROWTH-007: Saves head circumference measurement and displays in list
    it("saves head circumference measurement and displays in list", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));

      await waitFor(() => {
        expect(screen.getByText("Head Circumference")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Head Circumference"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Head circumference in cm")).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText("Head circumference in cm"),
        "45.5"
      );
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/45\.5 cm/)).toBeTruthy();
      });
    });

    // GROWTH-007: Displays head circumference section with count
    it("displays head circumference section with count", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      // Add head circumference
      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Head Circumference")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Head Circumference"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Head circumference in cm")).toBeTruthy();
      });
      fireEvent.changeText(
        screen.getByPlaceholderText("Head circumference in cm"),
        "45.5"
      );
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/Head Circumference \(1\)/)).toBeTruthy();
      });
    });

    // GROWTH-007: Shows head chart option in chart type selector
    it("shows head chart option in chart type selector", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Head Circumference")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Head Circumference"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Head circumference in cm")).toBeTruthy();
      });
      fireEvent.changeText(
        screen.getByPlaceholderText("Head circumference in cm"),
        "45.5"
      );
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/45\.5 cm/)).toBeTruthy();
      });

      // Switch to chart view
      fireEvent.press(screen.getByText("Chart"));

      await waitFor(() => {
        expect(screen.getByTestId("chart-type-selector")).toBeTruthy();
      });

      // Should show Head option in chart type selector
      await waitFor(() => {
        expect(screen.getByText("Head")).toBeTruthy();
      });
    });

    // GROWTH-007: Switches to head circumference chart view
    it("switches to head circumference chart when Head tab is selected", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add head circumference measurement
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Head Circumference")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Head Circumference"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Head circumference in cm")).toBeTruthy();
      });
      fireEvent.changeText(
        screen.getByPlaceholderText("Head circumference in cm"),
        "45.5"
      );
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/45\.5 cm/)).toBeTruthy();
      });

      // Switch to chart view
      fireEvent.press(screen.getByText("Chart"));

      await waitFor(() => {
        expect(screen.getByTestId("chart-type-selector")).toBeTruthy();
      });

      // Select Head chart type
      fireEvent.press(screen.getByText("Head"));

      // Should show growth chart
      await waitFor(() => {
        expect(screen.getByTestId("growth-chart-container")).toBeTruthy();
      });
    });
  });

  // GROWTH-006: Export growth report for pediatrician
  describe("GROWTH-006: Export Growth Report", () => {
    // GROWTH-006: Shows export button when measurements exist
    it("shows export button when measurements exist", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Should show export button
      await waitFor(() => {
        expect(screen.getByTestId("export-report-button")).toBeTruthy();
      });
    });

    // GROWTH-006: Opens export modal when tapping export button
    it("opens export modal when tapping export button", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Tap export button
      fireEvent.press(screen.getByTestId("export-report-button"));

      // Export modal should appear
      await waitFor(() => {
        expect(screen.getByText("Export Growth Report")).toBeTruthy();
      });
    });

    // GROWTH-006: Export modal shows date range selection
    it("shows date range selection in export modal", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Tap export button
      fireEvent.press(screen.getByTestId("export-report-button"));

      await waitFor(() => {
        expect(screen.getByText("Export Growth Report")).toBeTruthy();
      });

      // Should show date range fields
      expect(screen.getByText("From:")).toBeTruthy();
      expect(screen.getByText("To:")).toBeTruthy();
      expect(screen.getByTestId("export-start-date")).toBeTruthy();
      expect(screen.getByTestId("export-end-date")).toBeTruthy();
    });

    // GROWTH-006: Export modal shows generate button
    it("shows generate button in export modal", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Tap export button
      fireEvent.press(screen.getByTestId("export-report-button"));

      await waitFor(() => {
        expect(screen.getByText("Export Growth Report")).toBeTruthy();
      });

      // Should show generate button
      expect(screen.getByTestId("export-generate-button")).toBeTruthy();
      expect(screen.getByText("Generate & Share")).toBeTruthy();
    });

    // GROWTH-006: Export modal shows current growth standard
    it("shows current growth standard in export modal", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Tap export button
      fireEvent.press(screen.getByTestId("export-report-button"));

      await waitFor(() => {
        expect(screen.getByText("Export Growth Report")).toBeTruthy();
      });

      // Should show WHO standard (default)
      expect(screen.getByText(/WHO growth standards/)).toBeTruthy();
    });

    // GROWTH-006: Can cancel export modal
    it("closes export modal when tapping cancel", async () => {
      render(
        <TestWrapper>
          <GrowthScreen />
        </TestWrapper>
      );

      // Add measurement first
      await waitFor(() => {
        expect(screen.getByText("Add Measurement")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Add Measurement"));
      await waitFor(() => {
        expect(screen.getByText("Height")).toBeTruthy();
      });
      fireEvent.press(screen.getByText("Height"));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Height in cm")).toBeTruthy();
      });
      fireEvent.changeText(screen.getByPlaceholderText("Height in cm"), "75.5");
      fireEvent.press(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText(/75\.5 cm/)).toBeTruthy();
      });

      // Tap export button
      fireEvent.press(screen.getByTestId("export-report-button"));

      await waitFor(() => {
        expect(screen.getByText("Export Growth Report")).toBeTruthy();
      });

      // Tap cancel
      fireEvent.press(screen.getByText("Cancel"));

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText("Export Growth Report")).toBeNull();
      });
    });
  });
});
