import { renderHook, waitFor, act } from "@testing-library/react-native";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clearAllMockData, childApi } from "@/services/api-client";
import {
  useChildren,
  useCreateChild,
  useUpdateChild,
  useChildFlat,
} from "@/hooks/use-children";

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

describe("useChildren hooks", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  describe("useChildren", () => {
    it("should return empty array when no children exist", async () => {
      const { result } = renderHook(() => useChildren(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should return children after creating some", async () => {
      await childApi.createChild({
        name: "Emma",
        dateOfBirth: "2024-01-15",
      });

      const { result } = renderHook(() => useChildren(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].name).toBe("Emma");
    });
  });

  describe("useCreateChild", () => {
    it("should create child and return it", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateChild(), { wrapper });

      await act(async () => {
        result.current.mutate({
          name: "Oliver",
          dateOfBirth: "2024-03-20",
          nickname: "Ollie",
          culturalTradition: "chinese",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.name).toBe("Oliver");
      expect(result.current.data?.nickname).toBe("Ollie");
      expect(result.current.data?.id).toBeDefined();
    });
  });

  describe("useUpdateChild", () => {
    it("should update child fields", async () => {
      const createResult = await childApi.createChild({
        name: "Sophia",
        dateOfBirth: "2024-02-01",
      });

      if ("error" in createResult) throw new Error("Failed to create child");
      const childId = createResult.data.id!;

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateChild(), { wrapper });

      await act(async () => {
        result.current.mutate({
          id: childId,
          updates: { nickname: "Sophie" },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.nickname).toBe("Sophie");
    });
  });

  describe("useChildFlat", () => {
    it("should return null child when no children exist", async () => {
      const { result } = renderHook(() => useChildFlat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.child).toBeNull();
    });

    it("should return first child when children exist", async () => {
      await childApi.createChild({
        name: "Emma",
        dateOfBirth: "2024-01-15",
        culturalTradition: "chinese",
      });

      const { result } = renderHook(() => useChildFlat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.child).not.toBeNull();
      });

      expect(result.current.child?.name).toBe("Emma");
      expect(result.current.child?.culturalTradition).toBe("chinese");
    });

    it("should provide updateChild function", async () => {
      await childApi.createChild({
        name: "Oliver",
        dateOfBirth: "2024-03-20",
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useChildFlat(), { wrapper });

      await waitFor(() => {
        expect(result.current.child).not.toBeNull();
      });

      expect(result.current.updateChild).toBeDefined();
    });
  });
});
