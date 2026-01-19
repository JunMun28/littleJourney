/**
 * Tests for useMilestoneSuggestions hook (AIDETECT-003, AIDETECT-004)
 */

import { renderHook, act } from "@testing-library/react-native";
import { useMilestoneSuggestions } from "@/hooks/use-milestone-suggestions";
import type { Entry, AiMilestoneSuggestion } from "@/contexts/entry-context";

// Mock dependencies
jest.mock("@/hooks/use-entries", () => ({
  useUpdateEntry: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
  }),
}));

jest.mock("@/contexts/milestone-context", () => ({
  useMilestones: () => ({
    addMilestone: jest.fn().mockReturnValue({ id: "milestone-123" }),
    completeMilestone: jest.fn(),
  }),
  MILESTONE_TEMPLATES: [
    { id: "first_steps", title: "First Steps", culturalTradition: "universal" },
    { id: "first_smile", title: "First Smile", culturalTradition: "universal" },
  ],
}));

jest.mock("@/hooks/use-children", () => ({
  useChildFlat: () => ({
    child: { id: "child-123", name: "Test Child" },
  }),
}));

describe("useMilestoneSuggestions", () => {
  const mockEntry: Entry = {
    id: "entry-1",
    type: "photo",
    date: "2024-01-15",
    mediaUris: ["photo1.jpg"],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    aiMilestoneSuggestions: [
      {
        templateId: "first_steps",
        title: "First Steps",
        confidence: 0.85,
        status: "pending",
        matchedLabels: ["walking", "standing"],
      },
      {
        templateId: "first_smile",
        title: "First Smile",
        confidence: 0.72,
        status: "pending",
        matchedLabels: ["smiling"],
      },
    ],
  };

  describe("getPendingSuggestions", () => {
    it("returns all pending suggestions for an entry", () => {
      const { result } = renderHook(() => useMilestoneSuggestions());

      const pending = result.current.getPendingSuggestions(mockEntry);

      expect(pending).toHaveLength(2);
      expect(pending[0].templateId).toBe("first_steps");
      expect(pending[1].templateId).toBe("first_smile");
    });

    it("returns empty array for entry without suggestions", () => {
      const { result } = renderHook(() => useMilestoneSuggestions());
      const entryNoSuggestions: Entry = {
        ...mockEntry,
        aiMilestoneSuggestions: undefined,
      };

      const pending = result.current.getPendingSuggestions(entryNoSuggestions);

      expect(pending).toHaveLength(0);
    });

    it("excludes accepted and dismissed suggestions", () => {
      const { result } = renderHook(() => useMilestoneSuggestions());
      const mixedEntry: Entry = {
        ...mockEntry,
        aiMilestoneSuggestions: [
          {
            templateId: "first_steps",
            title: "First Steps",
            confidence: 0.85,
            status: "accepted",
            matchedLabels: [],
          },
          {
            templateId: "first_smile",
            title: "First Smile",
            confidence: 0.72,
            status: "pending",
            matchedLabels: [],
          },
          {
            templateId: "first_tooth",
            title: "First Tooth",
            confidence: 0.65,
            status: "dismissed",
            matchedLabels: [],
          },
        ],
      };

      const pending = result.current.getPendingSuggestions(mixedEntry);

      expect(pending).toHaveLength(1);
      expect(pending[0].templateId).toBe("first_smile");
    });
  });

  describe("hasPendingSuggestions", () => {
    it("returns true when entry has pending suggestions", () => {
      const { result } = renderHook(() => useMilestoneSuggestions());

      expect(result.current.hasPendingSuggestions(mockEntry)).toBe(true);
    });

    it("returns false when entry has no suggestions", () => {
      const { result } = renderHook(() => useMilestoneSuggestions());
      const entryNoSuggestions: Entry = {
        ...mockEntry,
        aiMilestoneSuggestions: undefined,
      };

      expect(result.current.hasPendingSuggestions(entryNoSuggestions)).toBe(
        false,
      );
    });

    it("returns false when all suggestions are resolved", () => {
      const { result } = renderHook(() => useMilestoneSuggestions());
      const resolvedEntry: Entry = {
        ...mockEntry,
        aiMilestoneSuggestions: [
          {
            templateId: "first_steps",
            title: "First Steps",
            confidence: 0.85,
            status: "accepted",
            matchedLabels: [],
          },
        ],
      };

      expect(result.current.hasPendingSuggestions(resolvedEntry)).toBe(false);
    });
  });

  describe("acceptSuggestion", () => {
    it("returns success and milestoneId when accepting valid suggestion", async () => {
      const { result } = renderHook(() => useMilestoneSuggestions());

      let response: { success: boolean; milestoneId?: string };
      await act(async () => {
        response = await result.current.acceptSuggestion(
          mockEntry,
          "first_steps",
        );
      });

      expect(response!.success).toBe(true);
      expect(response!.milestoneId).toBe("milestone-123");
    });

    it("returns failure for non-existent suggestion", async () => {
      const { result } = renderHook(() => useMilestoneSuggestions());

      let response: { success: boolean; milestoneId?: string };
      await act(async () => {
        response = await result.current.acceptSuggestion(
          mockEntry,
          "non_existent",
        );
      });

      expect(response!.success).toBe(false);
      expect(response!.milestoneId).toBeUndefined();
    });

    it("returns failure for entry without suggestions", async () => {
      const { result } = renderHook(() => useMilestoneSuggestions());
      const entryNoSuggestions: Entry = {
        ...mockEntry,
        aiMilestoneSuggestions: undefined,
      };

      let response: { success: boolean; milestoneId?: string };
      await act(async () => {
        response = await result.current.acceptSuggestion(
          entryNoSuggestions,
          "first_steps",
        );
      });

      expect(response!.success).toBe(false);
    });
  });

  describe("dismissSuggestion", () => {
    it("returns success when dismissing valid suggestion", async () => {
      const { result } = renderHook(() => useMilestoneSuggestions());

      let response: { success: boolean };
      await act(async () => {
        response = await result.current.dismissSuggestion(
          mockEntry,
          "first_steps",
        );
      });

      expect(response!.success).toBe(true);
    });

    it("returns failure for non-existent suggestion", async () => {
      const { result } = renderHook(() => useMilestoneSuggestions());

      let response: { success: boolean };
      await act(async () => {
        response = await result.current.dismissSuggestion(
          mockEntry,
          "non_existent",
        );
      });

      expect(response!.success).toBe(false);
    });
  });
});
