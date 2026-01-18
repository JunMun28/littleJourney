import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

// Mock expo-router
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
  Stack: {
    Screen: ({ options }: { options: Record<string, unknown> }) => null,
  },
}));

// Mock child context
jest.mock("@/contexts/child-context", () => ({
  useChild: () => ({
    selectedChild: { id: "child-1", name: "Test Child" },
  }),
}));

// Mock Alert
jest.spyOn(Alert, "alert");

import RedPacketScreen from "../../app/red-packet";
import { RedPacketProvider } from "../../contexts/red-packet-context";

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <RedPacketProvider>{children}</RedPacketProvider>;
}

describe("RedPacketScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("SGLOCAL-001: Red packet tracker", () => {
    it("renders empty state with add button", () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <RedPacketScreen />
        </TestWrapper>,
      );

      expect(getByText("No Ang Bao Recorded")).toBeTruthy();
      expect(getByTestId("empty-add-button")).toBeTruthy();
    });

    it("opens add modal when add button pressed", () => {
      const { getByTestId, getAllByText } = render(
        <TestWrapper>
          <RedPacketScreen />
        </TestWrapper>,
      );

      fireEvent.press(getByTestId("empty-add-button"));

      // "Add Ang Bao" appears in button and modal title
      expect(getAllByText("Add Ang Bao").length).toBeGreaterThanOrEqual(1);
      expect(getByTestId("amount-input")).toBeTruthy();
      expect(getByTestId("giver-input")).toBeTruthy();
    });

    it("adds ang bao with amount and giver name", async () => {
      const { getByTestId, getByText, queryByText, getAllByText } = render(
        <TestWrapper>
          <RedPacketScreen />
        </TestWrapper>,
      );

      // Open modal
      fireEvent.press(getByTestId("empty-add-button"));

      // Fill form
      fireEvent.changeText(getByTestId("amount-input"), "88");
      fireEvent.changeText(getByTestId("giver-input"), "Grandma");

      // Save
      fireEvent.press(getByTestId("save-packet-button"));

      // Verify ang bao appears in list
      await waitFor(() => {
        expect(getByText("Grandma")).toBeTruthy();
        // S$88.00 appears in both total card and packet card
        expect(getAllByText("S$88.00").length).toBeGreaterThanOrEqual(1);
      });

      // Modal should be closed
      expect(queryByText("Add Ang Bao")).toBeNull();
    });

    it("calculates and displays total collected", async () => {
      const { getByTestId, getByText, getAllByText } = render(
        <TestWrapper>
          <RedPacketScreen />
        </TestWrapper>,
      );

      // Add first ang bao
      fireEvent.press(getByTestId("empty-add-button"));
      fireEvent.changeText(getByTestId("amount-input"), "88");
      fireEvent.changeText(getByTestId("giver-input"), "Grandma");
      fireEvent.press(getByTestId("save-packet-button"));

      await waitFor(() => {
        // Amount shows in both total card and packet card
        expect(getAllByText("S$88.00").length).toBeGreaterThanOrEqual(1);
      });

      // Add second ang bao using FAB
      fireEvent.press(getByTestId("fab-add-button"));
      fireEvent.changeText(getByTestId("amount-input"), "50");
      fireEvent.changeText(getByTestId("giver-input"), "Uncle");
      fireEvent.press(getByTestId("save-packet-button"));

      // Check total (88 + 50 = 138)
      await waitFor(() => {
        expect(getByText("S$138.00")).toBeTruthy();
        expect(getByText("2 ang baos")).toBeTruthy();
      });
    });

    it("validates required fields", () => {
      const { getByTestId } = render(
        <TestWrapper>
          <RedPacketScreen />
        </TestWrapper>,
      );

      // Open modal
      fireEvent.press(getByTestId("empty-add-button"));

      // Try to save without filling form
      fireEvent.press(getByTestId("save-packet-button"));

      // Should show validation alert
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Amount",
        "Please enter a valid amount.",
      );
    });

    it("validates giver name is required", () => {
      const { getByTestId } = render(
        <TestWrapper>
          <RedPacketScreen />
        </TestWrapper>,
      );

      // Open modal
      fireEvent.press(getByTestId("empty-add-button"));

      // Enter amount but not name
      fireEvent.changeText(getByTestId("amount-input"), "88");
      fireEvent.press(getByTestId("save-packet-button"));

      // Should show validation alert
      expect(Alert.alert).toHaveBeenCalledWith(
        "Missing Name",
        "Please enter the giver's name.",
      );
    });

    it("shows year tabs for filtering", async () => {
      const currentYear = new Date().getFullYear();
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <RedPacketScreen />
        </TestWrapper>,
      );

      // Should show current year tab by default
      expect(getByTestId(`year-tab-${currentYear}`)).toBeTruthy();
    });

    it("shows privacy note in add modal", () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <RedPacketScreen />
        </TestWrapper>,
      );

      fireEvent.press(getByTestId("empty-add-button"));

      expect(
        getByText(/This information is private and will not be shared/),
      ).toBeTruthy();
    });

    it("allows adding notes to ang bao", async () => {
      const { getByTestId, getByText, queryByText } = render(
        <TestWrapper>
          <RedPacketScreen />
        </TestWrapper>,
      );

      fireEvent.press(getByTestId("empty-add-button"));
      fireEvent.changeText(getByTestId("amount-input"), "88");
      fireEvent.changeText(getByTestId("giver-input"), "Grandma");
      fireEvent.changeText(getByTestId("notes-input"), "Day 1 visiting");
      fireEvent.press(getByTestId("save-packet-button"));

      await waitFor(() => {
        expect(getByText("Day 1 visiting")).toBeTruthy();
      });
    });
  });
});
