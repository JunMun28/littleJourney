/**
 * React hook for AI image analysis (SEARCH-002)
 *
 * Provides state management around the image analysis service.
 * Used when creating entries to generate AI labels for semantic search.
 */

import { useState, useCallback } from "react";
import { getLabelsFromImages } from "@/services/image-analysis";

interface UseImageAnalysisReturn {
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Combined labels from all analyzed images */
  labels: string[];
  /** Error message if analysis failed */
  error: string | null;
  /** Analyze one or more images and update labels state */
  analyzeImages: (imageUris: string[]) => Promise<void>;
  /** Reset state to initial values */
  reset: () => void;
}

/**
 * Hook for analyzing images and extracting AI labels.
 *
 * @example
 * ```tsx
 * const { isAnalyzing, labels, analyzeImages, reset } = useImageAnalysis();
 *
 * // When user selects images
 * await analyzeImages(selectedImageUris);
 *
 * // Use labels in entry creation
 * addEntry({ ...entry, aiLabels: labels });
 * ```
 */
export function useImageAnalysis(): UseImageAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeImages = useCallback(async (imageUris: string[]) => {
    // Handle empty input
    if (!imageUris || imageUris.length === 0) {
      setLabels([]);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const combinedLabels = await getLabelsFromImages(imageUris);
      setLabels(combinedLabels);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to analyze images";
      setError(errorMessage);
      setLabels([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setLabels([]);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    labels,
    error,
    analyzeImages,
    reset,
  };
}
