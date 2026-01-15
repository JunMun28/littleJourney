/**
 * useVideoUpload Hook
 *
 * Handles video upload to Cloudflare Stream with:
 * - Upload progress tracking
 * - Thumbnail URL generation
 * - Error handling
 */

import { useState, useCallback } from "react";
import {
  getDirectUploadUrl,
  uploadVideo,
  getVideoThumbnailUrl,
  getVideoPlaybackUrl,
  type UploadProgress,
} from "@/services/cloudflare-stream";

export interface VideoUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export interface VideoUploadResult {
  videoId: string;
  streamUrl: string;
  thumbnailUrl: string;
}

export interface UseVideoUploadReturn {
  uploadState: VideoUploadState;
  uploadVideoFile: (
    localUri: string,
    durationSeconds: number,
    metadata?: Record<string, string>,
  ) => Promise<VideoUploadResult | null>;
  resetUploadState: () => void;
}

/**
 * Hook for uploading videos to Cloudflare Stream
 */
export function useVideoUpload(): UseVideoUploadReturn {
  const [uploadState, setUploadState] = useState<VideoUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
    });
  }, []);

  const uploadVideoFile = useCallback(
    async (
      localUri: string,
      durationSeconds: number,
      metadata?: Record<string, string>,
    ): Promise<VideoUploadResult | null> => {
      // Reset state
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
      });

      try {
        // Step 1: Get direct upload URL
        const uploadUrlResult = await getDirectUploadUrl(
          durationSeconds,
          metadata,
        );

        if (!uploadUrlResult.success || !uploadUrlResult.data) {
          throw new Error(uploadUrlResult.error || "Failed to get upload URL");
        }

        const { uploadUrl, uid } = uploadUrlResult.data;

        // Step 2: Upload video with progress tracking
        const uploadResult = await uploadVideo(
          localUri,
          uploadUrl,
          (progress: UploadProgress) => {
            setUploadState((prev) => ({
              ...prev,
              progress: Math.round(progress.percentage),
            }));
          },
        );

        if (!uploadResult.success || !uploadResult.data) {
          throw new Error(uploadResult.error || "Upload failed");
        }

        const videoId = uploadResult.data.uid;

        // Step 3: Get URLs
        const streamUrl = getVideoPlaybackUrl(videoId);
        const thumbnailUrl = getVideoThumbnailUrl(videoId);

        // Mark upload complete
        setUploadState({
          isUploading: false,
          progress: 100,
          error: null,
        });

        return {
          videoId,
          streamUrl,
          thumbnailUrl,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setUploadState({
          isUploading: false,
          progress: 0,
          error: errorMessage,
        });
        return null;
      }
    },
    [],
  );

  return {
    uploadState,
    uploadVideoFile,
    resetUploadState,
  };
}
