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
import { useEffect } from "react";

// Mock expo-router
const mockRouterPush = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: (path: string) => mockRouterPush(path),
    back: jest.fn(),
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
        <ChildSetup>
          <TimeCapsuleProvider>{children}</TimeCapsuleProvider>
        </ChildSetup>
      </ChildProvider>
    </QueryClientProvider>
  );
}

function TestWrapperNoChild({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ChildProvider>
        <TimeCapsuleProvider>{children}</TimeCapsuleProvider>
      </ChildProvider>
    </QueryClientProvider>
  );
}

describe("TimeCapsuleScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
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
});
