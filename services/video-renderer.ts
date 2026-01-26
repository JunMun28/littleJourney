/**
 * Video Renderer Service (YIR-004)
 *
 * Uses FFmpeg-Kit to compose Year in Review videos on-device.
 * Supports transitions, music overlay, and quality settings.
 */

import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import {
  FFmpegKit,
  FFmpegKitConfig,
  ReturnCode,
} from "ffmpeg-kit-react-native";
import type {
  YearInReview,
  ReviewClip,
  VideoQuality,
  TransitionStyle,
} from "@/contexts/year-in-review-context";

// Maximum clips to prevent memory issues
const MAX_CLIPS_FOR_EXPORT = 50;

// Clip duration in seconds
const DEFAULT_CLIP_DURATION = 4;
const DEFAULT_TRANSITION_DURATION = 0.5;

// Quality presets
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

// Transition mapping to FFmpeg xfade transitions
const TRANSITION_MAP: Record<TransitionStyle, string> = {
  fade: "fade",
  slide: "slideleft",
  zoom: "zoomin",
  dissolve: "dissolve",
};

export interface VideoRenderOptions {
  imagePaths: string[];
  outputPath: string;
  quality: VideoQuality;
  transitionStyle: TransitionStyle;
  clipDuration: number;
  transitionDuration: number;
  audioPath?: string | null;
}

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
 */
export function buildTransitionFilter(
  style: TransitionStyle,
  duration: number,
  clipDuration: number,
): string {
  const transition = TRANSITION_MAP[style] || "fade";
  const offset = clipDuration - duration;
  return `xfade=transition=${transition}:duration=${duration}:offset=${offset}`;
}

/**
 * Build the complete FFmpeg command for video rendering.
 */
export function buildFfmpegCommand(options: VideoRenderOptions): string {
  const {
    imagePaths,
    outputPath,
    quality,
    transitionStyle,
    clipDuration,
    transitionDuration,
  } = options;

  const settings = getQualitySettings(quality);
  const parts: string[] = [];

  // Overwrite output
  parts.push("-y");

  // Input files with loop and duration
  for (const path of imagePaths) {
    // Escape special characters in path
    const escapedPath = path.replace(/'/g, "'\\''");
    parts.push(`-loop 1 -t ${clipDuration} -i '${escapedPath}'`);
  }

  // Build filter complex for transitions
  if (imagePaths.length > 1) {
    const filters: string[] = [];
    const transition = TRANSITION_MAP[transitionStyle] || "fade";

    // Scale all inputs to target resolution
    for (let i = 0; i < imagePaths.length; i++) {
      filters.push(
        `[${i}:v]scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${settings.fps}[v${i}]`,
      );
    }

    // Chain xfade transitions
    let lastOutput = "v0";
    for (let i = 1; i < imagePaths.length; i++) {
      const offset = i * clipDuration - i * transitionDuration;
      const outputLabel = i === imagePaths.length - 1 ? "vout" : `xf${i}`;
      filters.push(
        `[${lastOutput}][v${i}]xfade=transition=${transition}:duration=${transitionDuration}:offset=${offset}[${outputLabel}]`,
      );
      lastOutput = outputLabel;
    }

    parts.push(`-filter_complex "${filters.join(";")}"`);
    parts.push("-map [vout]");
  } else if (imagePaths.length === 1) {
    // Single image - just scale
    parts.push(
      `-vf "scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${settings.fps}"`,
    );
  }

  // Video codec and quality
  parts.push("-c:v libx264");
  parts.push("-preset medium");
  parts.push(`-b:v ${settings.bitrate}`);
  parts.push("-pix_fmt yuv420p");

  // Output
  parts.push(`'${outputPath.replace(/'/g, "'\\''")}'`);

  return parts.join(" ");
}

/**
 * Prepare assets by caching images locally for FFmpeg access.
 */
export async function prepareAssets(
  clips: ReviewClip[],
  quality: VideoQuality,
): Promise<string[]> {
  if (clips.length === 0) {
    return [];
  }

  // Create cache directory
  const cacheDir = `${FileSystem.cacheDirectory}video-export/`;
  const dirInfo = await FileSystem.getInfoAsync(cacheDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  }

  // Copy images to cache
  const paths: string[] = [];
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const ext = clip.photoUri.split(".").pop() || "jpg";
    const destPath = `${cacheDir}img_${i}.${ext}`;

    await FileSystem.copyAsync({
      from: clip.photoUri,
      to: destPath,
    });

    paths.push(destPath);
  }

  return paths;
}

/**
 * Add audio track to video.
 */
export async function addAudioTrack(
  videoPath: string,
  audioUri: string | null,
  outputPath: string,
): Promise<string> {
  if (!audioUri) {
    return videoPath;
  }

  const command = [
    "-y",
    `-i '${videoPath.replace(/'/g, "'\\''")}'`,
    `-stream_loop -1 -i '${audioUri.replace(/'/g, "'\\''")}'`,
    "-c:v copy",
    "-c:a aac",
    "-b:a 128k",
    `-af "afade=t=out:st=0:d=2,volume=0.5"`,
    "-shortest",
    `-map 0:v:0 -map 1:a:0`,
    `'${outputPath.replace(/'/g, "'\\''")}'`,
  ].join(" ");

  await FFmpegKit.execute(command);
  return outputPath;
}

/**
 * Main render function - orchestrates the entire video creation process.
 */
export async function renderVideo(
  review: YearInReview,
  options?: RenderOptions,
): Promise<RenderResult> {
  const onProgress = options?.onProgress || (() => {});

  try {
    // Validate
    if (!review || !review.clips || review.clips.length === 0) {
      return { success: false, error: "No clips to export" };
    }

    // Check for invalid clips
    const validClips = review.clips.filter(
      (clip) => clip.photoUri && clip.photoUri.trim() !== "",
    );
    if (validClips.length === 0) {
      return { success: false, error: "No valid clips to export" };
    }

    // Limit clips
    const clipsToRender = validClips.slice(0, MAX_CLIPS_FOR_EXPORT);

    // Request permissions
    onProgress({
      status: "preparing",
      progress: 0,
      message: "Checking permissions...",
    });
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      return { success: false, error: "Camera roll permission denied" };
    }

    // Prepare assets
    onProgress({
      status: "preparing",
      progress: 10,
      message: "Preparing images...",
    });
    const imagePaths = await prepareAssets(clipsToRender, review.exportQuality);

    // Build output path
    const outputDir = `${FileSystem.cacheDirectory}video-export/`;
    const timestamp = Date.now();
    const videoPath = `${outputDir}yir_${review.year}_${timestamp}.mp4`;
    const finalPath = `${outputDir}yir_${review.year}_${timestamp}_final.mp4`;

    // Build and execute FFmpeg command
    onProgress({
      status: "rendering",
      progress: 20,
      message: "Rendering video...",
    });

    const renderOptions: VideoRenderOptions = {
      imagePaths,
      outputPath: videoPath,
      quality: review.exportQuality,
      transitionStyle: review.transitionStyle,
      clipDuration: DEFAULT_CLIP_DURATION,
      transitionDuration: DEFAULT_TRANSITION_DURATION,
    };

    const command = buildFfmpegCommand(renderOptions);

    // Set up progress tracking
    FFmpegKitConfig.enableStatisticsCallback((statistics) => {
      const time = statistics.getTime();
      const totalDuration =
        clipsToRender.length * DEFAULT_CLIP_DURATION * 1000 -
        (clipsToRender.length - 1) * DEFAULT_TRANSITION_DURATION * 1000;
      const renderProgress = Math.min(80, 20 + (time / totalDuration) * 60);
      onProgress({
        status: "rendering",
        progress: Math.round(renderProgress),
        message: "Rendering video...",
      });
    });

    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (!ReturnCode.isSuccess(returnCode)) {
      const logs = await session.getAllLogsAsString();
      console.error("FFmpeg failed:", logs);
      return { success: false, error: "Video rendering failed" };
    }

    // Add audio if available (placeholder - music assets would need to be bundled)
    onProgress({
      status: "rendering",
      progress: 85,
      message: "Adding audio...",
    });
    // const audioPath = getAudioPath(review.selectedMusicId);
    // const finalVideoPath = await addAudioTrack(videoPath, audioPath, finalPath);
    const finalVideoPath = videoPath; // Skip audio for now since assets aren't bundled

    // Save to camera roll
    onProgress({
      status: "saving",
      progress: 90,
      message: "Saving to camera roll...",
    });
    const asset = await MediaLibrary.createAssetAsync(finalVideoPath);

    // Create or get album
    let album = await MediaLibrary.getAlbumAsync("Little Journey");
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      album = await MediaLibrary.createAlbumAsync(
        "Little Journey",
        asset,
        false,
      );
    }

    // Cleanup temp files
    try {
      await FileSystem.deleteAsync(outputDir, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }

    onProgress({
      status: "complete",
      progress: 100,
      message: "Export complete!",
    });
    return { success: true, outputPath: asset.uri };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during export";
    onProgress({ status: "error", progress: 0, message: errorMessage });
    return { success: false, error: errorMessage };
  }
}
