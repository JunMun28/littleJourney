import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import { MemorySlideshow } from "@/components/memory-slideshow";

// Mock expo-av for audio playback
jest.mock("expo-av", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          pauseAsync: jest.fn(),
          stopAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
      }),
    },
  },
}));

const mockMemories = [
  {
    id: "memory-1",
    entry: {
      id: "entry-1",
      type: "photo" as const,
      mediaUris: ["file:///photo1.jpg"],
      caption: "First memory",
      date: "2025-01-16",
      createdAt: "2025-01-16T10:00:00Z",
      updatedAt: "2025-01-16T10:00:00Z",
    },
    yearsAgo: 1,
    year: 2025,
    isDismissed: false,
  },
  {
    id: "memory-2",
    entry: {
      id: "entry-2",
      type: "photo" as const,
      mediaUris: ["file:///photo2.jpg", "file:///photo2b.jpg"],
      caption: "Second memory",
      date: "2024-01-16",
      createdAt: "2024-01-16T10:00:00Z",
      updatedAt: "2024-01-16T10:00:00Z",
    },
    yearsAgo: 2,
    year: 2024,
    isDismissed: false,
  },
];

const mockOnClose = jest.fn();

describe("MemorySlideshow (OTD-006)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders slideshow when visible is true", () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByTestId("slideshow-image")).toBeTruthy();
    expect(screen.getByTestId("play-pause-button")).toBeTruthy();
  });

  it("does not render when visible is false", () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={false}
        onClose={mockOnClose}
      />,
    );

    expect(screen.queryByTestId("slideshow-image")).toBeNull();
  });

  it("shows exit button", () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByTestId("exit-slideshow-button")).toBeTruthy();
  });

  it("calls onClose when exit button is pressed", async () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("exit-slideshow-button"));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows photo counter", () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    // 3 photos total (1 from first memory, 2 from second)
    expect(screen.getByTestId("slideshow-counter")).toBeTruthy();
    expect(screen.getByText("1 / 3")).toBeTruthy();
  });

  it("toggles play/pause when button is pressed", async () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    const playPauseButton = screen.getByTestId("play-pause-button");

    // Initially playing, so shows pause icon
    expect(screen.getByText("⏸")).toBeTruthy();

    await act(async () => {
      fireEvent.press(playPauseButton);
    });

    // Now paused, shows play icon
    await waitFor(() => {
      expect(screen.getByText("▶")).toBeTruthy();
    });
  });

  it("toggles play/pause when tapping slide area", async () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    const tapArea = screen.getByTestId("slideshow-tap-area");

    await act(async () => {
      fireEvent.press(tapArea);
    });

    // Now paused, shows play icon
    await waitFor(() => {
      expect(screen.getByText("▶")).toBeTruthy();
    });
  });

  it("navigates to next slide when next button is pressed", async () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText("1 / 3")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("next-slide-button"));
    });

    await waitFor(() => {
      expect(screen.getByText("2 / 3")).toBeTruthy();
    });
  });

  it("navigates to previous slide when prev button is pressed", async () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    // Go to next first
    await act(async () => {
      fireEvent.press(screen.getByTestId("next-slide-button"));
    });

    expect(screen.getByText("2 / 3")).toBeTruthy();

    // Now go back
    await act(async () => {
      fireEvent.press(screen.getByTestId("prev-slide-button"));
    });

    await waitFor(() => {
      expect(screen.getByText("1 / 3")).toBeTruthy();
    });
  });

  it("shows music button", () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByTestId("music-button")).toBeTruthy();
  });

  it("opens music picker when music button is pressed", async () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("music-button"));
    });

    await waitFor(() => {
      expect(screen.getByText("Background Music")).toBeTruthy();
    });
  });

  it("displays caption and years ago text", () => {
    render(
      <MemorySlideshow
        memories={mockMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText("First memory")).toBeTruthy();
    expect(screen.getByText("1 year ago")).toBeTruthy();
  });

  it("shows empty state when no photo memories", () => {
    const videoOnlyMemories = [
      {
        id: "video-memory",
        entry: {
          id: "entry-video",
          type: "video" as const,
          mediaUris: ["file:///video.mp4"],
          caption: "Video memory",
          date: "2025-01-16",
          createdAt: "2025-01-16T10:00:00Z",
          updatedAt: "2025-01-16T10:00:00Z",
        },
        yearsAgo: 1,
        year: 2025,
        isDismissed: false,
      },
    ];

    render(
      <MemorySlideshow
        memories={videoOnlyMemories}
        visible={true}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText("No photos to display in slideshow")).toBeTruthy();
    expect(screen.getByTestId("close-slideshow-button")).toBeTruthy();
  });

  it("closes empty state when close button pressed", async () => {
    render(
      <MemorySlideshow memories={[]} visible={true} onClose={mockOnClose} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("close-slideshow-button"));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
});
