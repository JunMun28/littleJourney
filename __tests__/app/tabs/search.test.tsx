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
});
