import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import CommunityScreen from "@/app/community";
import { CommunityProvider } from "@/contexts/community-context";

// Mock expo-router
const mockRouterBack = jest.fn();
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ children }: { children?: React.ReactNode }) => children ?? null,
  },
  router: {
    back: () => mockRouterBack(),
    push: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, "alert");

// Helper to render with CommunityProvider
function renderWithProvider(sharingEnabled = true) {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <CommunityProvider>{children}</CommunityProvider>
  );

  const result = render(
    <TestWrapper>
      <CommunityScreen />
    </TestWrapper>,
  );

  // Enable community sharing if requested
  if (sharingEnabled) {
    // We need to enable sharing via the context
    // Since we can't directly access context, we'll render again
    // This is a simplified test - in real scenario we'd mock the context
  }

  return result;
}

// Custom wrapper that allows controlling context state
function CommunityScreenWithEnabledSharing() {
  return (
    <CommunityProvider>
      <EnableSharingWrapper />
    </CommunityProvider>
  );
}

function EnableSharingWrapper() {
  // We use a component that enables sharing on mount
  const { useCommunity } = require("@/contexts/community-context");
  const { setCommunityDataSharingEnabled } = useCommunity();

  // Enable sharing
  React.useEffect(() => {
    setCommunityDataSharingEnabled(true);
  }, [setCommunityDataSharingEnabled]);

  return <CommunityScreen />;
}

// Import React for useEffect
import React from "react";

describe("CommunityScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when community sharing is disabled", () => {
    it("should show disabled state", () => {
      const { getByText } = render(
        <CommunityProvider>
          <CommunityScreen />
        </CommunityProvider>,
      );

      expect(getByText("Community Features Disabled")).toBeTruthy();
      expect(
        getByText(/Enable Community Data Sharing in Settings/),
      ).toBeTruthy();
    });

    it("should show go to settings button", () => {
      const { getByTestId } = render(
        <CommunityProvider>
          <CommunityScreen />
        </CommunityProvider>,
      );

      expect(getByTestId("go-to-settings-button")).toBeTruthy();
    });

    it("should navigate back when go to settings is pressed", () => {
      const { getByTestId } = render(
        <CommunityProvider>
          <CommunityScreen />
        </CommunityProvider>,
      );

      fireEvent.press(getByTestId("go-to-settings-button"));
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });

  describe("when community sharing is enabled", () => {
    it("should show Ask Community button", async () => {
      const { getByTestId } = render(<CommunityScreenWithEnabledSharing />);

      await waitFor(() => {
        expect(getByTestId("ask-community-button")).toBeTruthy();
      });
    });

    it("should show empty state when no questions", async () => {
      const { getByText } = render(<CommunityScreenWithEnabledSharing />);

      await waitFor(() => {
        expect(
          getByText(/No questions yet. Tap "Ask Community" to get started!/),
        ).toBeTruthy();
      });
    });

    it("should open ask modal when button pressed", async () => {
      const { getByTestId, getByText } = render(
        <CommunityScreenWithEnabledSharing />,
      );

      await waitFor(() => {
        fireEvent.press(getByTestId("ask-community-button"));
      });

      await waitFor(() => {
        expect(getByText("Ask a Question")).toBeTruthy();
      });
    });

    it("should show question input in modal", async () => {
      const { getByTestId, queryByTestId } = render(
        <CommunityScreenWithEnabledSharing />,
      );

      await waitFor(() => {
        fireEvent.press(getByTestId("ask-community-button"));
      });

      await waitFor(() => {
        expect(queryByTestId("question-input")).toBeTruthy();
      });
    });

    it("should close modal when close button pressed", async () => {
      const { getByTestId, queryByText } = render(
        <CommunityScreenWithEnabledSharing />,
      );

      await waitFor(() => {
        fireEvent.press(getByTestId("ask-community-button"));
      });

      await waitFor(() => {
        fireEvent.press(getByTestId("close-ask-modal"));
      });

      // Modal should be closed - Ask a Question title should not be visible
      await waitFor(() => {
        // The modal title disappears when closed
        expect(queryByText("Ask a Question")).toBeFalsy();
      });
    });

    it("should disable submit button when question is empty", async () => {
      const { getByTestId } = render(<CommunityScreenWithEnabledSharing />);

      await waitFor(() => {
        fireEvent.press(getByTestId("ask-community-button"));
      });

      await waitFor(() => {
        const submitButton = getByTestId("submit-question-button");
        expect(submitButton.props.accessibilityState?.disabled).toBe(true);
      });
    });

    it("should submit question and show in list", async () => {
      const { getByTestId, getByText, queryByText } = render(
        <CommunityScreenWithEnabledSharing />,
      );

      // Open modal
      await waitFor(() => {
        fireEvent.press(getByTestId("ask-community-button"));
      });

      // Type question
      await waitFor(() => {
        fireEvent.changeText(
          getByTestId("question-input"),
          "Is 14 months late for walking?",
        );
      });

      // Submit
      await act(async () => {
        fireEvent.press(getByTestId("submit-question-button"));
      });

      // Question should appear in list
      await waitFor(() => {
        expect(getByText("Is 14 months late for walking?")).toBeTruthy();
      });

      // Empty state should be gone
      expect(queryByText(/No questions yet/)).toBeFalsy();
    });

    it("should show responses after submitting question", async () => {
      const { getByTestId, getByText, getAllByText } = render(
        <CommunityScreenWithEnabledSharing />,
      );

      // Open modal and submit question
      await waitFor(() => {
        fireEvent.press(getByTestId("ask-community-button"));
      });

      await waitFor(() => {
        fireEvent.changeText(
          getByTestId("question-input"),
          "When do babies start talking?",
        );
      });

      await act(async () => {
        fireEvent.press(getByTestId("submit-question-button"));
      });

      // Should show responses section
      await waitFor(() => {
        // Look for response count text (e.g., "2 responses" or "3 responses")
        const responseTexts = getAllByText(/\d+ responses?/);
        expect(responseTexts.length).toBeGreaterThan(0);
      });
    });

    it("should show disclaimer about responses not being medical advice", async () => {
      const { getByText } = render(<CommunityScreenWithEnabledSharing />);

      await waitFor(() => {
        expect(getByText(/This is not medical advice/)).toBeTruthy();
      });
    });

    it("should show anonymous badge on questions", async () => {
      const { getByTestId, getByText, getAllByText } = render(
        <CommunityScreenWithEnabledSharing />,
      );

      // Submit a question
      await waitFor(() => {
        fireEvent.press(getByTestId("ask-community-button"));
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId("question-input"), "Test question");
      });

      await act(async () => {
        fireEvent.press(getByTestId("submit-question-button"));
      });

      // Should show Anonymous badge
      await waitFor(() => {
        const anonymousBadges = getAllByText("Anonymous");
        expect(anonymousBadges.length).toBeGreaterThan(0);
      });
    });
  });
});
