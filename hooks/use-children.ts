/**
 * TanStack Query hooks for child operations
 *
 * These hooks wrap the childApi and provide:
 * - Automatic caching and cache invalidation
 * - Loading and error states
 * - Optimistic updates (future)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  childApi,
  isApiError,
  Child,
  CreateChildRequest,
  UpdateChildRequest,
} from "@/services/api-client";

// Query keys for cache management
export const childKeys = {
  all: ["children"] as const,
  list: () => [...childKeys.all, "list"] as const,
  details: () => [...childKeys.all, "detail"] as const,
  detail: (id: string) => [...childKeys.details(), id] as const,
};

/**
 * Fetch all children
 */
export function useChildren() {
  return useQuery({
    queryKey: childKeys.list(),
    queryFn: async () => {
      const result = await childApi.getChildren();
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
}

/**
 * Create a new child
 */
export function useCreateChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateChildRequest): Promise<Child> => {
      const result = await childApi.createChild(request);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate children list to trigger refetch
      queryClient.invalidateQueries({ queryKey: childKeys.list() });
    },
  });
}

/**
 * Update an existing child
 */
export function useUpdateChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateChildRequest["updates"];
    }): Promise<Child> => {
      const result = await childApi.updateChild({ id, updates });
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Update cache for this specific child
      if (data.id) {
        queryClient.setQueryData(childKeys.detail(data.id), data);
      }
      // Invalidate list to reflect change
      queryClient.invalidateQueries({ queryKey: childKeys.list() });
    },
  });
}

/**
 * Flattened hook for easy child consumption in components
 * Returns the first (primary) child, or null if no children exist
 *
 * MVP supports single child, so this returns the first child in the list
 */
export function useChildFlat() {
  const { data: children, isLoading, isError, error, refetch } = useChildren();
  const updateChildMutation = useUpdateChild();

  // MVP: single child support - return first child
  const child = children?.[0] ?? null;

  const updateChild = (updates: UpdateChildRequest["updates"]) => {
    if (child?.id) {
      updateChildMutation.mutate({ id: child.id, updates });
    }
  };

  return {
    child,
    isLoading,
    isError,
    error,
    refetch,
    updateChild,
    isUpdating: updateChildMutation.isPending,
  };
}
