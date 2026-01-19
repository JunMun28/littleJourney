import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  YearInReviewProvider,
  useYearInReview,
  MUSIC_LIBRARY,
  TRANSITION_STYLES,
  VIDEO_QUALITIES,
  MAX_HIGHLIGHTS_PER_YEAR,
  MAX_HIGHLIGHTS_PER_MONTH,
  MONTHLY_RECAP_MAX_HIGHLIGHTS,
} from "@/contexts/year-in-review-context";
import type { Entry } from "@/contexts/entry-context";
import type { Milestone } from "@/contexts/milestone-context";

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notification-id"),
}));

// Create test entries for a year
function createTestEntries(year: number, count: number): Entry[] {
  const entries: Entry[] = [];
  const now = new Date().toISOString();
  for (let i = 0; i < count; i++) {
    const month = (i % 12) + 1;
    const day = (i % 28) + 1;
    entries.push({
      id: `entry-${i}`,
      type: "photo",
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      mediaUris: [`https://example.com/photo-${i}.jpg`],
      caption: i % 3 === 0 ? `Entry caption ${i}` : undefined,
      aiLabels: i % 5 === 0 ? ["outdoors", "smiling"] : undefined,
      milestoneId: i % 10 === 0 ? `milestone-${i}` : undefined,
      createdAt: now,
      updatedAt: now,
    });
  }
  return entries;
}

// Mock entries - will be overwritten per test
let mockEntries: Entry[] = [];
let mockMilestones: Milestone[] = [];
let mockChild = {
  id: "child-1",
  name: "Test Child",
  dateOfBirth: "2023-01-15",
};

// Mock the context providers
jest.mock("@/contexts/entry-context", () => ({
  useEntries: () => ({
    entries: mockEntries,
  }),
}));

jest.mock("@/contexts/milestone-context", () => ({
  useMilestones: () => ({
    milestones: mockMilestones,
  }),
  MILESTONE_TEMPLATES: [],
}));

jest.mock("@/contexts/child-context", () => ({
  useChild: () => ({
    child: mockChild,
  }),
}));

// Test consumer component
function TestConsumer({
  onResult,
}: {
  onResult?: (ctx: ReturnType<typeof useYearInReview>) => void;
}) {
  const context = useYearInReview();
  if (onResult) {
    onResult(context);
  }
  return <Text testID="reviews-count">{context.yearInReviews.length}</Text>;
}

function renderWithProvider(entries: Entry[] = [], child = mockChild) {
  mockEntries = entries;
  mockChild = child;
  return render(
    <YearInReviewProvider>
      <TestConsumer />
    </YearInReviewProvider>,
  );
}

describe("YearInReviewContext", () => {
  beforeEach(() => {
    mockEntries = [];
    mockMilestones = [];
    mockChild = {
      id: "child-1",
      name: "Test Child",
      dateOfBirth: "2023-01-15",
    };
  });

  describe("YIR-001: Auto-generate year in review video", () => {
    it("provides initial empty state", () => {
      let ctx: ReturnType<typeof useYearInReview> | undefined;
      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      expect(ctx?.yearInReviews).toEqual([]);
      expect(ctx?.monthlyRecaps).toEqual([]);
    });

    it("generates year in review with curated highlights", async () => {
      mockEntries = createTestEntries(2024, 60);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      let review;
      await act(async () => {
        review = await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      expect(review).toBeDefined();
      expect(review!.childId).toBe("child-1");
      expect(review!.year).toBe(2024);
      expect(review!.status).toBe("ready");
      expect(review!.clips.length).toBeGreaterThan(0);
      expect(review!.clips.length).toBeLessThanOrEqual(MAX_HIGHLIGHTS_PER_YEAR);
    });

    it("prioritizes entries with captions and tags", async () => {
      // Create entries: some with captions/tags, some without
      const now = new Date().toISOString();
      const entries: Entry[] = [
        {
          id: "entry-with-caption",
          type: "photo",
          date: "2024-01-01",
          mediaUris: ["https://example.com/1.jpg"],
          caption: "A great day!",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "entry-with-tags",
          type: "photo",
          date: "2024-02-01",
          mediaUris: ["https://example.com/2.jpg"],
          aiLabels: ["outdoor", "sunny"],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "entry-plain",
          type: "photo",
          date: "2024-03-01",
          mediaUris: ["https://example.com/3.jpg"],
          createdAt: now,
          updatedAt: now,
        },
      ];
      mockEntries = entries;
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      // Entry with caption should score higher and appear first
      expect(review.clips[0].entry.id).toBe("entry-with-caption");
    });

    it("ensures monthly variety in clips", async () => {
      mockEntries = createTestEntries(2024, 60);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      const clipsByMonth = new Map<number, number>();

      for (const clip of review.clips) {
        const month = clip.month;
        clipsByMonth.set(month, (clipsByMonth.get(month) || 0) + 1);
      }

      // Each month should have at most MAX_HIGHLIGHTS_PER_MONTH clips
      for (const count of clipsByMonth.values()) {
        expect(count).toBeLessThanOrEqual(MAX_HIGHLIGHTS_PER_MONTH);
      }
    });

    it("returns existing review if already generated", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      let review1, review2;
      await act(async () => {
        review1 = await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      await act(async () => {
        review2 = await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      expect(review1!.id).toBe(review2!.id);
      expect(ctx!.yearInReviews.length).toBe(1);
    });

    it("receives prompt on child's birthday", () => {
      // Mock today as child's birthday
      const today = new Date();
      mockChild = {
        id: "child-1",
        name: "Test Child",
        dateOfBirth: `2020-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
      };
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      const needsPrompt = ctx!.isYearInReviewPromptNeeded("child-1");
      expect(needsPrompt).toBe(true);
    });

    it("generates review with ready status", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      expect(review.status).toBe("ready");
    });

    it("includes clips with photo URIs for preview", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      expect(review.clips.length).toBeGreaterThan(0);
      for (const clip of review.clips) {
        expect(clip.photoUri).toBeDefined();
        expect(clip.photoUri).not.toBe("");
      }
    });

    it("only includes entries from the specified year", async () => {
      // Create entries from multiple years
      const entries = [
        ...createTestEntries(2023, 10),
        ...createTestEntries(2024, 30),
        ...createTestEntries(2025, 10),
      ];
      mockEntries = entries;
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      for (const clip of review.clips) {
        expect(new Date(clip.entry.date).getFullYear()).toBe(2024);
      }
    });
  });

  describe("YIR-002: Year in review customization", () => {
    it("allows removing clips", async () => {
      mockEntries = createTestEntries(2024, 30);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      const initialClipCount = review.clips.length;
      const clipToRemove = review.clips[0].id;

      act(() => {
        ctx!.customizeYearInReview({
          reviewId: review.id,
          removeClipIds: [clipToRemove],
        });
      });

      const updatedReview = ctx!.yearInReviews[0];
      expect(updatedReview.clips.length).toBe(initialClipCount - 1);
      expect(
        updatedReview.clips.find((c) => c.id === clipToRemove),
      ).toBeUndefined();
    });

    it("allows changing music track", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      const newMusicId = MUSIC_LIBRARY[1].id;

      act(() => {
        ctx!.customizeYearInReview({
          reviewId: review.id,
          musicId: newMusicId,
        });
      });

      const updatedReview = ctx!.yearInReviews[0];
      expect(updatedReview.selectedMusicId).toBe(newMusicId);
    });

    it("allows adjusting transition style", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];

      act(() => {
        ctx!.customizeYearInReview({
          reviewId: review.id,
          transitionStyle: "slide",
        });
      });

      const updatedReview = ctx!.yearInReviews[0];
      expect(updatedReview.transitionStyle).toBe("slide");
    });

    it("allows reset to AI suggestion", async () => {
      mockEntries = createTestEntries(2024, 30);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      const originalClipCount = review.clips.length;

      // Remove some clips
      act(() => {
        ctx!.customizeYearInReview({
          reviewId: review.id,
          removeClipIds: [review.clips[0].id, review.clips[1].id],
        });
      });

      expect(ctx!.yearInReviews[0].clips.length).toBe(originalClipCount - 2);

      // Reset to AI suggestion
      act(() => {
        ctx!.resetToAISuggestion(review.id);
      });

      expect(ctx!.yearInReviews[0].clips.length).toBe(originalClipCount);
    });

    it("allows adding clips back", async () => {
      mockEntries = createTestEntries(2024, 30);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      const removedClipId = review.clips[0].id;

      // Remove a clip
      act(() => {
        ctx!.customizeYearInReview({
          reviewId: review.id,
          removeClipIds: [removedClipId],
        });
      });

      // Add it back
      act(() => {
        ctx!.customizeYearInReview({
          reviewId: review.id,
          addClipIds: [removedClipId],
        });
      });

      const finalReview = ctx!.yearInReviews[0];
      expect(
        finalReview.clips.find((c) => c.id === removedClipId),
      ).toBeDefined();
    });
  });

  describe("YIR-003: Year in review music library", () => {
    it("provides music library options", () => {
      expect(MUSIC_LIBRARY.length).toBeGreaterThan(0);
      expect(MUSIC_LIBRARY[0]).toHaveProperty("id");
      expect(MUSIC_LIBRARY[0]).toHaveProperty("name");
      expect(MUSIC_LIBRARY[0]).toHaveProperty("category");
    });

    it("includes different music categories", () => {
      const categories = new Set(MUSIC_LIBRARY.map((t) => t.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    it("review uses default music track", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      expect(review.selectedMusicId).toBe(MUSIC_LIBRARY[0].id);
    });
  });

  describe("YIR-004: Export year in review", () => {
    it("allows selecting quality", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];

      act(() => {
        ctx!.customizeYearInReview({
          reviewId: review.id,
          exportQuality: "720p",
        });
      });

      const updatedReview = ctx!.yearInReviews[0];
      expect(updatedReview.exportQuality).toBe("720p");
    });

    it("marks review as exported", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];

      act(() => {
        ctx!.markAsExported(review.id, "file:///exported.mp4");
      });

      const updatedReview = ctx!.yearInReviews[0];
      expect(updatedReview.status).toBe("exported");
      expect(updatedReview.exportedUri).toBe("file:///exported.mp4");
    });

    it("provides quality options", () => {
      expect(VIDEO_QUALITIES.length).toBeGreaterThan(0);
      expect(VIDEO_QUALITIES.find((q) => q.id === "720p")).toBeDefined();
      expect(VIDEO_QUALITIES.find((q) => q.id === "1080p")).toBeDefined();
    });

    it("defaults to 1080p quality", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      expect(review.exportQuality).toBe("1080p");
    });
  });

  describe("YIR-005: Monthly recap video", () => {
    it("generates monthly recap", async () => {
      // Create entries specifically for January 2024
      const entries: Entry[] = [];
      const now = new Date().toISOString();
      for (let i = 0; i < 10; i++) {
        entries.push({
          id: `entry-jan-${i}`,
          type: "photo",
          date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}`,
          mediaUris: [`https://example.com/photo-${i}.jpg`],
          caption: i % 2 === 0 ? `January entry ${i}` : undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
      mockEntries = entries;
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      let recap;
      await act(async () => {
        recap = await ctx!.generateMonthlyRecap("child-1", 2024, 1);
      });

      expect(recap).toBeDefined();
      expect(recap!.childId).toBe("child-1");
      expect(recap!.year).toBe(2024);
      expect(recap!.month).toBe(1);
      expect(recap!.status).toBe("ready");
      expect(recap!.clips.length).toBeGreaterThan(0);
    });

    it("monthly recap only includes that month's highlights", async () => {
      mockEntries = createTestEntries(2024, 60);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateMonthlyRecap("child-1", 2024, 3); // March
      });

      const recap = ctx!.monthlyRecaps[0];
      for (const clip of recap.clips) {
        const month = new Date(clip.entry.date).getMonth() + 1;
        expect(month).toBe(3);
      }
    });

    it("monthly recap is shorter than yearly", async () => {
      mockEntries = createTestEntries(2024, 60);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
        await ctx!.generateMonthlyRecap("child-1", 2024, 1);
      });

      const yearReview = ctx!.yearInReviews[0];
      const monthRecap = ctx!.monthlyRecaps[0];

      // Monthly should have fewer clips
      expect(monthRecap.clips.length).toBeLessThanOrEqual(
        MONTHLY_RECAP_MAX_HIGHLIGHTS,
      );
      expect(monthRecap.clips.length).toBeLessThan(yearReview.clips.length);
    });
  });

  describe("Transition styles", () => {
    it("provides transition style options", () => {
      expect(TRANSITION_STYLES.length).toBeGreaterThan(0);
      expect(TRANSITION_STYLES.find((t) => t.id === "fade")).toBeDefined();
      expect(TRANSITION_STYLES.find((t) => t.id === "slide")).toBeDefined();
    });

    it("review uses fade as default transition", async () => {
      mockEntries = createTestEntries(2024, 20);
      let ctx: ReturnType<typeof useYearInReview> | undefined;

      render(
        <YearInReviewProvider>
          <TestConsumer onResult={(c) => (ctx = c)} />
        </YearInReviewProvider>,
      );

      await act(async () => {
        await ctx!.generateYearInReview({
          childId: "child-1",
          year: 2024,
        });
      });

      const review = ctx!.yearInReviews[0];
      expect(review.transitionStyle).toBe("fade");
    });
  });
});
