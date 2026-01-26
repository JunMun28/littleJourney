/**
 * useVideoExport Hook (YIR-004)
 *
 * Manages the video export flow for Year in Review.
 * Handles progress tracking, cancellation, and error states.
 */

import { useState, useCallback, useRef } from "react";
import {
  renderVideo,
  type RenderProgress,
  type RenderResult,
} from "@/services/video-renderer";
import type { YearInReview } from "@/contexts/year-in-review-context";

export type ExportStatus =
  | "idle"
  | "preparing"
  | "rendering"
  | "saving"
  | "complete"
  | "error";

export interface UseVideoExportResult {
  /** Current export status */
  status: ExportStatus;
  /** Export progress (0-100) */
  progress: number;
  /** Error message if export failed */
  error: string | null;
  /** Path to exported video if successful */
  outputPath: string | null;
  /** Whether an export is currently in progress */
  isExporting: boolean;
  /** Start exporting a year in review */
  exportVideo: (review: YearInReview) => Promise<void>;
  /** Cancel the current export */
  cancelExport: () => void;
  /** Reset the hook state */
  reset: () => void;
}

export function useVideoExport(): UseVideoExportResult {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);

  // Track if export is in progress to prevent concurrent exports
  const isExportingRef = useRef(false);
  // Track if export was cancelled
  const isCancelledRef = useRef(false);

  const isExporting =
    status === "preparing" || status === "rendering" || status === "saving";

  const handleProgress = useCallback((renderProgress: RenderProgress) => {
    // Don't update if cancelled
    if (isCancelledRef.current) return;

    setStatus(renderProgress.status);
    setProgress(renderProgress.progress);
  }, []);

  const exportVideo = useCallback(
    async (review: YearInReview): Promise<void> => {
      // Validate input
      if (!review) {
        setStatus("error");
        setError("Invalid review: review is null");
        return;
      }

      // Prevent concurrent exports
      if (isExportingRef.current) {
        return;
      }

      // Reset state
      isExportingRef.current = true;
      isCancelledRef.current = false;
      setStatus("preparing");
      setProgress(0);
      setError(null);
      setOutputPath(null);

      try {
        const result: RenderResult = await renderVideo(review, {
          onProgress: handleProgress,
        });

        // Check if cancelled during rendering
        if (isCancelledRef.current) {
          return;
        }

        if (result.success && result.outputPath) {
          setStatus("complete");
          setProgress(100);
          setOutputPath(result.outputPath);
        } else {
          setStatus("error");
          setError(result.error || "Export failed");
        }
      } catch (err) {
        // Check if cancelled
        if (isCancelledRef.current) {
          return;
        }

        setStatus("error");
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        isExportingRef.current = false;
      }
    },
    [handleProgress],
  );

  const cancelExport = useCallback(() => {
    isCancelledRef.current = true;
    isExportingRef.current = false;
    setStatus("idle");
    setProgress(0);
    setError(null);
    setOutputPath(null);
  }, []);

  const reset = useCallback(() => {
    isCancelledRef.current = true;
    isExportingRef.current = false;
    setStatus("idle");
    setProgress(0);
    setError(null);
    setOutputPath(null);
  }, []);

  return {
    status,
    progress,
    error,
    outputPath,
    isExporting,
    exportVideo,
    cancelExport,
    reset,
  };
}
