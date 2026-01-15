/**
 * TDD tests for Comment hooks
 *
 * PRD ref: SHARE-006 (Comment + React permission), SHARE-010 (Delete family member comments)
 */

import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useReactions,
  useAddReaction,
  useRemoveReaction,
} from "@/hooks/use-comments";
import { commentApi, clearAllMockData } from "@/services/api-client";

// Create wrapper with QueryClient for testing
function createWrapper(): ({ children }: { children: ReactNode }) => ReactNode {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useComments hooks", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  describe("useComments", () => {
    it("returns empty array when no comments exist", async () => {
      const { result } = renderHook(() => useComments("entry-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("returns comments for entry", async () => {
      await commentApi.createComment({
        entryId: "entry-1",
        text: "Test comment",
        authorId: "user-1",
        authorName: "User One",
      });

      const { result } = renderHook(() => useComments("entry-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(1);
      });

      expect(result.current.data![0].text).toBe("Test comment");
    });
  });

  describe("useCreateComment", () => {
    it("creates comment and invalidates query", async () => {
      const wrapper = createWrapper();
      const { result: commentsResult } = renderHook(
        () => useComments("entry-1"),
        { wrapper },
      );
      const { result: createResult } = renderHook(() => useCreateComment(), {
        wrapper,
      });

      await waitFor(() => {
        expect(commentsResult.current.isSuccess).toBe(true);
      });

      createResult.current.mutate({
        entryId: "entry-1",
        text: "New comment",
        authorId: "user-1",
        authorName: "User One",
      });

      await waitFor(() => {
        expect(commentsResult.current.data).toHaveLength(1);
      });
    });
  });

  describe("useDeleteComment", () => {
    it("deletes comment and invalidates query", async () => {
      const comment = await commentApi.createComment({
        entryId: "entry-1",
        text: "To delete",
        authorId: "user-1",
        authorName: "User One",
      });

      const wrapper = createWrapper();
      const { result: commentsResult } = renderHook(
        () => useComments("entry-1"),
        { wrapper },
      );
      const { result: deleteResult } = renderHook(() => useDeleteComment(), {
        wrapper,
      });

      await waitFor(() => {
        expect(commentsResult.current.data).toHaveLength(1);
      });

      deleteResult.current.mutate({
        commentId: comment.data!.id,
        entryId: "entry-1",
      });

      await waitFor(() => {
        expect(commentsResult.current.data).toHaveLength(0);
      });
    });
  });

  describe("useReactions", () => {
    it("returns empty array when no reactions exist", async () => {
      const { result } = renderHook(() => useReactions("entry-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("returns reactions for entry", async () => {
      await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "User One",
      });

      const { result } = renderHook(() => useReactions("entry-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(1);
      });

      expect(result.current.data![0].emoji).toBe("❤️");
    });
  });

  describe("useAddReaction", () => {
    it("adds reaction and invalidates query", async () => {
      const wrapper = createWrapper();
      const { result: reactionsResult } = renderHook(
        () => useReactions("entry-1"),
        { wrapper },
      );
      const { result: addResult } = renderHook(() => useAddReaction(), {
        wrapper,
      });

      await waitFor(() => {
        expect(reactionsResult.current.isSuccess).toBe(true);
      });

      addResult.current.mutate({
        entryId: "entry-1",
        emoji: "😍",
        userId: "user-1",
        userName: "User One",
      });

      await waitFor(() => {
        expect(reactionsResult.current.data).toHaveLength(1);
      });
    });
  });

  describe("useRemoveReaction", () => {
    it("removes reaction and invalidates query", async () => {
      const reaction = await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "User One",
      });

      const wrapper = createWrapper();
      const { result: reactionsResult } = renderHook(
        () => useReactions("entry-1"),
        { wrapper },
      );
      const { result: removeResult } = renderHook(() => useRemoveReaction(), {
        wrapper,
      });

      await waitFor(() => {
        expect(reactionsResult.current.data).toHaveLength(1);
      });

      removeResult.current.mutate({
        reactionId: reaction.data!.id,
        entryId: "entry-1",
      });

      await waitFor(() => {
        expect(reactionsResult.current.data).toHaveLength(0);
      });
    });
  });
});
