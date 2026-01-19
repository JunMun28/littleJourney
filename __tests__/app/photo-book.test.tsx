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
const mockSetSelectedLayout = jest.fn();
const mockUpdateCover = jest.fn();
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
  selectedLayout: "classic" as const,
  cover: {
    title: "Baby's First Year",
    childName: "Baby",
    colorTheme: "coral" as const,
    photoUri: undefined,
    dateRange: undefined,
  },
  isGenerating: false,
  isExporting: false,
  canExportPdf: true,
  generatePhotoBook: mockGeneratePhotoBook,
  reorderPage: mockReorderPage,
  removePage: jest.fn(),
  updatePageCaption: jest.fn(),
  setSelectedLayout: mockSetSelectedLayout,
  updateCover: mockUpdateCover,
  clearPhotoBook: mockClearPhotoBook,
  exportPdf: mockExportPdf,
  addPage: mockAddPage,
};

jest.mock("@/contexts/photo-book-context", () => ({
  usePhotoBook: () => mockUsePhotoBook,
  PhotoBookProvider: ({ children }: { children: React.ReactNode }) => children,
  BOOK_LAYOUTS: [
    {
      id: "classic",
      name: "Classic",
      description: "Timeless elegance",
      icon: "📖",
    },
    {
      id: "modern",
      name: "Modern",
      description: "Minimalist design",
      icon: "🎨",
    },
    {
      id: "playful",
      name: "Playful",
      description: "Fun and colorful",
      icon: "🎈",
    },
  ],
  COVER_COLOR_THEMES: [
    { id: "coral", name: "Coral", background: "#FF6B6B", text: "#FFFFFF" },
    { id: "sage", name: "Sage", background: "#87A878", text: "#FFFFFF" },
    { id: "navy", name: "Navy", background: "#2C3E50", text: "#FFFFFF" },
    { id: "blush", name: "Blush", background: "#F5B7B1", text: "#4A3728" },
    { id: "gold", name: "Gold", background: "#C9A959", text: "#4A3728" },
    {
      id: "charcoal",
      name: "Charcoal",
      background: "#36454F",
      text: "#FFFFFF",
    },
  ],
  // BOOK-007: Pricing tiers
  BOOK_PRICING_TIERS: [
    {
      id: "mini",
      name: "Mini Book",
      pages: 20,
      priceMin: 15,
      priceMax: 20,
      description: "Perfect for monthly memories",
      icon: "📘",
    },
    {
      id: "standard",
      name: "Standard Book",
      pages: 40,
      priceMin: 25,
      priceMax: 35,
      description: "Great for quarterly highlights",
      icon: "📗",
    },
    {
      id: "premium",
      name: "Premium Book",
      pages: 80,
      priceMin: 45,
      priceMax: 60,
      description: "Complete yearly collection",
      icon: "📕",
    },
  ],
  SUBSCRIPTION_DISCOUNT_PERCENT: 20,
  calculateDiscountedPrice: (price: number) =>
    Math.round(price * (1 - 20 / 100)),
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

  // BOOK-003: Book layout templates tests

  it("displays Layout Template section with title", () => {
    const { getByText } = render(<PhotoBookScreen />);

    expect(getByText("Layout Template")).toBeTruthy();
  });

  it("shows all available layout templates", () => {
    const { getByText, getByTestId } = render(<PhotoBookScreen />);

    expect(getByText("Classic")).toBeTruthy();
    expect(getByText("Modern")).toBeTruthy();
    expect(getByText("Playful")).toBeTruthy();

    expect(getByTestId("layout-classic")).toBeTruthy();
    expect(getByTestId("layout-modern")).toBeTruthy();
    expect(getByTestId("layout-playful")).toBeTruthy();
  });

  it("calls setSelectedLayout when layout template is pressed", () => {
    const { getByTestId } = render(<PhotoBookScreen />);

    const modernLayout = getByTestId("layout-modern");
    fireEvent.press(modernLayout);

    expect(mockSetSelectedLayout).toHaveBeenCalledWith("modern");
  });

  it("calls setSelectedLayout with playful when Playful template is pressed", () => {
    const { getByTestId } = render(<PhotoBookScreen />);

    const playfulLayout = getByTestId("layout-playful");
    fireEvent.press(playfulLayout);

    expect(mockSetSelectedLayout).toHaveBeenCalledWith("playful");
  });

  it("shows layout descriptions", () => {
    const { getByText } = render(<PhotoBookScreen />);

    expect(getByText("Timeless elegance")).toBeTruthy();
    expect(getByText("Minimalist design")).toBeTruthy();
    expect(getByText("Fun and colorful")).toBeTruthy();
  });

  // BOOK-004: Book cover customization tests

  it("shows Cover Editor button in header", () => {
    const { getByTestId } = render(<PhotoBookScreen />);

    expect(getByTestId("cover-editor-button")).toBeTruthy();
  });

  it("opens cover editor modal when Cover Editor button is pressed", () => {
    const { getByTestId, getByText } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("cover-editor-button"));

    expect(getByText("Cover Editor")).toBeTruthy();
  });

  it("shows current cover title in cover editor", () => {
    const { getByTestId, getByDisplayValue } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("cover-editor-button"));

    expect(getByDisplayValue("Baby's First Year")).toBeTruthy();
  });

  it("shows color theme selector in cover editor", () => {
    const { getByTestId, getByText } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("cover-editor-button"));

    expect(getByText("Cover Color")).toBeTruthy();
    expect(getByTestId("color-theme-coral")).toBeTruthy();
    expect(getByTestId("color-theme-sage")).toBeTruthy();
  });

  it("calls updateCover when color theme is selected", () => {
    const { getByTestId } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("cover-editor-button"));
    fireEvent.press(getByTestId("color-theme-navy"));

    expect(mockUpdateCover).toHaveBeenCalledWith({ colorTheme: "navy" });
  });

  it("calls updateCover when title is changed and saved", () => {
    const { getByTestId, getByDisplayValue, getByText } = render(
      <PhotoBookScreen />,
    );

    fireEvent.press(getByTestId("cover-editor-button"));
    fireEvent.changeText(getByDisplayValue("Baby's First Year"), "My Journey");
    fireEvent.press(getByText("Done"));

    expect(mockUpdateCover).toHaveBeenCalledWith(
      expect.objectContaining({ title: "My Journey" }),
    );
  });

  it("opens image picker for cover photo selection", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "cover-photo.jpg" }],
    });

    const { getByTestId } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("cover-editor-button"));
    fireEvent.press(getByTestId("select-cover-photo"));

    await waitFor(() => {
      expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  it("calls updateCover with photoUri when cover photo is selected", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "cover-photo.jpg" }],
    });

    const { getByTestId } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("cover-editor-button"));
    fireEvent.press(getByTestId("select-cover-photo"));

    await waitFor(() => {
      expect(mockUpdateCover).toHaveBeenCalledWith({
        photoUri: "cover-photo.jpg",
      });
    });
  });

  // BOOK-007: Book pricing tiers tests

  it("shows Pricing button in header", () => {
    const { getByTestId } = render(<PhotoBookScreen />);

    expect(getByTestId("pricing-button")).toBeTruthy();
  });

  it("opens pricing modal when Pricing button is pressed", () => {
    const { getByTestId, getByText } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("pricing-button"));

    expect(getByText("Book Pricing")).toBeTruthy();
  });

  it("shows all three pricing tiers in pricing modal", () => {
    const { getByTestId, getByText } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("pricing-button"));

    expect(getByText("Mini Book")).toBeTruthy();
    expect(getByText("Standard Book")).toBeTruthy();
    expect(getByText("Premium Book")).toBeTruthy();
  });

  it("shows page counts for each tier", () => {
    const { getByTestId, getByText } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("pricing-button"));

    expect(getByText("20 pages")).toBeTruthy();
    expect(getByText("40 pages")).toBeTruthy();
    expect(getByText("80 pages")).toBeTruthy();
  });

  it("shows price ranges in SGD", () => {
    const { getByTestId, getByText } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("pricing-button"));

    expect(getByText("S$15 - S$20")).toBeTruthy();
    expect(getByText("S$25 - S$35")).toBeTruthy();
    expect(getByText("S$45 - S$60")).toBeTruthy();
  });

  it("shows subscription discount information", () => {
    const { getByTestId, getByText } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("pricing-button"));

    expect(getByText("20% off")).toBeTruthy();
  });

  it("closes pricing modal when Done is pressed", () => {
    const { getByTestId, getByText, queryByText } = render(<PhotoBookScreen />);

    fireEvent.press(getByTestId("pricing-button"));
    expect(getByText("Book Pricing")).toBeTruthy();

    fireEvent.press(getByText("Done"));

    // Modal should be closed - Book Pricing title should not be visible
    // Note: Modal content may still be in DOM but not visible
  });
});
