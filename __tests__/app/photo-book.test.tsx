import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import PhotoBookScreen from "@/app/photo-book";

// Mock expo-router
jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
}));

// Mock expo-image-picker
const mockLaunchImageLibraryAsync = jest.fn();
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock the photo-book context with exportPdf function
const mockExportPdf = jest.fn();
const mockGeneratePhotoBook = jest.fn();
const mockReorderPage = jest.fn();
const mockAddPage = jest.fn();
const mockClearPhotoBook = jest.fn();
const mockUsePhotoBook = {
  pages: [
    { id: "page-1", type: "title" as const, title: "Baby's First Year" },
    {
      id: "page-2",
      type: "photo" as const,
      imageUri: "photo.jpg",
      caption: "First smile",
    },
    {
      id: "page-3",
      type: "photo" as const,
      imageUri: "photo2.jpg",
      caption: "First crawl",
    },
  ],
  isGenerating: false,
  isExporting: false,
  canExportPdf: true,
  generatePhotoBook: mockGeneratePhotoBook,
  reorderPage: mockReorderPage,
  removePage: jest.fn(),
  updatePageCaption: jest.fn(),
  clearPhotoBook: mockClearPhotoBook,
  exportPdf: mockExportPdf,
  addPage: mockAddPage,
};

jest.mock("@/contexts/photo-book-context", () => ({
  usePhotoBook: () => mockUsePhotoBook,
  PhotoBookProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("PhotoBookScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders photo book pages", () => {
    const { getByText } = render(<PhotoBookScreen />);

    expect(getByText("Photo Book")).toBeTruthy();
    expect(getByText("3 pages")).toBeTruthy();
  });

  it("calls exportPdf from context when export button pressed for premium user", async () => {
    const { getByText } = render(<PhotoBookScreen />);

    const exportButton = getByText("Export as PDF");
    fireEvent.press(exportButton);

    expect(mockExportPdf).toHaveBeenCalled();
  });

  it("shows premium feature alert when canExportPdf is false", () => {
    // Override canExportPdf to false
    mockUsePhotoBook.canExportPdf = false;

    const { getByText } = render(<PhotoBookScreen />);

    const exportButton = getByText("Export as PDF");
    fireEvent.press(exportButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Premium Feature",
      "PDF export is available for Standard and Premium subscribers.",
      [{ text: "OK" }],
    );
    expect(mockExportPdf).not.toHaveBeenCalled();

    // Reset for other tests
    mockUsePhotoBook.canExportPdf = true;
  });

  it("shows exporting state on export button", () => {
    mockUsePhotoBook.isExporting = true;

    const { getByText } = render(<PhotoBookScreen />);

    expect(getByText("Exporting...")).toBeTruthy();

    // Reset
    mockUsePhotoBook.isExporting = false;
  });

  // BOOK-002: Edit AI-curated book selection tests

  it("shows Add Photo button in header", () => {
    const { getByText, getByTestId } = render(<PhotoBookScreen />);

    expect(getByTestId("add-photo-button")).toBeTruthy();
  });

  it("opens image picker when Add Photo is pressed", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "new-photo.jpg" }],
    });

    const { getByTestId } = render(<PhotoBookScreen />);

    const addButton = getByTestId("add-photo-button");
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith({
        mediaTypes: "Images", // MediaTypeOptions.Images mock value
        allowsEditing: false,
        quality: 0.8,
      });
    });
  });

  it("calls addPage when new photo is selected", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "new-photo.jpg" }],
    });

    const { getByTestId } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("add-photo-button"));

    await waitFor(() => {
      expect(mockAddPage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "photo",
          imageUri: "new-photo.jpg",
        }),
      );
    });
  });

  it("shows move up/down buttons on photo pages", () => {
    const { getAllByTestId } = render(<PhotoBookScreen />);

    // Should have move buttons for photo pages (not title)
    const moveUpButtons = getAllByTestId(/move-up-/);
    const moveDownButtons = getAllByTestId(/move-down-/);

    expect(moveUpButtons.length).toBeGreaterThan(0);
    expect(moveDownButtons.length).toBeGreaterThan(0);
  });

  it("calls reorderPage when move down is pressed", () => {
    const { getByTestId } = render(<PhotoBookScreen />);

    // Move second page (index 1) down
    const moveDownButton = getByTestId("move-down-page-2");
    fireEvent.press(moveDownButton);

    expect(mockReorderPage).toHaveBeenCalledWith(1, 2);
  });

  it("calls reorderPage when move up is pressed", () => {
    const { getByTestId } = render(<PhotoBookScreen />);

    // Move third page (index 2) up
    const moveUpButton = getByTestId("move-up-page-3");
    fireEvent.press(moveUpButton);

    expect(mockReorderPage).toHaveBeenCalledWith(2, 1);
  });

  it("shows confirmation when Regenerate (reset to AI) is pressed", () => {
    const { getByText } = render(<PhotoBookScreen />);

    const regenerateButton = getByText("Regenerate");
    fireEvent.press(regenerateButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Regenerate Photo Book",
      "This will reset your current customizations. Continue?",
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancel" }),
        expect.objectContaining({ text: "Regenerate" }),
      ]),
    );
  });

  it("clears and regenerates when Regenerate is confirmed", async () => {
    const { getByText } = render(<PhotoBookScreen />);

    fireEvent.press(getByText("Regenerate"));

    // Get the onPress handler from the alert and call it
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const lastCall = alertCalls[alertCalls.length - 1];
    const buttons = lastCall[2];
    const regenerateAction = buttons.find(
      (b: { text: string }) => b.text === "Regenerate",
    );
    regenerateAction.onPress();

    expect(mockClearPhotoBook).toHaveBeenCalled();
    expect(mockGeneratePhotoBook).toHaveBeenCalled();
  });
});
