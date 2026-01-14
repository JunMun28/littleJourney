import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text, View } from "react-native";

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
});
