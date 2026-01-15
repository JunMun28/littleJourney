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

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock the photo-book context with exportPdf function
const mockExportPdf = jest.fn();
const mockGeneratePhotoBook = jest.fn();
const mockUsePhotoBook = {
  pages: [
    { id: "page-1", type: "title" as const, title: "Baby's First Year" },
    {
      id: "page-2",
      type: "photo" as const,
      imageUri: "photo.jpg",
      caption: "First smile",
    },
  ],
  isGenerating: false,
  isExporting: false,
  canExportPdf: true,
  generatePhotoBook: mockGeneratePhotoBook,
  reorderPage: jest.fn(),
  removePage: jest.fn(),
  updatePageCaption: jest.fn(),
  clearPhotoBook: jest.fn(),
  exportPdf: mockExportPdf,
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
    expect(getByText("2 pages")).toBeTruthy();
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
});
