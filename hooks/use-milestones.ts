/**
 * TanStack Query hooks for milestone operations
 *
 * These hooks wrap the milestoneApi and provide:
 * - Automatic caching and cache invalidation
 * - Loading and error states
 * - Optimistic updates (future)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  milestoneApi,
  isApiError,
  CreateMilestoneRequest,
  CompleteMilestoneRequest,
} from "@/services/api-client";
import { Milestone } from "@/contexts/milestone-context";

// Query keys for cache management
export const milestoneKeys = {
  all: ["milestones"] as const,
  list: () => [...milestoneKeys.all, "list"] as const,
  details: () => [...milestoneKeys.all, "detail"] as const,
  detail: (id: string) => [...milestoneKeys.details(), id] as const,
};

/**
 * Fetch all milestones
 */
export function useMilestones() {
  return useQuery({
    queryKey: milestoneKeys.list(),
    queryFn: async () => {
      const result = await milestoneApi.getMilestones();
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
}

/**
 * Create a new milestone
 */
export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateMilestoneRequest): Promise<Milestone> => {
      const result = await milestoneApi.createMilestone(request);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate milestones list to trigger refetch
      queryClient.invalidateQueries({ queryKey: milestoneKeys.list() });
    },
  });
}

/**
 * Complete a milestone
 */
export function useCompleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      request: CompleteMilestoneRequest,
    ): Promise<Milestone> => {
      const result = await milestoneApi.completeMilestone(request);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Update cache for this specific milestone
      queryClient.setQueryData(milestoneKeys.detail(data.id), data);
      // Invalidate list to reflect change
      queryClient.invalidateQueries({ queryKey: milestoneKeys.list() });
    },
  });
}

/**
 * Delete a milestone
 */
export function useDeleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const result = await milestoneApi.deleteMilestone(id);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: milestoneKeys.detail(id) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: milestoneKeys.list() });
    },
  });
}
