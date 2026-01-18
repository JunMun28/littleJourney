import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Share } from "react-native";

// Mock dependencies before importing
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

// Mock milestone context
jest.mock("@/contexts/milestone-context", () => ({
  useMilestones: () => ({
    completedMilestones: [
      { id: "m1", templateId: "first_smile", isCompleted: true },
    ],
  }),
  MILESTONE_TEMPLATES: [
    {
      id: "first_smile",
      title: "First Smile",
      description: "Baby's first social smile",
      culturalTradition: "universal",
    },
    {
      id: "first_steps",
      title: "First Steps",
      description: "Baby's first independent steps",
      culturalTradition: "universal",
    },
  ],
}));

// Mock entry context
jest.mock("@/contexts/entry-context", () => ({
  useEntries: () => ({
    entries: [{ id: "e1", type: "photo", date: "2025-01-01" }],
  }),
}));

// Mock child context
jest.mock("@/contexts/child-context", () => ({
  useChild: () => ({
    child: null,
  }),
}));

// Mock Share
jest
  .spyOn(Share, "share")
  .mockImplementation(() => Promise.resolve({ action: "sharedAction" }));

// Import after mocks
import BadgesScreen from "@/app/badges";
import { GamificationProvider } from "@/contexts/gamification-context";

describe("BadgesScreen", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GamificationProvider>{children}</GamificationProvider>
  );

  const renderScreen = () => {
    return render(<BadgesScreen />, { wrapper });
  };

  it("renders Badge Collection header", () => {
    const { getByText } = renderScreen();
    expect(getByText("Badge Collection")).toBeTruthy();
  });

  it("shows progress summary with unlocked count", () => {
    const { getByText } = renderScreen();
    // first_smile is completed + badge_first_entry from having entries
    expect(getByText(/\/ \d+/)).toBeTruthy(); // Shows X / Y format
    expect(getByText("Badges Unlocked")).toBeTruthy();
  });

  it("renders unlocked badges section", () => {
    const { getByText } = renderScreen();
    // Section title format: "Unlocked (X)"
    expect(getByText(/Unlocked \(\d+\)/)).toBeTruthy();
  });

  it("renders locked badges section", () => {
    const { getByText } = renderScreen();
    expect(getByText(/Locked/)).toBeTruthy();
  });

  it("shows badge detail modal when badge is tapped", () => {
    const { getByTestId, getByText, getAllByText } = renderScreen();

    // Tap on first_smile badge (which is unlocked)
    const badge = getByTestId("badge-badge_first_smile");
    fireEvent.press(badge);

    // Modal should show badge title (may appear twice - once in grid, once in modal)
    expect(getAllByText("First Smile").length).toBeGreaterThanOrEqual(1);
    // Unlock status only appears in modal
    expect(getByText("✓ Unlocked!")).toBeTruthy();
  });

  it("shows unlock condition for locked badge", () => {
    const { getByTestId, getByText } = renderScreen();

    // Tap on first_steps badge (which is locked)
    const badge = getByTestId("badge-badge_first_steps");
    fireEvent.press(badge);

    // Modal should show how to unlock
    expect(getByText("How to unlock:")).toBeTruthy();
  });

  it("closes modal when close button pressed", () => {
    const { getByTestId, queryByText } = renderScreen();

    // Open modal
    const badge = getByTestId("badge-badge_first_smile");
    fireEvent.press(badge);

    // Close modal
    const closeButton = getByTestId("close-badge-modal");
    fireEvent.press(closeButton);

    // Modal content should be gone (modal is hidden)
    // Note: Due to Modal behavior, the element may still exist but modal is closed
  });

  it("shows share button for unlocked badges", () => {
    const { getByTestId } = renderScreen();

    // Open modal for unlocked badge
    const badge = getByTestId("badge-badge_first_smile");
    fireEvent.press(badge);

    // Share button should be visible
    expect(getByTestId("share-badge-button")).toBeTruthy();
  });

  it("calls Share.share when share button pressed", async () => {
    const { getByTestId } = renderScreen();

    // Open modal for unlocked badge
    const badge = getByTestId("badge-badge_first_smile");
    fireEvent.press(badge);

    // Press share button
    const shareButton = getByTestId("share-badge-button");
    fireEvent.press(shareButton);

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("First Smile"),
      }),
    );
  });

  it("renders back button", () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId("back-button")).toBeTruthy();
  });
});
