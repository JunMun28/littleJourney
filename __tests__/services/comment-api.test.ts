/**
 * TDD tests for Comment API
 *
 * PRD ref: SHARE-006 (Comment + React permission), SHARE-010 (Delete family member comments)
 */

import { commentApi, clearAllMockData } from "@/services/api-client";

describe("commentApi", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  describe("getComments", () => {
    it("returns empty array when no comments exist", async () => {
      const result = await commentApi.getComments("entry-1");

      expect(result).toEqual({ data: [] });
    });

    it("returns comments for specific entry", async () => {
      // Create comments for two different entries
      await commentApi.createComment({
        entryId: "entry-1",
        text: "Comment on entry 1",
        authorId: "user-1",
        authorName: "User One",
      });
      await commentApi.createComment({
        entryId: "entry-2",
        text: "Comment on entry 2",
        authorId: "user-1",
        authorName: "User One",
      });

      const result = await commentApi.getComments("entry-1");

      expect(result.data).toHaveLength(1);
      expect(result.data![0].text).toBe("Comment on entry 1");
    });
  });

  describe("createComment", () => {
    it("creates a comment with generated id and timestamps", async () => {
      const result = await commentApi.createComment({
        entryId: "entry-1",
        text: "Great photo!",
        authorId: "user-1",
        authorName: "Grandma",
      });

      expect(result.data).toMatchObject({
        entryId: "entry-1",
        text: "Great photo!",
        authorId: "user-1",
        authorName: "Grandma",
      });
      expect(result.data!.id).toMatch(/^comment_/);
      expect(result.data!.createdAt).toBeDefined();
    });

    it("adds comment to entry's comment list", async () => {
      await commentApi.createComment({
        entryId: "entry-1",
        text: "First comment",
        authorId: "user-1",
        authorName: "User One",
      });

      const result = await commentApi.getComments("entry-1");
      expect(result.data).toHaveLength(1);
    });
  });

  describe("deleteComment", () => {
    it("deletes a comment successfully", async () => {
      const createResult = await commentApi.createComment({
        entryId: "entry-1",
        text: "To be deleted",
        authorId: "user-1",
        authorName: "User One",
      });
      const commentId = createResult.data!.id;

      const result = await commentApi.deleteComment(commentId);

      expect(result.data).toEqual({ success: true });
      const comments = await commentApi.getComments("entry-1");
      expect(comments.data).toHaveLength(0);
    });

    it("returns error for non-existent comment", async () => {
      const result = await commentApi.deleteComment("non-existent");

      expect(result.error).toEqual({
        code: "NOT_FOUND",
        message: "Comment not found",
      });
    });
  });

  describe("getReactions", () => {
    it("returns empty array when no reactions exist", async () => {
      const result = await commentApi.getReactions("entry-1");

      expect(result).toEqual({ data: [] });
    });

    it("returns reactions for specific entry", async () => {
      await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "User One",
      });

      const result = await commentApi.getReactions("entry-1");

      expect(result.data).toHaveLength(1);
      expect(result.data![0].emoji).toBe("❤️");
    });
  });

  describe("addReaction", () => {
    it("adds a reaction with generated id and timestamp", async () => {
      const result = await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "Grandpa",
      });

      expect(result.data).toMatchObject({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "Grandpa",
      });
      expect(result.data!.id).toMatch(/^reaction_/);
      expect(result.data!.createdAt).toBeDefined();
    });

    it("prevents duplicate reactions from same user with same emoji", async () => {
      await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "User One",
      });

      const result = await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "User One",
      });

      expect(result.error).toEqual({
        code: "DUPLICATE",
        message: "User already reacted with this emoji",
      });
    });

    it("allows same user to add different emoji reactions", async () => {
      await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "User One",
      });

      const result = await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "😍",
        userId: "user-1",
        userName: "User One",
      });

      expect(result.data).toBeDefined();
      const reactions = await commentApi.getReactions("entry-1");
      expect(reactions.data).toHaveLength(2);
    });
  });

  describe("removeReaction", () => {
    it("removes a reaction successfully", async () => {
      const addResult = await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "User One",
      });
      const reactionId = addResult.data!.id;

      const result = await commentApi.removeReaction(reactionId);

      expect(result.data).toEqual({ success: true });
      const reactions = await commentApi.getReactions("entry-1");
      expect(reactions.data).toHaveLength(0);
    });

    it("returns error for non-existent reaction", async () => {
      const result = await commentApi.removeReaction("non-existent");

      expect(result.error).toEqual({
        code: "NOT_FOUND",
        message: "Reaction not found",
      });
    });
  });

  describe("getCommentCount", () => {
    it("returns zero when no comments exist", async () => {
      const result = await commentApi.getCommentCount("entry-1");
      expect(result.data).toBe(0);
    });

    it("returns correct count of comments", async () => {
      await commentApi.createComment({
        entryId: "entry-1",
        text: "Comment 1",
        authorId: "user-1",
        authorName: "User One",
      });
      await commentApi.createComment({
        entryId: "entry-1",
        text: "Comment 2",
        authorId: "user-2",
        authorName: "User Two",
      });

      const result = await commentApi.getCommentCount("entry-1");
      expect(result.data).toBe(2);
    });
  });

  describe("getReactionCount", () => {
    it("returns zero when no reactions exist", async () => {
      const result = await commentApi.getReactionCount("entry-1");
      expect(result.data).toBe(0);
    });

    it("returns correct count of reactions", async () => {
      await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "❤️",
        userId: "user-1",
        userName: "User One",
      });
      await commentApi.addReaction({
        entryId: "entry-1",
        emoji: "😍",
        userId: "user-2",
        userName: "User Two",
      });

      const result = await commentApi.getReactionCount("entry-1");
      expect(result.data).toBe(2);
    });
  });
});
