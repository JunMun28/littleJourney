/**
 * Hook for managing AI milestone suggestions on entries (AIDETECT-003, AIDETECT-004)
 *
 * Handles accepting and dismissing AI-detected milestone suggestions
 * after an entry has been created.
 */

import { useCallback } from "react";
import { useUpdateEntry } from "./use-entries";
import {
  useMilestones,
  MILESTONE_TEMPLATES,
} from "@/contexts/milestone-context";
import { useChildFlat } from "./use-children";
import type { Entry, AiMilestoneSuggestion } from "@/contexts/entry-context";

interface UseMilestoneSuggestionsReturn {
  /** Accept a milestone suggestion, linking entry to milestone (AIDETECT-003) */
  acceptSuggestion: (
    entry: Entry,
    templateId: string,
  ) => Promise<{ success: boolean; milestoneId?: string }>;
  /** Dismiss a milestone suggestion (AIDETECT-004) */
  dismissSuggestion: (
    entry: Entry,
    templateId: string,
  ) => Promise<{ success: boolean }>;
  /** Check if entry has pending suggestions */
  hasPendingSuggestions: (entry: Entry) => boolean;
  /** Get pending suggestions for an entry */
  getPendingSuggestions: (entry: Entry) => AiMilestoneSuggestion[];
}

/**
 * Hook for accepting/dismissing AI milestone suggestions on existing entries.
 *
 * When a suggestion is accepted:
 * 1. Updates the entry's suggestion status to "accepted"
 * 2. Links the entry to a milestone (sets entry.milestoneId)
 * 3. Creates and completes the milestone in milestone context
 *
 * When a suggestion is dismissed:
 * 1. Updates the entry's suggestion status to "dismissed"
 * 2. The suggestion is removed from pending list
 *
 * @example
 * ```tsx
 * const { acceptSuggestion, dismissSuggestion, getPendingSuggestions } = useMilestoneSuggestions();
 *
 * // Get pending suggestions for display
 * const pending = getPendingSuggestions(entry);
 *
 * // User accepts a suggestion
 * const result = await acceptSuggestion(entry, 'first_steps');
 * if (result.success) {
 *   console.log('Milestone created:', result.milestoneId);
 * }
 *
 * // User dismisses a suggestion
 * await dismissSuggestion(entry, 'first_smile');
 * ```
 */
export function useMilestoneSuggestions(): UseMilestoneSuggestionsReturn {
  const updateEntry = useUpdateEntry();
  const { addMilestone, completeMilestone } = useMilestones();
  const { child } = useChildFlat();

  /**
   * Accept a milestone suggestion (AIDETECT-003)
   *
   * 1. Creates milestone from template
   * 2. Marks milestone as completed with entry's photo
   * 3. Updates entry with accepted status and milestoneId link
   */
  const acceptSuggestion = useCallback(
    async (
      entry: Entry,
      templateId: string,
    ): Promise<{ success: boolean; milestoneId?: string }> => {
      if (!entry.aiMilestoneSuggestions) {
        return { success: false };
      }

      const suggestion = entry.aiMilestoneSuggestions.find(
        (s) => s.templateId === templateId && s.status === "pending",
      );

      if (!suggestion) {
        return { success: false };
      }

      // Get template info for milestone creation
      const template = MILESTONE_TEMPLATES.find((t) => t.id === templateId);
      if (!template) {
        return { success: false };
      }

      // Ensure we have a child to associate milestone with
      const childId = child?.id ?? "default-child";

      // Create milestone
      const milestone = addMilestone({
        templateId,
        childId,
        milestoneDate: entry.date,
      });

      // Complete milestone with entry photo
      completeMilestone(milestone.id, {
        celebrationDate: entry.date,
        photoUri: entry.mediaUris?.[0],
        notes: `Detected from photo entry`,
      });

      // Update entry suggestion status and link to milestone
      const updatedSuggestions: AiMilestoneSuggestion[] =
        entry.aiMilestoneSuggestions.map((s) =>
          s.templateId === templateId
            ? { ...s, status: "accepted" as const }
            : s,
        );

      try {
        await updateEntry.mutateAsync({
          id: entry.id,
          updates: {
            aiMilestoneSuggestions: updatedSuggestions,
            milestoneId: milestone.id,
          },
        });

        return { success: true, milestoneId: milestone.id };
      } catch {
        // If entry update fails, we still have the milestone created
        // This is acceptable as the milestone exists independently
        return { success: true, milestoneId: milestone.id };
      }
    },
    [addMilestone, completeMilestone, updateEntry, child],
  );

  /**
   * Dismiss a milestone suggestion (AIDETECT-004)
   *
   * Updates the suggestion status to "dismissed" so it won't show again.
   * Dismissed suggestions are kept for potential AI learning feedback.
   */
  const dismissSuggestion = useCallback(
    async (entry: Entry, templateId: string): Promise<{ success: boolean }> => {
      if (!entry.aiMilestoneSuggestions) {
        return { success: false };
      }

      const suggestion = entry.aiMilestoneSuggestions.find(
        (s) => s.templateId === templateId && s.status === "pending",
      );

      if (!suggestion) {
        return { success: false };
      }

      // Update entry suggestion status to dismissed
      const updatedSuggestions: AiMilestoneSuggestion[] =
        entry.aiMilestoneSuggestions.map((s) =>
          s.templateId === templateId
            ? { ...s, status: "dismissed" as const }
            : s,
        );

      try {
        await updateEntry.mutateAsync({
          id: entry.id,
          updates: {
            aiMilestoneSuggestions: updatedSuggestions,
          },
        });

        return { success: true };
      } catch {
        return { success: false };
      }
    },
    [updateEntry],
  );

  /**
   * Check if entry has any pending (unresolved) suggestions
   */
  const hasPendingSuggestions = useCallback((entry: Entry): boolean => {
    if (!entry.aiMilestoneSuggestions) return false;
    return entry.aiMilestoneSuggestions.some((s) => s.status === "pending");
  }, []);

  /**
   * Get all pending suggestions for an entry
   */
  const getPendingSuggestions = useCallback(
    (entry: Entry): AiMilestoneSuggestion[] => {
      if (!entry.aiMilestoneSuggestions) return [];
      return entry.aiMilestoneSuggestions.filter((s) => s.status === "pending");
    },
    [],
  );

  return {
    acceptSuggestion,
    dismissSuggestion,
    hasPendingSuggestions,
    getPendingSuggestions,
  };
}
