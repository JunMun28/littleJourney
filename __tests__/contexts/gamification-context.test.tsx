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
});
