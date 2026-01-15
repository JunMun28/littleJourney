import {
  calculateRelevanceScore,
  sortByRelevance,
} from "@/utils/search-relevance";
import type { Entry } from "@/contexts/entry-context";

// Helper to create a minimal entry for testing
function createTestEntry(id: string, caption: string, tags?: string[]): Entry {
  const now = new Date().toISOString();
  return {
    id,
    type: "photo",
    caption,
    date: "2025-01-15",
    createdAt: now,
    updatedAt: now,
    createdBy: "user1",
    mediaUris: ["test.jpg"],
    tags,
  };
}

describe("calculateRelevanceScore", () => {
  describe("caption matching", () => {
    it("returns higher score for exact caption match", () => {
      const entry = createTestEntry("1", "beach day");
      const score = calculateRelevanceScore(entry, "beach day");
      expect(score).toBeGreaterThan(0);
    });

    it("returns higher score for match at start of caption", () => {
      const entry = createTestEntry("1", "beach fun with family");
      const scoreStart = calculateRelevanceScore(entry, "beach");

      const entry2 = createTestEntry("2", "fun at the beach");
      const scoreMiddle = calculateRelevanceScore(entry2, "beach");

      expect(scoreStart).toBeGreaterThan(scoreMiddle);
    });

    it("returns higher score for match at start of word", () => {
      const entry = createTestEntry("1", "going to the beach today");
      const scoreWordStart = calculateRelevanceScore(entry, "beach");

      const entry2 = createTestEntry("2", "sunbeach resort photo");
      const scoreWithin = calculateRelevanceScore(entry2, "beach");

      expect(scoreWordStart).toBeGreaterThan(scoreWithin);
    });

    it("is case insensitive", () => {
      const entry = createTestEntry("1", "BEACH DAY");
      const score = calculateRelevanceScore(entry, "beach");
      expect(score).toBeGreaterThan(0);
    });

    it("returns 0 for no match", () => {
      const entry = createTestEntry("1", "park day");
      const score = calculateRelevanceScore(entry, "beach");
      expect(score).toBe(0);
    });
  });

  describe("tag matching", () => {
    it("returns score for tag match", () => {
      const entry = createTestEntry("1", "photo", ["beach", "summer"]);
      const score = calculateRelevanceScore(entry, "beach");
      expect(score).toBeGreaterThan(0);
    });

    it("returns higher score for caption match than tag match", () => {
      const entryCaption = createTestEntry("1", "beach day", []);
      const entryTag = createTestEntry("2", "photo", ["beach"]);

      const scoreCaption = calculateRelevanceScore(entryCaption, "beach");
      const scoreTag = calculateRelevanceScore(entryTag, "beach");

      expect(scoreCaption).toBeGreaterThan(scoreTag);
    });

    it("returns score for partial tag match", () => {
      const entry = createTestEntry("1", "photo", ["beachfront"]);
      const score = calculateRelevanceScore(entry, "beach");
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("combined scoring", () => {
    it("adds scores from multiple matches", () => {
      const entryBoth = createTestEntry("1", "beach day", ["beach"]);
      const entryCaption = createTestEntry("2", "beach day", []);

      const scoreBoth = calculateRelevanceScore(entryBoth, "beach");
      const scoreCaption = calculateRelevanceScore(entryCaption, "beach");

      expect(scoreBoth).toBeGreaterThan(scoreCaption);
    });

    it("handles multiple word queries", () => {
      const entry = createTestEntry("1", "beach day with family");
      const score = calculateRelevanceScore(entry, "beach day");
      expect(score).toBeGreaterThan(0);
    });
  });
});

describe("sortByRelevance", () => {
  it("sorts entries by relevance score descending", () => {
    const entries = [
      createTestEntry("1", "fun at the beach", []), // "beach" in middle
      createTestEntry("2", "beach day party", []), // "beach" at start
      createTestEntry("3", "sunny park day", ["beach"]), // "beach" only in tag
    ];

    const sorted = sortByRelevance(entries, "beach");

    expect(sorted[0].id).toBe("2"); // "beach" at start of caption
    expect(sorted[1].id).toBe("1"); // "beach" in middle of caption
    expect(sorted[2].id).toBe("3"); // "beach" only in tag
  });

  it("filters out entries with zero relevance", () => {
    const entries = [
      createTestEntry("1", "beach day", []),
      createTestEntry("2", "park day", []),
      createTestEntry("3", "beach fun", []),
    ];

    const sorted = sortByRelevance(entries, "beach");

    expect(sorted).toHaveLength(2);
    expect(sorted.find((e) => e.id === "2")).toBeUndefined();
  });

  it("maintains stability for equal scores", () => {
    const entries = [
      createTestEntry("1", "beach photo", []),
      createTestEntry("2", "beach photo", []),
    ];

    const sorted = sortByRelevance(entries, "beach");

    // Should maintain original order for equal scores
    expect(sorted[0].id).toBe("1");
    expect(sorted[1].id).toBe("2");
  });

  it("handles empty query by returning empty array", () => {
    const entries = [createTestEntry("1", "beach day", [])];

    const sorted = sortByRelevance(entries, "");
    expect(sorted).toHaveLength(0);
  });

  it("handles whitespace-only query by returning empty array", () => {
    const entries = [createTestEntry("1", "beach day", [])];

    const sorted = sortByRelevance(entries, "   ");
    expect(sorted).toHaveLength(0);
  });

  it("handles entries with undefined caption", () => {
    const entry = createTestEntry("1", "", ["beach"]);
    entry.caption = undefined;

    const sorted = sortByRelevance([entry], "beach");
    expect(sorted).toHaveLength(1);
  });

  it("handles entries with undefined tags", () => {
    const entry = createTestEntry("1", "beach day", undefined);

    const sorted = sortByRelevance([entry], "beach");
    expect(sorted).toHaveLength(1);
  });
});
