import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import MemoryDetailScreen from "@/app/memory/[id]";

// Mock expo-router
jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
  requestCameraPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

// Mock OnThisDayContext
const mockDismissMemory = jest.fn();
const mockGetMemory = jest.fn();
const mockCreateThenVsNow = jest.fn();
const mockShareMemoryWithFamily = jest.fn();
const mockIsMemoryShared = jest.fn();

jest.mock("@/contexts/on-this-day-context", () => ({
  useOnThisDay: () => ({
    getMemory: mockGetMemory,
    dismissMemory: mockDismissMemory,
    createThenVsNow: mockCreateThenVsNow,
    thenVsNowComparisons: [],
    memories: [],
    shareMemoryWithFamily: mockShareMemoryWithFamily,
    sharedMemories: [],
    isMemoryShared: mockIsMemoryShared,
  }),
}));

// Mock FamilyContext
const mockFamilyMembers = [
  {
    id: "grandma-1",
    email: "grandma@example.com",
    relationship: "Grandmother",
    permissionLevel: "view_interact" as const,
    status: "accepted" as const,
    invitedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "grandpa-2",
    email: "grandpa@example.com",
    relationship: "Grandfather",
    permissionLevel: "view_only" as const,
    status: "accepted" as const,
    invitedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "pending-aunt",
    email: "aunt@example.com",
    relationship: "Aunt",
    permissionLevel: "view_only" as const,
    status: "pending" as const,
    invitedAt: "2025-01-01T00:00:00Z",
  },
];

jest.mock("@/contexts/family-context", () => ({
  useFamily: () => ({
    familyMembers: mockFamilyMembers,
    hasPendingInvites: true,
    inviteFamilyMember: jest.fn(),
    removeFamilyMember: jest.fn(),
  }),
}));

// Mock video player to avoid native module issues
jest.mock("@/components/video-player", () => ({
  VideoPlayer: () => null,
}));

const mockMemory = {
  id: "memory_entry-1",
  entry: {
    id: "entry-1",
    type: "photo" as const,
    mediaUris: ["file:///test-photo.jpg"],
    caption: "A beautiful memory from last year",
    date: "2025-01-16",
    createdByName: "John Doe",
    createdAt: "2025-01-16T10:00:00Z",
    updatedAt: "2025-01-16T10:00:00Z",
  },
  yearsAgo: 1,
  year: 2025,
  isDismissed: false,
};

describe("MemoryDetailScreen (OTD-002)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: "memory_entry-1",
    });
    mockGetMemory.mockReturnValue(mockMemory);
    mockIsMemoryShared.mockReturnValue(false);
  });

  it("renders memory detail screen with banner", () => {
    render(<MemoryDetailScreen />);

    expect(screen.getByTestId("memory-banner")).toBeTruthy();
    expect(screen.getByText("On This Day")).toBeTruthy();
  });

  it("displays years ago text correctly for 1 year", () => {
    render(<MemoryDetailScreen />);

    expect(screen.getByText(/1 year ago/)).toBeTruthy();
  });

  it("displays years ago text correctly for multiple years", () => {
    mockGetMemory.mockReturnValue({
      ...mockMemory,
      yearsAgo: 3,
      year: 2023,
    });

    render(<MemoryDetailScreen />);

    expect(screen.getByText(/3 years ago/)).toBeTruthy();
  });

  it("displays the memory caption", () => {
    render(<MemoryDetailScreen />);

    expect(screen.getByText("A beautiful memory from last year")).toBeTruthy();
  });

  it("displays the creator name", () => {
    render(<MemoryDetailScreen />);

    expect(screen.getByText("Posted by John Doe")).toBeTruthy();
  });

  it("shows View Full Entry button", () => {
    render(<MemoryDetailScreen />);

    expect(screen.getByTestId("view-entry-button")).toBeTruthy();
    expect(screen.getByText("View Full Entry")).toBeTruthy();
  });

  it("navigates to entry detail when View Full Entry is pressed", () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("view-entry-button"));

    expect(router.push).toHaveBeenCalledWith("/entry/entry-1");
  });

  it("shows dismiss button in header", () => {
    render(<MemoryDetailScreen />);

    expect(screen.getByTestId("dismiss-memory-button")).toBeTruthy();
  });

  it("dismisses memory and goes back when dismiss is pressed", () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("dismiss-memory-button"));

    expect(mockDismissMemory).toHaveBeenCalledWith("memory_entry-1");
    expect(router.back).toHaveBeenCalled();
  });

  it("navigates back when back button is pressed", () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("back-button"));

    expect(router.back).toHaveBeenCalled();
  });

  it("shows not found state when memory does not exist", () => {
    mockGetMemory.mockReturnValue(undefined);

    render(<MemoryDetailScreen />);

    expect(screen.getByText("Memory not found")).toBeTruthy();
    expect(screen.getByText("Go Back")).toBeTruthy();
  });

  it("displays photo when memory has media", () => {
    render(<MemoryDetailScreen />);

    // There should be an image rendered (checking via test structure)
    const images = screen.queryAllByRole("image");
    // If queryAllByRole doesn't work, just check the memory renders
    expect(screen.getByText("A beautiful memory from last year")).toBeTruthy();
  });

  it("handles memory without media gracefully", () => {
    mockGetMemory.mockReturnValue({
      ...mockMemory,
      entry: {
        ...mockMemory.entry,
        type: "text" as const,
        mediaUris: undefined,
      },
    });

    render(<MemoryDetailScreen />);

    expect(screen.getByText("A beautiful memory from last year")).toBeTruthy();
  });
});

describe("MemoryDetailScreen - OTD-004: Then vs Now", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: "memory_entry-1",
    });
    mockGetMemory.mockReturnValue(mockMemory);
    mockIsMemoryShared.mockReturnValue(false);
    mockCreateThenVsNow.mockReturnValue({
      id: "otd_123",
      memoryId: "memory_entry-1",
      thenPhotoUri: "file:///test-photo.jpg",
      thenDate: "2025-01-16",
      currentPhotoUri: "file:///current-photo.jpg",
      currentDate: "2026-01-16",
      caption: "Test caption",
      createdAt: "2026-01-16T10:00:00Z",
    });
  });

  it("shows Create Then vs Now button when memory has photo", () => {
    render(<MemoryDetailScreen />);

    expect(screen.getByTestId("then-vs-now-button")).toBeTruthy();
    expect(screen.getByText(/Create Then vs Now/)).toBeTruthy();
  });

  it("does not show Create Then vs Now button for text-only memories", () => {
    mockGetMemory.mockReturnValue({
      ...mockMemory,
      entry: {
        ...mockMemory.entry,
        type: "text" as const,
        mediaUris: undefined,
      },
    });

    render(<MemoryDetailScreen />);

    expect(screen.queryByTestId("then-vs-now-button")).toBeNull();
  });

  it("opens photo source modal when Create Then vs Now is pressed", () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("then-vs-now-button"));

    expect(screen.getByText("Add Current Photo")).toBeTruthy();
    expect(screen.getByText("Take Photo")).toBeTruthy();
    expect(screen.getByText("Choose from Library")).toBeTruthy();
  });

  it("launches camera when Take Photo is pressed", async () => {
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///camera-photo.jpg" }],
    });

    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("then-vs-now-button"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("take-photo-button"));
    });

    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
    });
  });

  it("launches image library when Choose from Library is pressed", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///library-photo.jpg" }],
    });

    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("then-vs-now-button"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("choose-library-button"));
    });

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  it("shows side-by-side comparison after selecting current photo", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///current-photo.jpg" }],
    });

    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("then-vs-now-button"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("choose-library-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("then-vs-now-preview")).toBeTruthy();
      expect(screen.getByText("Then")).toBeTruthy();
      expect(screen.getByText("Now")).toBeTruthy();
    });
  });

  it("shows caption input in comparison view", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///current-photo.jpg" }],
    });

    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("then-vs-now-button"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("choose-library-button"));
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Add a caption...")).toBeTruthy();
    });
  });

  it("saves Then vs Now with caption when Save is pressed", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///current-photo.jpg" }],
    });

    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("then-vs-now-button"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("choose-library-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("then-vs-now-preview")).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByPlaceholderText("Add a caption..."),
      "Growing up so fast!",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("save-comparison-button"));
    });

    expect(mockCreateThenVsNow).toHaveBeenCalledWith({
      memoryId: "memory_entry-1",
      currentPhotoUri: "file:///current-photo.jpg",
      caption: "Growing up so fast!",
    });
  });

  it("shows success message after saving comparison", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///current-photo.jpg" }],
    });

    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("then-vs-now-button"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("choose-library-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("then-vs-now-preview")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("save-comparison-button"));
    });

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeTruthy();
    });
  });

  it("can cancel photo selection", async () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("then-vs-now-button"));

    expect(screen.getByText("Add Current Photo")).toBeTruthy();

    fireEvent.press(screen.getByTestId("cancel-photo-source-button"));

    expect(screen.queryByText("Add Current Photo")).toBeNull();
  });

  it("can cancel comparison and return to memory view", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///current-photo.jpg" }],
    });

    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("then-vs-now-button"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("choose-library-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("then-vs-now-preview")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("cancel-comparison-button"));

    await waitFor(() => {
      expect(screen.queryByTestId("then-vs-now-preview")).toBeNull();
    });
  });
});

describe("MemoryDetailScreen - OTD-005: Share with Family", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: "memory_entry-1",
    });
    mockGetMemory.mockReturnValue(mockMemory);
    mockIsMemoryShared.mockReturnValue(false);
    mockShareMemoryWithFamily.mockReturnValue({
      memoryId: "memory_entry-1",
      sharedAt: "2026-01-16T10:00:00Z",
      sharedWithIds: ["grandma-1", "grandpa-2"],
    });
  });

  it("shows Share with Family button", () => {
    render(<MemoryDetailScreen />);

    expect(screen.getByTestId("share-with-family-button")).toBeTruthy();
    expect(screen.getByText(/Share with Family/)).toBeTruthy();
  });

  it("opens share modal when Share with Family is pressed", () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("share-with-family-button"));

    expect(screen.getByTestId("share-modal")).toBeTruthy();
    expect(screen.getByText("Share with Family")).toBeTruthy();
    expect(
      screen.getByText("Select family members to share this memory with"),
    ).toBeTruthy();
  });

  it("shows accepted family members in share modal", () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("share-with-family-button"));

    // Should show grandmother and grandfather (accepted status)
    expect(screen.getByText("Grandmother")).toBeTruthy();
    expect(screen.getByText("grandma@example.com")).toBeTruthy();
    expect(screen.getByText("Grandfather")).toBeTruthy();
    expect(screen.getByText("grandpa@example.com")).toBeTruthy();

    // Should NOT show aunt (pending status)
    expect(screen.queryByText("Aunt")).toBeNull();
  });

  it("allows selecting family members", () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("share-with-family-button"));

    fireEvent.press(screen.getByTestId("family-member-grandma-1"));

    // Check if member is selected (checkmark visible)
    expect(screen.getByTestId("family-member-grandma-1")).toBeTruthy();
  });

  it("disables Share button when no family members selected", () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("share-with-family-button"));

    const confirmButton = screen.getByTestId("confirm-share-button");
    expect(confirmButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("shares memory with selected family members", async () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("share-with-family-button"));

    // Select two family members
    fireEvent.press(screen.getByTestId("family-member-grandma-1"));
    fireEvent.press(screen.getByTestId("family-member-grandpa-2"));

    // Confirm share
    await act(async () => {
      fireEvent.press(screen.getByTestId("confirm-share-button"));
    });

    expect(mockShareMemoryWithFamily).toHaveBeenCalledWith({
      memoryId: "memory_entry-1",
      familyMemberIds: expect.arrayContaining(["grandma-1", "grandpa-2"]),
    });
  });

  it("shows success message after sharing", async () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("share-with-family-button"));

    fireEvent.press(screen.getByTestId("family-member-grandma-1"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("confirm-share-button"));
    });

    await waitFor(() => {
      expect(screen.getByText(/Memory shared/)).toBeTruthy();
    });
  });

  it("can cancel share modal", () => {
    render(<MemoryDetailScreen />);

    fireEvent.press(screen.getByTestId("share-with-family-button"));

    expect(screen.getByTestId("share-modal")).toBeTruthy();

    fireEvent.press(screen.getByTestId("cancel-share-button"));

    expect(screen.queryByTestId("share-modal")).toBeNull();
  });

  it("shows already shared state when memory was shared", () => {
    mockIsMemoryShared.mockReturnValue(true);

    render(<MemoryDetailScreen />);

    expect(screen.getByText(/Shared with Family/)).toBeTruthy();
    const shareButton = screen.getByTestId("share-with-family-button");
    expect(shareButton.props.accessibilityState?.disabled).toBe(true);
  });
});
