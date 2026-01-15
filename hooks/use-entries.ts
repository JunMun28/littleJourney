/**
 * TanStack Query hooks for entry operations
 *
 * These hooks wrap the entryApi and provide:
 * - Automatic caching and cache invalidation
 * - Loading and error states
 * - Optimistic updates (future)
 */

import { useMemo, useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { entryApi, isApiError, GetEntriesParams } from "@/services/api-client";
import { Entry, NewEntry } from "@/contexts/entry-context";

// Query keys for cache management
export const entryKeys = {
  all: ["entries"] as const,
  lists: () => [...entryKeys.all, "list"] as const,
  list: (params?: GetEntriesParams) =>
    [...entryKeys.lists(), params ?? {}] as const,
  details: () => [...entryKeys.all, "detail"] as const,
  detail: (id: string) => [...entryKeys.details(), id] as const,
};

/**
 * Fetch paginated entries list
 */
export function useEntries(params?: GetEntriesParams) {
  return useQuery({
    queryKey: entryKeys.list(params),
    queryFn: async () => {
      const result = await entryApi.getEntries(params);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
}

/**
 * Fetch single entry by ID
 */
export function useEntry(id: string | undefined) {
  return useQuery({
    queryKey: entryKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("Entry ID required");
      const result = await entryApi.getEntry(id);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Create a new entry
 */
export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: NewEntry): Promise<Entry> => {
      const result = await entryApi.createEntry({ entry });
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate entries list to trigger refetch
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

/**
 * Update an existing entry
 */
export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<NewEntry>;
    }): Promise<Entry> => {
      const result = await entryApi.updateEntry({ id, updates });
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Update cache for this specific entry
      queryClient.setQueryData(entryKeys.detail(data.id), data);
      // Invalidate lists to reflect change
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

/**
 * Delete an entry
 */
export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const result = await entryApi.deleteEntry(id);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: entryKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

/**
 * High-level hook for Feed screen that provides:
 * - Flat entries array (not paginated)
 * - getOnThisDayEntries helper
 * - Loading/error states
 * - Refetch capability
 *
 * This is a convenience wrapper to replace EntryContext usage
 */
export function useEntriesFlat(params?: GetEntriesParams) {
  const query = useEntries(params);

  // Flatten paginated data to simple array
  const entries = useMemo(() => {
    return query.data?.items ?? [];
  }, [query.data?.items]);

  // Get entries from same day in previous years (PRD Section 4.5)
  const getOnThisDayEntries = useCallback((): Entry[] => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const todayYear = today.getFullYear();

    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === todayMonth &&
        entryDate.getDate() === todayDay &&
        entryDate.getFullYear() < todayYear
      );
    });
  }, [entries]);

  return {
    entries,
    getOnThisDayEntries,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * Infinite scroll hook for Feed screen with pagination support
 *
 * This hook uses TanStack Query's useInfiniteQuery to:
 * - Load entries in pages
 * - Automatically fetch next page on demand
 * - Flatten all pages into single entries array
 * - Support "On This Day" across all loaded entries
 *
 * PRD Section 4.1: Infinite scroll with pagination
 */
export function useInfiniteEntries(params?: { limit?: number }) {
  const limit = params?.limit ?? 20;

  const query = useInfiniteQuery({
    queryKey: entryKeys.list({ limit }),
    queryFn: async ({ pageParam }) => {
      const result = await entryApi.getEntries({
        limit,
        cursor: pageParam as string | undefined,
      });
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.cursor : undefined,
  });

  // Flatten all pages into single entries array
  const entries = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.items) ?? [];
  }, [query.data?.pages]);

  // Get entries from same day in previous years (PRD Section 4.5)
  const getOnThisDayEntries = useCallback((): Entry[] => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const todayYear = today.getFullYear();

    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === todayMonth &&
        entryDate.getDate() === todayDay &&
        entryDate.getFullYear() < todayYear
      );
    });
  }, [entries]);

  return {
    entries,
    getOnThisDayEntries,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
    isFetching: query.isFetching,
    // Infinite scroll specific
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
