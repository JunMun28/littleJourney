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

// Mock child context - default no child
let mockChild: { dateOfBirth: string } | null = null;
jest.mock("@/contexts/child-context", () => ({
  useChild: () => ({
    child: mockChild,
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
  calculateMonthlyGoal,
  calculateFirstYearComplete,
  type StreakData,
  type FirstYearData,
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

  describe("Monthly goal calculation (GAME-003)", () => {
    it("calculates 0 progress for no entries", () => {
      const result = calculateMonthlyGoal([], 10);
      expect(result.currentCount).toBe(0);
      expect(result.goalCount).toBe(10);
      expect(result.isGoalMet).toBe(false);
      expect(result.progressPercent).toBe(0);
    });

    it("counts only entries from current month", () => {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM

      // Entry from current month
      const thisMonthDate = `${currentMonth}-15`;
      // Entry from last month
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthDate = lastMonth.toISOString().split("T")[0];

      const entries = [{ date: thisMonthDate }, { date: lastMonthDate }];
      const result = calculateMonthlyGoal(entries, 10);
      expect(result.currentCount).toBe(1);
    });

    it("returns isGoalMet true when goal reached", () => {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7);

      const entries: { date: string }[] = [];
      for (let i = 1; i <= 10; i++) {
        entries.push({ date: `${currentMonth}-${String(i).padStart(2, "0")}` });
      }

      const result = calculateMonthlyGoal(entries, 10);
      expect(result.currentCount).toBe(10);
      expect(result.isGoalMet).toBe(true);
    });

    it("caps progressPercent at 100", () => {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7);

      const entries: { date: string }[] = [];
      for (let i = 1; i <= 15; i++) {
        entries.push({ date: `${currentMonth}-${String(i).padStart(2, "0")}` });
      }

      const result = calculateMonthlyGoal(entries, 10);
      expect(result.progressPercent).toBe(100);
    });

    it("returns current month name", () => {
      const result = calculateMonthlyGoal([], 10);
      const expectedMonth = new Date().toLocaleString("en-US", {
        month: "long",
      });
      expect(result.monthName).toBe(expectedMonth);
    });

    it("calculates correct progressPercent", () => {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7);

      const entries = [
        { date: `${currentMonth}-01` },
        { date: `${currentMonth}-02` },
        { date: `${currentMonth}-03` },
        { date: `${currentMonth}-04` },
        { date: `${currentMonth}-05` },
      ];

      const result = calculateMonthlyGoal(entries, 10);
      expect(result.progressPercent).toBe(50);
    });

    it("uses default goal of 10 if not specified", () => {
      const result = calculateMonthlyGoal([]);
      expect(result.goalCount).toBe(10);
    });
  });

  describe("First year completion (GAME-004)", () => {
    beforeEach(() => {
      mockChild = null;
    });

    it("returns incomplete when no child", () => {
      const result = calculateFirstYearComplete(null);
      expect(result.isComplete).toBe(false);
      expect(result.hasDiscount).toBe(false);
      expect(result.childAge).toBeNull();
    });

    it("returns incomplete when child is under 1 year old", () => {
      const today = new Date();
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const result = calculateFirstYearComplete({
        dateOfBirth: sixMonthsAgo.toISOString().split("T")[0],
      });
      expect(result.isComplete).toBe(false);
      expect(result.hasDiscount).toBe(true); // Discount available when not yet claimed
      expect(result.childAge).toBe(0);
    });

    it("returns complete when child is exactly 1 year old", () => {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const result = calculateFirstYearComplete({
        dateOfBirth: oneYearAgo.toISOString().split("T")[0],
      });
      expect(result.isComplete).toBe(true);
      expect(result.childAge).toBe(1);
    });

    it("returns complete when child is over 1 year old", () => {
      const today = new Date();
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const result = calculateFirstYearComplete({
        dateOfBirth: twoYearsAgo.toISOString().split("T")[0],
      });
      expect(result.isComplete).toBe(true);
      expect(result.childAge).toBe(2);
    });

    it("calculates days until first birthday", () => {
      const today = new Date();
      const elevenMonthsAgo = new Date(today);
      elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);

      const result = calculateFirstYearComplete({
        dateOfBirth: elevenMonthsAgo.toISOString().split("T")[0],
      });
      expect(result.isComplete).toBe(false);
      expect(result.daysUntilFirstBirthday).toBeDefined();
      expect(result.daysUntilFirstBirthday).toBeGreaterThan(0);
      expect(result.daysUntilFirstBirthday).toBeLessThanOrEqual(31);
    });

    it("unlocks first_year badge when child is 1+", () => {
      // Set up mock for child over 1 year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      mockChild = { dateOfBirth: oneYearAgo.toISOString().split("T")[0] };

      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.isBadgeUnlocked("badge_first_year")).toBe(true);
    });

    it("does not unlock first_year badge when child is under 1", () => {
      // Set up mock for child under 1 year
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      mockChild = { dateOfBirth: sixMonthsAgo.toISOString().split("T")[0] };

      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.isBadgeUnlocked("badge_first_year")).toBe(false);
    });
  });
});
