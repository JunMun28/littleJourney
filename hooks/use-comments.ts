/**
 * TanStack Query hooks for comment and reaction operations
 *
 * PRD ref: SHARE-006 (Comment + React permission), SHARE-010 (Delete family member comments)
 *
 * These hooks wrap the commentApi and provide:
 * - Automatic caching and cache invalidation
 * - Loading and error states
 * - Per-entry comment/reaction queries
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  commentApi,
  isApiError,
  Comment,
  Reaction,
  CreateCommentRequest,
  AddReactionRequest,
} from "@/services/api-client";

// Query keys for cache management
export const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (entryId: string) => [...commentKeys.lists(), entryId] as const,
};

export const reactionKeys = {
  all: ["reactions"] as const,
  lists: () => [...reactionKeys.all, "list"] as const,
  list: (entryId: string) => [...reactionKeys.lists(), entryId] as const,
};

/**
 * Fetch comments for a specific entry
 */
export function useComments(entryId: string) {
  return useQuery({
    queryKey: commentKeys.list(entryId),
    queryFn: async () => {
      const result = await commentApi.getComments(entryId);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!entryId,
  });
}

/**
 * Create a new comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateCommentRequest): Promise<Comment> => {
      const result = await commentApi.createComment(request);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate comments list for this entry
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(data.entryId),
      });
    },
  });
}

/**
 * Delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
    }: {
      commentId: string;
      entryId: string;
    }): Promise<{ success: boolean }> => {
      const result = await commentApi.deleteComment(commentId);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (_, { entryId }) => {
      // Invalidate comments list for this entry
      queryClient.invalidateQueries({ queryKey: commentKeys.list(entryId) });
    },
  });
}

/**
 * Fetch reactions for a specific entry
 */
export function useReactions(entryId: string) {
  return useQuery({
    queryKey: reactionKeys.list(entryId),
    queryFn: async () => {
      const result = await commentApi.getReactions(entryId);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!entryId,
  });
}

/**
 * Add a reaction to an entry
 */
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AddReactionRequest): Promise<Reaction> => {
      const result = await commentApi.addReaction(request);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate reactions list for this entry
      queryClient.invalidateQueries({
        queryKey: reactionKeys.list(data.entryId),
      });
    },
  });
}

/**
 * Remove a reaction from an entry
 */
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reactionId,
    }: {
      reactionId: string;
      entryId: string;
    }): Promise<{ success: boolean }> => {
      const result = await commentApi.removeReaction(reactionId);
      if (isApiError(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (_, { entryId }) => {
      // Invalidate reactions list for this entry
      queryClient.invalidateQueries({ queryKey: reactionKeys.list(entryId) });
    },
  });
}
