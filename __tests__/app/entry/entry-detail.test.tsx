import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { View } from "react-native";

// Mock expo-av
jest.mock("expo-av", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Video: React.forwardRef((props: any, ref: React.Ref<any>) => {
      React.useImperativeHandle(ref, () => ({
        playAsync: jest.fn(),
        pauseAsync: jest.fn(),
      }));
      return <View testID="mock-video" />;
    }),
    ResizeMode: {
      CONTAIN: "contain",
      COVER: "cover",
    },
  };
});

// Mock expo-router
const mockBack = jest.fn();
const mockParams = { id: "test-entry-1" };

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  router: {
    back: () => mockBack(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock entry context
const mockGetEntry = jest.fn();
const mockUpdateEntry = jest.fn();
const mockDeleteEntry = jest.fn();
const mockEntries = [
  {
    id: "test-entry-1",
    type: "photo" as const,
    mediaUris: ["file:///photo1.jpg", "file:///photo2.jpg"],
    caption: "First steps!",
    date: "2024-06-15",
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2024-06-15T10:00:00Z",
  },
];

jest.mock("@/contexts/entry-context", () => ({
  useEntries: () => ({
    getEntry: mockGetEntry,
    entries: mockEntries,
    updateEntry: mockUpdateEntry,
    deleteEntry: mockDeleteEntry,
  }),
}));

// Import after mocks
import EntryDetailScreen from "@/app/entry/[id]";

describe("EntryDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEntry.mockReturnValue(mockEntries[0]);
  });

  it("renders entry with photo carousel", () => {
    render(<EntryDetailScreen />);

    // Should show the entry caption
    expect(screen.getByText("First steps!")).toBeTruthy();
    // Should show the date
    expect(screen.getByText(/15 Jun 2024/)).toBeTruthy();
  });

  it("shows entry not found when entry does not exist", () => {
    mockGetEntry.mockReturnValue(undefined);

    render(<EntryDetailScreen />);

    expect(screen.getByText("Entry not found")).toBeTruthy();
  });

  it("displays back button that navigates back", () => {
    render(<EntryDetailScreen />);

    const backButton = screen.getByTestId("back-button");
    fireEvent.press(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it("shows image counter for multi-photo entries", () => {
    render(<EntryDetailScreen />);

    // Should show 1/2 indicator for carousel
    expect(screen.getByTestId("image-counter")).toBeTruthy();
  });

  it("renders text-only entry without images", () => {
    mockGetEntry.mockReturnValue({
      id: "test-entry-2",
      type: "text" as const,
      caption: "Slept through the night!",
      date: "2024-06-17",
      createdAt: "2024-06-17T10:00:00Z",
      updatedAt: "2024-06-17T10:00:00Z",
    });

    render(<EntryDetailScreen />);

    expect(screen.getByText("Slept through the night!")).toBeTruthy();
    expect(screen.queryByTestId("image-counter")).toBeNull();
  });

  it("shows options menu button", () => {
    render(<EntryDetailScreen />);

    expect(screen.getByTestId("options-button")).toBeTruthy();
  });

  it("opens options menu with edit and delete actions", () => {
    render(<EntryDetailScreen />);

    const optionsButton = screen.getByTestId("options-button");
    fireEvent.press(optionsButton);

    expect(screen.getByText("Edit")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("deletes entry and navigates back when delete is confirmed", () => {
    render(<EntryDetailScreen />);

    // Open options menu
    fireEvent.press(screen.getByTestId("options-button"));
    // Press delete
    fireEvent.press(screen.getByText("Delete"));
    // Confirm deletion
    fireEvent.press(screen.getByText("Delete Entry"));

    expect(mockDeleteEntry).toHaveBeenCalledWith("test-entry-1");
    expect(mockBack).toHaveBeenCalled();
  });

  it("cancels delete and closes menu", () => {
    render(<EntryDetailScreen />);

    // Open options menu
    fireEvent.press(screen.getByTestId("options-button"));
    // Press delete
    fireEvent.press(screen.getByText("Delete"));
    // Cancel deletion
    fireEvent.press(screen.getByText("Cancel"));

    expect(mockDeleteEntry).not.toHaveBeenCalled();
  });

  describe("Edit Modal", () => {
    it("opens edit modal when Edit is pressed", () => {
      render(<EntryDetailScreen />);

      // Open options menu
      fireEvent.press(screen.getByTestId("options-button"));
      // Press edit
      fireEvent.press(screen.getByText("Edit"));

      // Should show edit modal with caption input
      expect(screen.getByTestId("edit-modal")).toBeTruthy();
      expect(screen.getByTestId("caption-input")).toBeTruthy();
    });

    it("pre-fills caption in edit modal", () => {
      render(<EntryDetailScreen />);

      // Open options menu and edit modal
      fireEvent.press(screen.getByTestId("options-button"));
      fireEvent.press(screen.getByText("Edit"));

      // Caption input should have current value
      const captionInput = screen.getByTestId("caption-input");
      expect(captionInput.props.value).toBe("First steps!");
    });

    it("saves edited caption and closes modal", () => {
      render(<EntryDetailScreen />);

      // Open edit modal
      fireEvent.press(screen.getByTestId("options-button"));
      fireEvent.press(screen.getByText("Edit"));

      // Change caption
      const captionInput = screen.getByTestId("caption-input");
      fireEvent.changeText(captionInput, "Updated caption!");

      // Save
      fireEvent.press(screen.getByText("Save"));

      expect(mockUpdateEntry).toHaveBeenCalledWith("test-entry-1", {
        caption: "Updated caption!",
      });
    });

    it("cancels edit without saving", () => {
      render(<EntryDetailScreen />);

      // Open edit modal
      fireEvent.press(screen.getByTestId("options-button"));
      fireEvent.press(screen.getByText("Edit"));

      // Change caption
      const captionInput = screen.getByTestId("caption-input");
      fireEvent.changeText(captionInput, "Changed but not saved");

      // Cancel
      fireEvent.press(screen.getByTestId("edit-cancel-button"));

      expect(mockUpdateEntry).not.toHaveBeenCalled();
    });
  });
});
