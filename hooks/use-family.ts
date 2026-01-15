/**
 * TanStack Query hooks for family operations
 *
 * These hooks wrap the familyApi and provide:
 * - Automatic caching and cache invalidation
 * - Loading and error states
 * - Optimistic updates (future)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  familyApi,
  isApiError,
  InviteFamilyRequest,
} from "@/services/api-client";
import { FamilyMember } from "@/contexts/family-context";

// Query keys for cache management
export const familyKeys = {
  all: ["family"] as const,
  list: () => [...familyKeys.all, "list"] as const,
  details: () => [...familyKeys.all, "detail"] as const,
  detail: (id: string) => [...familyKeys.details(), id] as const,
};

/**
 * Fetch all family members
 */
export function useFamilyMembers() {
  return useQuery({
    queryKey: familyKeys.list(),
    queryFn: async () => {
      const result = await familyApi.getFamilyMembers();
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
}

/**
 * Invite a new family member
 */
export function useInviteFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: InviteFamilyRequest): Promise<FamilyMember> => {
      const result = await familyApi.inviteFamilyMember(request);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate family members list to trigger refetch
      queryClient.invalidateQueries({ queryKey: familyKeys.list() });
    },
  });
}

/**
 * Remove a family member
 */
export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const result = await familyApi.removeFamilyMember(id);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: familyKeys.detail(id) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: familyKeys.list() });
    },
  });
}
