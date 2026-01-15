import { renderHook, waitFor, act } from "@testing-library/react-native";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clearAllMockData, entryApi } from "@/services/api-client";
import {
  useEntries,
  useEntry,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  useEntriesFlat,
  useInfiniteEntries,
} from "@/hooks/use-entries";

// Create wrapper with fresh QueryClient for each test
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useEntries hook", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  describe("useEntries", () => {
    it("should return empty array when no entries exist", async () => {
      const { result } = renderHook(() => useEntries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.items).toEqual([]);
    });

    it("should return entries after creating some", async () => {
      // Create an entry first
      await entryApi.createEntry({
        entry: {
          type: "photo",
          date: "2024-01-15",
          caption: "Test entry",
          mediaUris: ["file://test.jpg"],
        },
      });

      const { result } = renderHook(() => useEntries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.items.length).toBe(1);
      expect(result.current.data?.items[0].caption).toBe("Test entry");
    });
  });

  describe("useEntry", () => {
    it("should return single entry by ID", async () => {
      const createResult = await entryApi.createEntry({
        entry: {
          type: "text",
          date: "2024-02-01",
          caption: "Single entry test",
        },
      });

      if ("error" in createResult) throw new Error("Failed to create entry");
      const entryId = createResult.data.id;

      const { result } = renderHook(() => useEntry(entryId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.caption).toBe("Single entry test");
    });

    it("should not fetch when ID is undefined", async () => {
      const { result } = renderHook(() => useEntry(undefined), {
        wrapper: createWrapper(),
      });

      // Should not be loading and not fetched
      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useCreateEntry", () => {
    it("should create entry and return it", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateEntry(), { wrapper });

      await act(async () => {
        result.current.mutate({
          type: "photo",
          date: "2024-03-15",
          caption: "Created via hook",
          mediaUris: ["file://photo.jpg"],
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.caption).toBe("Created via hook");
      expect(result.current.data?.id).toBeDefined();
    });
  });

  describe("useUpdateEntry", () => {
    it("should update entry caption", async () => {
      const createResult = await entryApi.createEntry({
        entry: {
          type: "text",
          date: "2024-04-01",
          caption: "Original caption",
        },
      });

      if ("error" in createResult) throw new Error("Failed to create entry");
      const entryId = createResult.data.id;

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateEntry(), { wrapper });

      await act(async () => {
        result.current.mutate({
          id: entryId,
          updates: { caption: "Updated caption" },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.caption).toBe("Updated caption");
    });
  });

  describe("useDeleteEntry", () => {
    it("should delete entry successfully", async () => {
      const createResult = await entryApi.createEntry({
        entry: {
          type: "text",
          date: "2024-05-01",
          caption: "To be deleted",
        },
      });

      if ("error" in createResult) throw new Error("Failed to create entry");
      const entryId = createResult.data.id;

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteEntry(), { wrapper });

      await act(async () => {
        result.current.mutate(entryId);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.success).toBe(true);

      // Verify deletion
      const getResult = await entryApi.getEntry(entryId);
      expect("error" in getResult).toBe(true);
    });
  });

  describe("useEntriesFlat", () => {
    it("should return flat entries array", async () => {
      // Create entries
      await entryApi.createEntry({
        entry: { type: "photo", date: "2024-01-15", caption: "Entry 1" },
      });
      await entryApi.createEntry({
        entry: { type: "text", date: "2024-01-16", caption: "Entry 2" },
      });

      const { result } = renderHook(() => useEntriesFlat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.entries).toHaveLength(2);
      expect(result.current.entries[0].caption).toBe("Entry 2"); // newest first
    });

    it("should return empty array when loading", () => {
      const { result } = renderHook(() => useEntriesFlat(), {
        wrapper: createWrapper(),
      });

      // While loading, entries should be empty array
      expect(result.current.entries).toEqual([]);
    });

    it("should provide getOnThisDayEntries that filters by month/day from previous years", async () => {
      const today = new Date();
      const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
      const todayDay = String(today.getDate()).padStart(2, "0");
      const lastYear = today.getFullYear() - 1;
      const twoYearsAgo = today.getFullYear() - 2;

      // Create entry from last year same day
      await entryApi.createEntry({
        entry: {
          type: "photo",
          date: `${lastYear}-${todayMonth}-${todayDay}`,
          caption: "Last year same day",
        },
      });

      // Create entry from 2 years ago same day
      await entryApi.createEntry({
        entry: {
          type: "text",
          date: `${twoYearsAgo}-${todayMonth}-${todayDay}`,
          caption: "Two years ago same day",
        },
      });

      // Create entry from this year (should not appear)
      await entryApi.createEntry({
        entry: {
          type: "photo",
          date: `${today.getFullYear()}-${todayMonth}-${todayDay}`,
          caption: "This year",
        },
      });

      // Create entry from different day (should not appear)
      const differentDay = todayDay === "15" ? "14" : "15";
      await entryApi.createEntry({
        entry: {
          type: "text",
          date: `${lastYear}-${todayMonth}-${differentDay}`,
          caption: "Different day",
        },
      });

      const { result } = renderHook(() => useEntriesFlat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const onThisDay = result.current.getOnThisDayEntries();
      expect(onThisDay).toHaveLength(2);
      expect(onThisDay.some((e) => e.caption === "Last year same day")).toBe(
        true,
      );
      expect(
        onThisDay.some((e) => e.caption === "Two years ago same day"),
      ).toBe(true);
    });
  });

  describe("useInfiniteEntries", () => {
    it("should load first page of entries", async () => {
      // Create entries
      await entryApi.createEntry({
        entry: { type: "photo", date: "2024-01-15", caption: "Entry 1" },
      });
      await entryApi.createEntry({
        entry: { type: "text", date: "2024-01-16", caption: "Entry 2" },
      });

      const { result } = renderHook(() => useInfiniteEntries({ limit: 10 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.entries).toHaveLength(2);
      expect(result.current.hasNextPage).toBe(false);
    });

    it("should support fetchNextPage for pagination", async () => {
      // Create 5 entries
      for (let i = 1; i <= 5; i++) {
        await entryApi.createEntry({
          entry: {
            type: "text",
            date: `2024-01-${String(i).padStart(2, "0")}`,
            caption: `Entry ${i}`,
          },
        });
      }

      const { result } = renderHook(() => useInfiniteEntries({ limit: 2 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // First page: 2 entries
      expect(result.current.entries).toHaveLength(2);
      expect(result.current.hasNextPage).toBe(true);

      // Fetch next page
      await act(async () => {
        await result.current.fetchNextPage();
      });

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(4);
      });

      // Fetch final page
      await act(async () => {
        await result.current.fetchNextPage();
      });

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(5);
      });

      expect(result.current.hasNextPage).toBe(false);
    });

    it("should provide isFetchingNextPage state", async () => {
      await entryApi.createEntry({
        entry: { type: "photo", date: "2024-01-15", caption: "Entry 1" },
      });

      const { result } = renderHook(() => useInfiniteEntries({ limit: 10 }), {
        wrapper: createWrapper(),
      });

      // Initially not fetching next page
      expect(result.current.isFetchingNextPage).toBe(false);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should provide getOnThisDayEntries that works across all pages", async () => {
      const today = new Date();
      const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
      const todayDay = String(today.getDate()).padStart(2, "0");
      const lastYear = today.getFullYear() - 1;

      // Create memory from last year
      await entryApi.createEntry({
        entry: {
          type: "photo",
          date: `${lastYear}-${todayMonth}-${todayDay}`,
          caption: "Memory from last year",
        },
      });

      const { result } = renderHook(() => useInfiniteEntries({ limit: 10 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const memories = result.current.getOnThisDayEntries();
      expect(memories).toHaveLength(1);
      expect(memories[0].caption).toBe("Memory from last year");
    });
  });
});
