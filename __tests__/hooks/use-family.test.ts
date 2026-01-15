import { renderHook, waitFor, act } from "@testing-library/react-native";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clearAllMockData, familyApi } from "@/services/api-client";
import {
  useFamilyMembers,
  useInviteFamilyMember,
  useRemoveFamilyMember,
} from "@/hooks/use-family";

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

describe("useFamily hooks", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  describe("useFamilyMembers", () => {
    it("should return empty array when no family members exist", async () => {
      const { result } = renderHook(() => useFamilyMembers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should return family members after inviting some", async () => {
      await familyApi.inviteFamilyMember({
        email: "grandma@example.com",
        relationship: "Grandmother",
        permissionLevel: "view_interact",
      });

      const { result } = renderHook(() => useFamilyMembers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].email).toBe("grandma@example.com");
    });
  });

  describe("useInviteFamilyMember", () => {
    it("should invite family member and return it", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useInviteFamilyMember(), { wrapper });

      await act(async () => {
        result.current.mutate({
          email: "uncle@example.com",
          relationship: "Uncle",
          permissionLevel: "view_only",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.email).toBe("uncle@example.com");
      expect(result.current.data?.relationship).toBe("Uncle");
      expect(result.current.data?.status).toBe("pending");
      expect(result.current.data?.id).toBeDefined();
    });
  });

  describe("useRemoveFamilyMember", () => {
    it("should remove family member successfully", async () => {
      const inviteResult = await familyApi.inviteFamilyMember({
        email: "aunt@example.com",
        relationship: "Aunt",
        permissionLevel: "view_interact",
      });

      if ("error" in inviteResult) throw new Error("Failed to invite member");
      const memberId = inviteResult.data.id;

      const wrapper = createWrapper();
      const { result } = renderHook(() => useRemoveFamilyMember(), { wrapper });

      await act(async () => {
        result.current.mutate(memberId);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.success).toBe(true);

      // Verify removal
      const getResult = await familyApi.getFamilyMembers();
      if ("error" in getResult) throw new Error("Failed to get members");
      expect(getResult.data.length).toBe(0);
    });
  });
});
