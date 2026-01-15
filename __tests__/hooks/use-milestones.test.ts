import { renderHook, waitFor, act } from "@testing-library/react-native";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clearAllMockData, milestoneApi } from "@/services/api-client";
import {
  useMilestones,
  useCreateMilestone,
  useCompleteMilestone,
  useDeleteMilestone,
} from "@/hooks/use-milestones";

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

describe("useMilestones hooks", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  describe("useMilestones", () => {
    it("should return empty array when no milestones exist", async () => {
      const { result } = renderHook(() => useMilestones(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should return milestones after creating some", async () => {
      await milestoneApi.createMilestone({
        childId: "child_123",
        templateId: "full_month",
        milestoneDate: "2024-02-15",
      });

      const { result } = renderHook(() => useMilestones(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].templateId).toBe("full_month");
    });
  });

  describe("useCreateMilestone", () => {
    it("should create milestone from template", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateMilestone(), { wrapper });

      await act(async () => {
        result.current.mutate({
          childId: "child_456",
          templateId: "hundred_days",
          milestoneDate: "2024-04-25",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.templateId).toBe("hundred_days");
      expect(result.current.data?.isCompleted).toBe(false);
      expect(result.current.data?.id).toBeDefined();
    });

    it("should create custom milestone", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateMilestone(), { wrapper });

      await act(async () => {
        result.current.mutate({
          childId: "child_789",
          customTitle: "First Word",
          customDescription: "Said 'mama'",
          milestoneDate: "2024-06-01",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.customTitle).toBe("First Word");
      expect(result.current.data?.customDescription).toBe("Said 'mama'");
    });
  });

  describe("useCompleteMilestone", () => {
    it("should complete milestone with celebration date", async () => {
      const createResult = await milestoneApi.createMilestone({
        childId: "child_abc",
        templateId: "first_smile",
        milestoneDate: "2024-03-01",
      });

      if ("error" in createResult)
        throw new Error("Failed to create milestone");
      const milestoneId = createResult.data.id;

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCompleteMilestone(), { wrapper });

      await act(async () => {
        result.current.mutate({
          id: milestoneId,
          celebrationDate: "2024-03-02",
          notes: "Such a beautiful smile!",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.isCompleted).toBe(true);
      expect(result.current.data?.celebrationDate).toBe("2024-03-02");
      expect(result.current.data?.notes).toBe("Such a beautiful smile!");
    });
  });

  describe("useDeleteMilestone", () => {
    it("should delete milestone successfully", async () => {
      const createResult = await milestoneApi.createMilestone({
        childId: "child_def",
        templateId: "zhua_zhou",
        milestoneDate: "2025-01-15",
      });

      if ("error" in createResult)
        throw new Error("Failed to create milestone");
      const milestoneId = createResult.data.id;

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteMilestone(), { wrapper });

      await act(async () => {
        result.current.mutate(milestoneId);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.success).toBe(true);

      // Verify deletion
      const getResult = await milestoneApi.getMilestones();
      if ("error" in getResult) throw new Error("Failed to get milestones");
      expect(getResult.data.length).toBe(0);
    });
  });
});
