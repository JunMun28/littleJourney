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
});
