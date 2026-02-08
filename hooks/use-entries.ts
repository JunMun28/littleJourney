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
 * Create a new entry with optimistic updates
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
    onMutate: async (newEntry) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: entryKeys.lists() });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueriesData({
        queryKey: entryKeys.lists(),
      });

      // Create optimistic entry with temporary ID
      const optimisticEntry: Entry = {
        id: `temp_${Date.now()}`,
        ...newEntry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update all entry list caches
      queryClient.setQueriesData(
        { queryKey: entryKeys.lists() },
        (old: unknown) => {
          if (!old) return old;

          // Handle infinite query data structure
          if (typeof old === "object" && "pages" in (old as object)) {
            const infiniteData = old as {
              pages: Array<{
                items: Entry[];
                hasMore: boolean;
                cursor?: string;
              }>;
            };
            return {
              ...infiniteData,
              pages: infiniteData.pages.map((page, index) =>
                index === 0
                  ? { ...page, items: [optimisticEntry, ...page.items] }
                  : page,
              ),
            };
          }

          // Handle regular query data structure
          const regularData = old as {
            items: Entry[];
            hasMore: boolean;
            cursor?: string;
          };
          return {
            ...regularData,
            items: [optimisticEntry, ...regularData.items],
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _newEntry, context) => {
      // Rollback to previous state on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

/**
 * Update an existing entry with optimistic updates
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
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: entryKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: entryKeys.lists() });

      // Snapshot previous values
      const previousEntry = queryClient.getQueryData(entryKeys.detail(id));
      const previousLists = queryClient.getQueriesData({
        queryKey: entryKeys.lists(),
      });

      // Optimistically update the entry detail cache
      if (previousEntry) {
        queryClient.setQueryData(entryKeys.detail(id), {
          ...(previousEntry as Entry),
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }

      // Optimistically update entry in list caches
      queryClient.setQueriesData(
        { queryKey: entryKeys.lists() },
        (old: unknown) => {
          if (!old) return old;

          const updateEntryInItems = (items: Entry[]) =>
            items.map((entry) =>
              entry.id === id
                ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
                : entry,
            );

          // Handle infinite query data structure
          if (typeof old === "object" && "pages" in (old as object)) {
            const infiniteData = old as {
              pages: Array<{
                items: Entry[];
                hasMore: boolean;
                cursor?: string;
              }>;
            };
            return {
              ...infiniteData,
              pages: infiniteData.pages.map((page) => ({
                ...page,
                items: updateEntryInItems(page.items),
              })),
            };
          }

          // Handle regular query data structure
          const regularData = old as {
            items: Entry[];
            hasMore: boolean;
            cursor?: string;
          };
          return {
            ...regularData,
            items: updateEntryInItems(regularData.items),
          };
        },
      );

      return { previousEntry, previousLists };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousEntry) {
        queryClient.setQueryData(entryKeys.detail(id), context.previousEntry);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data) => {
      if (data) {
        queryClient.setQueryData(entryKeys.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

/**
 * Delete an entry with optimistic updates
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
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: entryKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: entryKeys.lists() });

      // Snapshot previous values
      const previousEntry = queryClient.getQueryData(entryKeys.detail(id));
      const previousLists = queryClient.getQueriesData({
        queryKey: entryKeys.lists(),
      });

      // Optimistically remove entry from lists
      queryClient.setQueriesData(
        { queryKey: entryKeys.lists() },
        (old: unknown) => {
          if (!old) return old;

          const removeEntryFromItems = (items: Entry[]) =>
            items.filter((entry) => entry.id !== id);

          // Handle infinite query data structure
          if (typeof old === "object" && "pages" in (old as object)) {
            const infiniteData = old as {
              pages: Array<{
                items: Entry[];
                hasMore: boolean;
                cursor?: string;
              }>;
            };
            return {
              ...infiniteData,
              pages: infiniteData.pages.map((page) => ({
                ...page,
                items: removeEntryFromItems(page.items),
              })),
            };
          }

          // Handle regular query data structure
          const regularData = old as {
            items: Entry[];
            hasMore: boolean;
            cursor?: string;
          };
          return {
            ...regularData,
            items: removeEntryFromItems(regularData.items),
          };
        },
      );

      // Remove detail cache
      queryClient.removeQueries({ queryKey: entryKeys.detail(id) });

      return { previousEntry, previousLists };
    },
    onError: (_err, id, context) => {
      // Rollback on error
      if (context?.previousEntry) {
        queryClient.setQueryData(entryKeys.detail(id), context.previousEntry);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, _err, id) => {
      queryClient.removeQueries({ queryKey: entryKeys.detail(id) });
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
