import React from "react";
import { renderHook, act } from "@testing-library/react-native";

// Mock milestone context - must be before importing gamification context
jest.mock("@/contexts/milestone-context", () => ({
  useMilestones: () => ({
    completedMilestones: [
      { id: "m1", templateId: "first_smile", isCompleted: true },
      { id: "m2", templateId: "first_steps", isCompleted: true },
    ],
  }),
  MILESTONE_TEMPLATES: [
    {
      id: "first_smile",
      title: "First Smile",
      description: "Baby's first social smile",
      culturalTradition: "universal",
    },
    {
      id: "first_steps",
      title: "First Steps",
      description: "Baby's first independent steps",
      culturalTradition: "universal",
    },
    {
      id: "first_tooth",
      title: "First Tooth",
      description: "Baby's first tooth appears",
      culturalTradition: "universal",
    },
    {
      id: "first_words",
      title: "First Words",
      description: "Baby's first meaningful words",
      culturalTradition: "universal",
    },
  ],
}));

// Mock entry context
jest.mock("@/contexts/entry-context", () => ({
  useEntries: () => ({
    entries: [
      { id: "e1", type: "photo", date: "2025-01-01" },
      { id: "e2", type: "photo", date: "2025-01-02" },
    ],
  }),
}));

// Import after mocks
import {
  GamificationProvider,
  useGamification,
  BADGE_DEFINITIONS,
} from "@/contexts/gamification-context";

import {
  calculateStreak,
  type StreakData,
} from "@/contexts/gamification-context";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Badge = (typeof BADGE_DEFINITIONS)[number];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type BadgeType = Badge["type"];

describe("GamificationContext", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GamificationProvider>{children}</GamificationProvider>
  );

  describe("Badge definitions", () => {
    it("has badge definitions for each milestone template", () => {
      // Check we have at least the universal milestone badges
      const milestoneBadges = BADGE_DEFINITIONS.filter(
        (b) => b.type === "milestone",
      );
      expect(milestoneBadges.length).toBeGreaterThan(0);

      // Check first_smile badge exists
      const firstSmileBadge = BADGE_DEFINITIONS.find(
        (b) => b.id === "badge_first_smile",
      );
      expect(firstSmileBadge).toBeDefined();
      expect(firstSmileBadge?.title).toBe("First Smile");
    });

    it("has achievement badges for streaks and goals", () => {
      const achievementBadges = BADGE_DEFINITIONS.filter(
        (b) => b.type === "achievement",
      );
      expect(achievementBadges.length).toBeGreaterThan(0);
    });
  });

  describe("useGamification hook", () => {
    it("throws when used outside provider", () => {
      expect(() => {
        renderHook(() => useGamification());
      }).toThrow("useGamification must be used within a GamificationProvider");
    });

    it("returns unlocked badges based on completed milestones", () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      // first_smile and first_steps are completed, so badges should be unlocked
      const firstSmileBadge = result.current.unlockedBadges.find(
        (b) => b.id === "badge_first_smile",
      );
      expect(firstSmileBadge).toBeDefined();

      const firstStepsBadge = result.current.unlockedBadges.find(
        (b) => b.id === "badge_first_steps",
      );
      expect(firstStepsBadge).toBeDefined();
    });

    it("returns locked badges for incomplete milestones", () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      // first_tooth is not completed, so badge should be locked
      const firstToothBadge = result.current.lockedBadges.find(
        (b) => b.id === "badge_first_tooth",
      );
      expect(firstToothBadge).toBeDefined();
    });

    it("getBadgeById returns correct badge", () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      const badge = result.current.getBadgeById("badge_first_smile");
      expect(badge).toBeDefined();
      expect(badge?.title).toBe("First Smile");
    });

    it("isBadgeUnlocked returns true for unlocked badges", () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.isBadgeUnlocked("badge_first_smile")).toBe(true);
      expect(result.current.isBadgeUnlocked("badge_first_tooth")).toBe(false);
    });

    it("tracks newly unlocked badges for notification", () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      // Initially no newly unlocked badges since this is first render
      expect(result.current.newlyUnlockedBadges).toBeDefined();
    });

    it("markBadgeAsSeen clears from newly unlocked", () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      act(() => {
        result.current.markBadgeAsSeen("badge_first_smile");
      });

      // Badge should be marked as seen
      const seenBadges = result.current.seenBadgeIds;
      expect(seenBadges.includes("badge_first_smile")).toBe(true);
    });

    it("calculates total badges count", () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.totalBadges).toBe(BADGE_DEFINITIONS.length);
      // first_smile, first_steps, and badge_first_entry (from having entries)
      expect(result.current.unlockedCount).toBe(3);
    });
  });

  describe("Streak calculation (GAME-002)", () => {
    it("calculates 0 streak for no entries", () => {
      const result = calculateStreak([]);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.lastEntryDate).toBeNull();
    });

    it("calculates streak of 1 for entry today", () => {
      const today = new Date().toISOString().split("T")[0];
      const entries = [{ date: today }];
      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it("calculates streak of 1 for entry yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const entries = [{ date: yesterday.toISOString().split("T")[0] }];
      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it("calculates 0 current streak for old entry (more than 1 day ago)", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 3);
      const entries = [{ date: oldDate.toISOString().split("T")[0] }];
      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(1);
    });

    it("calculates consecutive day streak", () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBefore = new Date();
      dayBefore.setDate(dayBefore.getDate() - 2);

      const entries = [
        { date: today.toISOString().split("T")[0] },
        { date: yesterday.toISOString().split("T")[0] },
        { date: dayBefore.toISOString().split("T")[0] },
      ];
      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });

    it("handles multiple entries on same day", () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const entries = [
        { date: today.toISOString().split("T")[0] },
        { date: today.toISOString().split("T")[0] }, // Duplicate
        { date: yesterday.toISOString().split("T")[0] },
      ];
      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(2); // Not 3
      expect(result.longestStreak).toBe(2);
    });

    it("tracks longest streak separately from current", () => {
      // Old streak of 5 days, current streak of 2
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Gap, then old 5-day streak
      const oldStreak: { date: string }[] = [];
      for (let i = 10; i < 15; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        oldStreak.push({ date: d.toISOString().split("T")[0] });
      }

      const entries = [
        { date: today.toISOString().split("T")[0] },
        { date: yesterday.toISOString().split("T")[0] },
        ...oldStreak,
      ];
      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(5);
    });

    it("returns lastEntryDate as most recent entry date", () => {
      const today = new Date();
      const entries = [{ date: today.toISOString().split("T")[0] }];
      const result = calculateStreak(entries);
      expect(result.lastEntryDate).toBe(today.toISOString().split("T")[0]);
    });
  });
});
