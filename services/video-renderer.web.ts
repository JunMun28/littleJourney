/**
 * Video Renderer Service (Web Stub)
 *
 * Web version - FFmpeg video rendering is not supported on web.
 * Returns graceful error messages.
 */

import type {
  YearInReview,
  VideoQuality,
  TransitionStyle,
} from "@/contexts/year-in-review-context";

export interface RenderProgress {
  status: "preparing" | "rendering" | "saving" | "complete" | "error";
  progress: number; // 0-100
  message?: string;
}

export interface RenderResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export interface RenderOptions {
  onProgress?: (progress: RenderProgress) => void;
}

// Quality presets (kept for type compatibility)
export const QUALITY_PRESETS: Record<
  VideoQuality,
  { width: number; height: number; bitrate: string; fps: number }
> = {
  "720p": {
    width: 1280,
    height: 720,
    bitrate: "2500k",
    fps: 30,
  },
  "1080p": {
    width: 1920,
    height: 1080,
    bitrate: "5000k",
    fps: 30,
  },
};

/**
 * Get quality settings for a given quality preset.
 */
export function getQualitySettings(
  quality: VideoQuality,
): (typeof QUALITY_PRESETS)[VideoQuality] {
  return QUALITY_PRESETS[quality] || QUALITY_PRESETS["1080p"];
}

/**
 * Build FFmpeg xfade transition filter for a transition between clips.
 * Web stub - returns empty string.
 */
export function buildTransitionFilter(
  _style: TransitionStyle,
  _duration: number,
  _clipDuration: number,
): string {
  return "";
}

/**
 * Build the complete FFmpeg command for video rendering.
 * Web stub - returns empty string.
 */
export function buildFfmpegCommand(): string {
  return "";
}

/**
 * Prepare assets by caching images locally for FFmpeg access.
 * Web stub - returns empty array.
 */
export async function prepareAssets(): Promise<string[]> {
  return [];
}

/**
 * Add audio track to video.
 * Web stub - returns input path.
 */
export async function addAudioTrack(
  videoPath: string,
  _audioUri: string | null,
): Promise<string> {
  return videoPath;
}

/**
 * Main render function - web version returns error.
 */
export async function renderVideo(
  _review: YearInReview,
  options?: RenderOptions,
): Promise<RenderResult> {
  const onProgress = options?.onProgress || (() => {});

  onProgress({
    status: "error",
    progress: 0,
    message: "Video rendering is not available on web. Please use the mobile app.",
  });

  return {
    success: false,
    error: "Video rendering is not available on web. Please use the mobile app.",
  };
}
