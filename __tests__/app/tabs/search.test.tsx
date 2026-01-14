import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SearchScreen from "@/app/(tabs)/search";
import { EntryProvider, useEntries } from "@/contexts/entry-context";

// Helper to add test entries
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <EntryProvider>{children}</EntryProvider>;
}

function SetupEntries({ onReady }: { onReady: () => void }) {
  const { addEntry } = useEntries();
  React.useEffect(() => {
    addEntry({
      type: "photo",
      caption: "Baby's first smile",
      date: "2025-01-10",
      mediaUris: ["photo1.jpg"],
      tags: ["milestone", "happy"],
    });
    addEntry({
      type: "photo",
      caption: "Playing in the park",
      date: "2025-01-12",
      mediaUris: ["photo2.jpg"],
      tags: ["outdoor"],
    });
    addEntry({
      type: "text",
      caption: "First steps today!",
      date: "2025-01-15",
      tags: ["milestone"],
    });
    onReady();
  }, [addEntry, onReady]);
  return null;
}

describe("SearchScreen", () => {
  it("renders search input", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    expect(getByPlaceholderText("Search memories...")).toBeTruthy();
  });

  it("shows empty state when no search query", () => {
    const { getByText } = render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );

    expect(getByText("Search Your Memories")).toBeTruthy();
  });

  it("filters entries by caption text", async () => {
    let ready = false;
    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <SetupEntries onReady={() => (ready = true)} />
        <SearchScreen />
      </TestWrapper>,
    );

    await waitFor(() => expect(ready).toBe(true));

    const searchInput = getByPlaceholderText("Search memories...");
    fireEvent.changeText(searchInput, "smile");

    await waitFor(() => {
      expect(getByText("Baby's first smile")).toBeTruthy();
      expect(queryByText("Playing in the park")).toBeNull();
      expect(queryByText("First steps today!")).toBeNull();
    });
  });

  it("shows no results message when search has no matches", async () => {
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
    let ready = false;
    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <SetupEntries onReady={() => (ready = true)} />
        <SearchScreen />
      </TestWrapper>,
    );

    await waitFor(() => expect(ready).toBe(true));

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
});
