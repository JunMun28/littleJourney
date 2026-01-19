/**
 * React hook for AI milestone detection (AIDETECT-001)
 *
 * Provides state management around the milestone detection service.
 * Used when creating entries to suggest relevant milestones.
 */

import { useState, useCallback } from "react";
import {
  detectMilestonesFromImages,
  type MilestoneSuggestion,
  type MilestoneDetectionResult,
} from "@/services/milestone-detection";

export type { MilestoneSuggestion, MilestoneDetectionResult };

interface UseMilestoneDetectionReturn {
  /** Whether detection is in progress */
  isDetecting: boolean;
  /** Suggested milestones from analysis */
  suggestions: MilestoneSuggestion[];
  /** Labels detected in images */
  imageLabels: string[];
  /** Error message if detection failed */
  error: string | null;
  /** Detect milestones from one or more images */
  detectMilestones: (imageUris: string[]) => Promise<MilestoneDetectionResult>;
  /** Dismiss a suggestion by template ID */
  dismissSuggestion: (templateId: string) => void;
  /** Reset state to initial values */
  reset: () => void;
}

/**
 * Hook for detecting milestones from images.
 *
 * @example
 * ```tsx
 * const { isDetecting, suggestions, detectMilestones, dismissSuggestion } = useMilestoneDetection();
 *
 * // When user selects images
 * await detectMilestones(selectedImageUris);
 *
 * // Display suggestions to user
 * suggestions.map(s => (
 *   <MilestoneSuggestionCard
 *     suggestion={s}
 *     onAccept={() => linkMilestone(s.templateId)}
 *     onDismiss={() => dismissSuggestion(s.templateId)}
 *   />
 * ));
 * ```
 */
export function useMilestoneDetection(): UseMilestoneDetectionReturn {
  const [isDetecting, setIsDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState<MilestoneSuggestion[]>([]);
  const [imageLabels, setImageLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const detectMilestones = useCallback(
    async (imageUris: string[]): Promise<MilestoneDetectionResult> => {
      // Handle empty input
      if (!imageUris || imageUris.length === 0) {
        const emptyResult: MilestoneDetectionResult = {
          suggestions: [],
          imageLabels: [],
        };
        setSuggestions([]);
        setImageLabels([]);
        return emptyResult;
      }

      setIsDetecting(true);
      setError(null);

      try {
        const result = await detectMilestonesFromImages(imageUris);
        setSuggestions(result.suggestions);
        setImageLabels(result.imageLabels);

        if (result.error) {
          setError(result.error);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to detect milestones from images";
        setError(errorMessage);
        setSuggestions([]);
        setImageLabels([]);
        return {
          suggestions: [],
          imageLabels: [],
          error: errorMessage,
        };
      } finally {
        setIsDetecting(false);
      }
    },
    [],
  );

  const dismissSuggestion = useCallback((templateId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.templateId !== templateId));
  }, []);

  const reset = useCallback(() => {
    setIsDetecting(false);
    setSuggestions([]);
    setImageLabels([]);
    setError(null);
  }, []);

  return {
    isDetecting,
    suggestions,
    imageLabels,
    error,
    detectMilestones,
    dismissSuggestion,
    reset,
  };
}
