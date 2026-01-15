import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SearchScreen from "@/app/(tabs)/search";
import { entryApi, clearAllMockData } from "@/services/api-client";

// Create wrapper with TanStack Query
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Helper to add test entries via API
async function addTestEntries() {
  await entryApi.createEntry({
    entry: {
      type: "photo",
      caption: "Baby's first smile",
      date: "2025-01-10",
      mediaUris: ["photo1.jpg"],
      tags: ["milestone", "happy"],
    },
  });
  await entryApi.createEntry({
    entry: {
      type: "photo",
      caption: "Playing in the park",
      date: "2025-01-12",
      mediaUris: ["photo2.jpg"],
      tags: ["outdoor"],
    },
  });
  await entryApi.createEntry({
    entry: {
      type: "text",
      caption: "First steps today!",
      date: "2025-01-15",
      tags: ["milestone"],
    },
  });
}

describe("SearchScreen", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  it("renders search input", () => {
    const TestWrapper = createTestWrapper();
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    expect(getByPlaceholderText("Search memories...")).toBeTruthy();
  });

  it("shows empty state when no search query", () => {
    const TestWrapper = createTestWrapper();
    const { getByText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    expect(getByText("Search Your Memories")).toBeTruthy();
  });

  it("filters entries by caption text", async () => {
    const TestWrapper = createTestWrapper();
    await addTestEntries();

    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    // Wait for entries to load
    await waitFor(() => {
      expect(getByPlaceholderText("Search memories...")).toBeTruthy();
    });

    const searchInput = getByPlaceholderText("Search memories...");
    fireEvent.changeText(searchInput, "smile");

    await waitFor(() => {
      expect(getByText("Baby's first smile")).toBeTruthy();
      expect(queryByText("Playing in the park")).toBeNull();
      expect(queryByText("First steps today!")).toBeNull();
    });
  });

  it("shows no results message when search has no matches", async () => {
    const TestWrapper = createTestWrapper();
    const { getByPlaceholderText, getByText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    const searchInput = getByPlaceholderText("Search memories...");
    fireEvent.changeText(searchInput, "nonexistent");

    await waitFor(() => {
      expect(getByText("No Results")).toBeTruthy();
    });
  });

  it("shows filter chips for entry types", () => {
    const TestWrapper = createTestWrapper();
    const { getByText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    expect(getByText("All")).toBeTruthy();
    expect(getByText("Photos")).toBeTruthy();
    expect(getByText("Videos")).toBeTruthy();
    expect(getByText("Text")).toBeTruthy();
  });

  it("filters by entry type when chip is pressed", async () => {
    const TestWrapper = createTestWrapper();
    await addTestEntries();

    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    // Wait for entries to load
    await waitFor(() => {
      expect(getByPlaceholderText("Search memories...")).toBeTruthy();
    });

    // First search for something
    const searchInput = getByPlaceholderText("Search memories...");
    fireEvent.changeText(searchInput, "first");

    // Should show both photo and text entries with "first"
    await waitFor(() => {
      expect(getByText("Baby's first smile")).toBeTruthy();
      expect(getByText("First steps today!")).toBeTruthy();
    });

    // Filter to text only
    fireEvent.press(getByText("Text"));

    await waitFor(() => {
      expect(queryByText("Baby's first smile")).toBeNull();
      expect(getByText("First steps today!")).toBeTruthy();
    });
  });

  // New tests for TanStack Query integration
  it("shows loading state initially", () => {
    const TestWrapper = createTestWrapper();
    // Don't add entries, just render
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    // Should still render search input while loading
    expect(getByPlaceholderText("Search memories...")).toBeTruthy();
  });

  it("searches by tags", async () => {
    const TestWrapper = createTestWrapper();
    await addTestEntries();

    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    const searchInput = getByPlaceholderText("Search memories...");
    fireEvent.changeText(searchInput, "outdoor");

    await waitFor(() => {
      expect(getByText("Playing in the park")).toBeTruthy();
      expect(queryByText("Baby's first smile")).toBeNull();
      expect(queryByText("First steps today!")).toBeNull();
    });
  });

  // Milestone filter tests (SEARCH-005)
  describe("milestone filter", () => {
    it("shows Milestones filter chip", () => {
      const TestWrapper = createTestWrapper();
      const { getByText } = render(
        <TestWrapper>
          <SearchScreen />
        </TestWrapper>,
      );

      expect(getByText("Milestones")).toBeTruthy();
    });

    it("filters to show only milestone entries when Milestones chip pressed", async () => {
      const TestWrapper = createTestWrapper();
      // Add regular entry with "moment" tag to match search
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "Regular park photo",
          date: "2025-01-10",
          mediaUris: ["regular.jpg"],
          tags: ["moment"],
        },
      });
      // Add milestone entry with "moment" tag
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "First smile photo",
          date: "2025-01-15",
          mediaUris: ["milestone.jpg"],
          milestoneId: "milestone-123",
          tags: ["moment"],
        },
      });
      // Add another milestone entry with "moment" tag
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "First steps photo",
          date: "2025-01-20",
          mediaUris: ["steps.jpg"],
          milestoneId: "milestone-456",
          tags: ["moment"],
        },
      });

      const { getByPlaceholderText, getByText, queryByText } = render(
        <TestWrapper>
          <SearchScreen />
        </TestWrapper>,
      );

      // Search for a common tag
      const searchInput = getByPlaceholderText("Search memories...");
      fireEvent.changeText(searchInput, "moment");

      // Should show all entries initially
      await waitFor(() => {
        expect(getByText("Regular park photo")).toBeTruthy();
        expect(getByText("First smile photo")).toBeTruthy();
      });

      // Press Milestones filter
      fireEvent.press(getByText("Milestones"));

      // Should only show milestone entries
      await waitFor(() => {
        expect(queryByText("Regular park photo")).toBeNull();
        expect(getByText("First smile photo")).toBeTruthy();
        expect(getByText("First steps photo")).toBeTruthy();
      });
    });

    it("combines milestone filter with other filters", async () => {
      const TestWrapper = createTestWrapper();
      // Add photo milestone with "baby" tag
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "Photo milestone",
          date: "2025-01-15",
          mediaUris: ["photo.jpg"],
          milestoneId: "milestone-123",
          tags: ["baby"],
        },
      });
      // Add text milestone with "baby" tag
      await entryApi.createEntry({
        entry: {
          type: "text",
          caption: "Text milestone",
          date: "2025-01-20",
          milestoneId: "milestone-456",
          tags: ["baby"],
        },
      });
      // Add regular text entry with "baby" tag
      await entryApi.createEntry({
        entry: {
          type: "text",
          caption: "Regular text entry",
          date: "2025-01-22",
          tags: ["baby"],
        },
      });

      const { getByPlaceholderText, getByText, queryByText } = render(
        <TestWrapper>
          <SearchScreen />
        </TestWrapper>,
      );

      // Search for "baby" tag to get all entries
      const searchInput = getByPlaceholderText("Search memories...");
      fireEvent.changeText(searchInput, "baby");

      // Should show all entries initially
      await waitFor(() => {
        expect(getByText("Photo milestone")).toBeTruthy();
        expect(getByText("Text milestone")).toBeTruthy();
        expect(getByText("Regular text entry")).toBeTruthy();
      });

      // Filter to milestones + text only
      fireEvent.press(getByText("Milestones"));
      fireEvent.press(getByText("Text"));

      // Should only show text milestone
      await waitFor(() => {
        expect(queryByText("Photo milestone")).toBeNull();
        expect(queryByText("Regular text entry")).toBeNull();
        expect(getByText("Text milestone")).toBeTruthy();
      });
    });

    it("shows milestone badge on result cards for milestone entries", async () => {
      const TestWrapper = createTestWrapper();
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "First smile moment",
          date: "2025-01-15",
          mediaUris: ["photo.jpg"],
          milestoneId: "milestone-123",
        },
      });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <SearchScreen />
        </TestWrapper>,
      );

      const searchInput = getByPlaceholderText("Search memories...");
      fireEvent.changeText(searchInput, "smile");

      await waitFor(() => {
        expect(getByText("First smile moment")).toBeTruthy();
        expect(getByText("⭐")).toBeTruthy(); // Milestone indicator
      });
    });
  });

  // Date range filter tests (SEARCH-003)
  describe("date range filter", () => {
    it("shows date range filter button", () => {
      const TestWrapper = createTestWrapper();
      const { getByText } = render(
        <TestWrapper>
          <SearchScreen />
        </TestWrapper>,
      );

      expect(getByText("Date Range")).toBeTruthy();
    });

    it("opens date range modal when button pressed", async () => {
      const TestWrapper = createTestWrapper();
      const { getByText } = render(
        <TestWrapper>
          <SearchScreen />
        </TestWrapper>,
      );

      fireEvent.press(getByText("Date Range"));

      await waitFor(() => {
        expect(getByText("Filter by Date")).toBeTruthy();
      });
    });

    it("filters entries by date range", async () => {
      const TestWrapper = createTestWrapper();
      // Add entries with different dates
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "January photo",
          date: "2025-01-15",
          mediaUris: ["jan.jpg"],
        },
      });
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "February photo",
          date: "2025-02-15",
          mediaUris: ["feb.jpg"],
        },
      });
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "March photo",
          date: "2025-03-15",
          mediaUris: ["mar.jpg"],
        },
      });

      const { getByPlaceholderText, getByText, getByTestId, queryByText } =
        render(
          <TestWrapper>
            <SearchScreen />
          </TestWrapper>,
        );

      // Search for "photo" to get all entries
      const searchInput = getByPlaceholderText("Search memories...");
      fireEvent.changeText(searchInput, "photo");

      await waitFor(() => {
        expect(getByText("January photo")).toBeTruthy();
        expect(getByText("February photo")).toBeTruthy();
        expect(getByText("March photo")).toBeTruthy();
      });

      // Open date range modal
      fireEvent.press(getByText("Date Range"));

      await waitFor(() => {
        expect(getByText("Filter by Date")).toBeTruthy();
      });

      // Select January 2025
      fireEvent.press(getByTestId("month-2025-01"));

      // Apply filter
      fireEvent.press(getByText("Apply"));

      // Should only show January entry
      await waitFor(() => {
        expect(getByText("January photo")).toBeTruthy();
        expect(queryByText("February photo")).toBeNull();
        expect(queryByText("March photo")).toBeNull();
      });
    });

    it("clears date range filter", async () => {
      const TestWrapper = createTestWrapper();
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "January photo",
          date: "2025-01-15",
          mediaUris: ["jan.jpg"],
        },
      });
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "February photo",
          date: "2025-02-15",
          mediaUris: ["feb.jpg"],
        },
      });

      const { getByPlaceholderText, getByText, getByTestId, queryByText } =
        render(
          <TestWrapper>
            <SearchScreen />
          </TestWrapper>,
        );

      const searchInput = getByPlaceholderText("Search memories...");
      fireEvent.changeText(searchInput, "photo");

      await waitFor(() => {
        expect(getByText("January photo")).toBeTruthy();
        expect(getByText("February photo")).toBeTruthy();
      });

      // Apply January filter
      fireEvent.press(getByText("Date Range"));
      await waitFor(() => {
        expect(getByText("Filter by Date")).toBeTruthy();
      });
      fireEvent.press(getByTestId("month-2025-01"));
      fireEvent.press(getByText("Apply"));

      await waitFor(() => {
        expect(queryByText("February photo")).toBeNull();
      });

      // Clear filter
      fireEvent.press(getByText("Jan 2025")); // Date range chip shows selected month
      await waitFor(() => {
        expect(getByText("Filter by Date")).toBeTruthy();
      });
      fireEvent.press(getByText("Clear"));

      // Should show all entries again
      await waitFor(() => {
        expect(getByText("January photo")).toBeTruthy();
        expect(getByText("February photo")).toBeTruthy();
      });
    });
  });

  // Relevance ordering tests (SEARCH-007)
  describe("relevance ordering", () => {
    it("orders results by relevance not date", async () => {
      const TestWrapper = createTestWrapper();
      // Entry with "beach" in middle of caption (older)
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "Fun at the beach today",
          date: "2025-01-10",
          mediaUris: ["beach1.jpg"],
        },
      });
      // Entry with "beach" at start of caption (newer)
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "Beach day party",
          date: "2025-01-20",
          mediaUris: ["beach2.jpg"],
        },
      });
      // Entry with "beach" only in tag (newest)
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "Summer photo",
          date: "2025-01-25",
          mediaUris: ["summer.jpg"],
          tags: ["beach"],
        },
      });

      const { getByPlaceholderText, getAllByText } = render(
        <TestWrapper>
          <SearchScreen />
        </TestWrapper>,
      );

      const searchInput = getByPlaceholderText("Search memories...");
      fireEvent.changeText(searchInput, "beach");

      await waitFor(() => {
        // Get all result captions in order
        const results = getAllByText(/Beach|Fun|Summer/);
        // Should be ordered by relevance: "Beach day party" (start) > "Fun at the beach" (middle) > "Summer photo" (tag only)
        expect(results[0].props.children).toBe("Beach day party");
        expect(results[1].props.children).toBe("Fun at the beach today");
        expect(results[2].props.children).toBe("Summer photo");
      });
    });

    it("ranks exact caption match highest", async () => {
      const TestWrapper = createTestWrapper();
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "smile",
          date: "2025-01-10",
          mediaUris: ["exact.jpg"],
        },
      });
      await entryApi.createEntry({
        entry: {
          type: "photo",
          caption: "smile at camera",
          date: "2025-01-15",
          mediaUris: ["partial.jpg"],
        },
      });

      const { getByPlaceholderText, getAllByText } = render(
        <TestWrapper>
          <SearchScreen />
        </TestWrapper>,
      );

      const searchInput = getByPlaceholderText("Search memories...");
      fireEvent.changeText(searchInput, "smile");

      await waitFor(() => {
        const results = getAllByText(/smile/i);
        // Exact match "smile" should come before "smile at camera"
        expect(results[0].props.children).toBe("smile");
      });
    });
  });
});
