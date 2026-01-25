/**
 * Video Renderer Service Tests (YIR-004)
 *
 * Tests for FFmpeg command generation, quality settings,
 * and transition filter building for Year in Review video export.
 */

import {
  buildFfmpegCommand,
  getQualitySettings,
  buildTransitionFilter,
  prepareAssets,
  addAudioTrack,
  renderVideo,
  QUALITY_PRESETS,
  type VideoRenderOptions,
  type RenderProgress,
} from "@/services/video-renderer";
import type {
  YearInReview,
  ReviewClip,
  VideoQuality,
  TransitionStyle,
} from "@/contexts/year-in-review-context";

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///mock/documents/",
  cacheDirectory: "file:///mock/cache/",
  downloadAsync: jest
    .fn()
    .mockResolvedValue({ uri: "file:///mock/cached.jpg" }),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock ffmpeg-kit-react-native
const mockExecute = jest.fn();
const mockCancel = jest.fn();
jest.mock("ffmpeg-kit-react-native", () => ({
  FFmpegKit: {
    execute: mockExecute,
    cancel: mockCancel,
  },
  FFmpegKitConfig: {
    enableStatisticsCallback: jest.fn(),
    enableLogCallback: jest.fn(),
  },
  ReturnCode: {
    isSuccess: jest.fn().mockReturnValue(true),
    isCancel: jest.fn().mockReturnValue(false),
  },
}));

// Mock expo-media-library
jest.mock("expo-media-library", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  createAssetAsync: jest
    .fn()
    .mockResolvedValue({ id: "asset-1", uri: "file:///mock/video.mp4" }),
  createAlbumAsync: jest
    .fn()
    .mockResolvedValue({ id: "album-1", title: "Little Journey" }),
  getAlbumAsync: jest.fn().mockResolvedValue(null),
  addAssetsToAlbumAsync: jest.fn().mockResolvedValue(true),
}));

// Test fixtures
const createMockClip = (id: string, photoUri: string): ReviewClip => ({
  id,
  entry: {
    id: `entry-${id}`,
    childId: "child-1",
    type: "photo",
    mediaUris: [photoUri],
    date: "2024-06-15",
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2024-06-15T10:00:00Z",
  },
  photoUri,
  score: 100,
  month: 6,
  isMilestone: false,
});

const createMockReview = (clipCount: number = 5): YearInReview => ({
  id: "review-1",
  childId: "child-1",
  year: 2024,
  createdAt: "2024-12-15T10:00:00Z",
  updatedAt: "2024-12-15T10:00:00Z",
  status: "ready",
  clips: Array.from({ length: clipCount }, (_, i) =>
    createMockClip(`clip-${i}`, `file:///photos/photo${i}.jpg`),
  ),
  removedClipIds: [],
  selectedMusicId: "gentle_memories",
  transitionStyle: "fade",
  exportQuality: "1080p",
});

describe("video-renderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({
      getReturnCode: () => ({ isValueSuccess: () => true }),
    });
  });

  describe("QUALITY_PRESETS", () => {
    it("defines 720p quality preset", () => {
      expect(QUALITY_PRESETS["720p"]).toEqual({
        width: 1280,
        height: 720,
        bitrate: "2500k",
        fps: 30,
      });
    });

    it("defines 1080p quality preset", () => {
      expect(QUALITY_PRESETS["1080p"]).toEqual({
        width: 1920,
        height: 1080,
        bitrate: "5000k",
        fps: 30,
      });
    });
  });

  describe("getQualitySettings", () => {
    it("returns 720p settings", () => {
      const settings = getQualitySettings("720p");

      expect(settings.width).toBe(1280);
      expect(settings.height).toBe(720);
      expect(settings.bitrate).toBe("2500k");
    });

    it("returns 1080p settings", () => {
      const settings = getQualitySettings("1080p");

      expect(settings.width).toBe(1920);
      expect(settings.height).toBe(1080);
      expect(settings.bitrate).toBe("5000k");
    });

    it("defaults to 1080p for invalid quality", () => {
      const settings = getQualitySettings("invalid" as VideoQuality);

      expect(settings.width).toBe(1920);
      expect(settings.height).toBe(1080);
    });
  });

  describe("buildTransitionFilter", () => {
    it("generates fade transition filter", () => {
      const filter = buildTransitionFilter("fade", 0.5, 4);

      expect(filter).toContain("xfade=transition=fade");
      expect(filter).toContain("duration=0.5");
      expect(filter).toContain("offset=3.5"); // 4 - 0.5
    });

    it("generates slide transition filter", () => {
      const filter = buildTransitionFilter("slide", 0.5, 4);

      expect(filter).toContain("xfade=transition=slideleft");
      expect(filter).toContain("duration=0.5");
    });

    it("generates zoom transition filter", () => {
      const filter = buildTransitionFilter("zoom", 0.5, 4);

      expect(filter).toContain("xfade=transition=zoomin");
    });

    it("generates dissolve transition filter", () => {
      const filter = buildTransitionFilter("dissolve", 0.5, 4);

      expect(filter).toContain("xfade=transition=dissolve");
    });

    it("calculates correct offset based on clip duration", () => {
      const filter = buildTransitionFilter("fade", 1.0, 5);

      expect(filter).toContain("offset=4"); // 5 - 1 = 4
    });
  });

  describe("buildFfmpegCommand", () => {
    it("builds command with correct input files", () => {
      const options: VideoRenderOptions = {
        imagePaths: ["/path/img1.jpg", "/path/img2.jpg", "/path/img3.jpg"],
        outputPath: "/output/video.mp4",
        quality: "1080p",
        transitionStyle: "fade",
        clipDuration: 4,
        transitionDuration: 0.5,
      };

      const command = buildFfmpegCommand(options);

      expect(command).toContain("-i /path/img1.jpg");
      expect(command).toContain("-i /path/img2.jpg");
      expect(command).toContain("-i /path/img3.jpg");
    });

    it("applies correct resolution based on quality", () => {
      const options720: VideoRenderOptions = {
        imagePaths: ["/path/img1.jpg", "/path/img2.jpg"],
        outputPath: "/output/video.mp4",
        quality: "720p",
        transitionStyle: "fade",
        clipDuration: 4,
        transitionDuration: 0.5,
      };

      const command720 = buildFfmpegCommand(options720);

      expect(command720).toContain("1280");
      expect(command720).toContain("720");

      const options1080: VideoRenderOptions = {
        ...options720,
        quality: "1080p",
      };

      const command1080 = buildFfmpegCommand(options1080);

      expect(command1080).toContain("1920");
      expect(command1080).toContain("1080");
    });

    it("applies correct bitrate based on quality", () => {
      const options: VideoRenderOptions = {
        imagePaths: ["/path/img1.jpg"],
        outputPath: "/output/video.mp4",
        quality: "720p",
        transitionStyle: "fade",
        clipDuration: 4,
        transitionDuration: 0.5,
      };

      const command = buildFfmpegCommand(options);

      expect(command).toContain("-b:v 2500k");
    });

    it("includes transition filter complex for multiple images", () => {
      const options: VideoRenderOptions = {
        imagePaths: ["/path/img1.jpg", "/path/img2.jpg", "/path/img3.jpg"],
        outputPath: "/output/video.mp4",
        quality: "1080p",
        transitionStyle: "fade",
        clipDuration: 4,
        transitionDuration: 0.5,
      };

      const command = buildFfmpegCommand(options);

      expect(command).toContain("-filter_complex");
      expect(command).toContain("xfade");
    });

    it("sets output path correctly", () => {
      const options: VideoRenderOptions = {
        imagePaths: ["/path/img1.jpg"],
        outputPath: "/output/my-video.mp4",
        quality: "1080p",
        transitionStyle: "fade",
        clipDuration: 4,
        transitionDuration: 0.5,
      };

      const command = buildFfmpegCommand(options);

      expect(command).toContain("/output/my-video.mp4");
    });

    it("uses h264 codec for compatibility", () => {
      const options: VideoRenderOptions = {
        imagePaths: ["/path/img1.jpg"],
        outputPath: "/output/video.mp4",
        quality: "1080p",
        transitionStyle: "fade",
        clipDuration: 4,
        transitionDuration: 0.5,
      };

      const command = buildFfmpegCommand(options);

      expect(command).toMatch(/-c:v\s+(libx264|h264)/);
    });

    it("includes overwrite flag", () => {
      const options: VideoRenderOptions = {
        imagePaths: ["/path/img1.jpg"],
        outputPath: "/output/video.mp4",
        quality: "1080p",
        transitionStyle: "fade",
        clipDuration: 4,
        transitionDuration: 0.5,
      };

      const command = buildFfmpegCommand(options);

      expect(command).toContain("-y");
    });
  });

  describe("prepareAssets", () => {
    it("caches all clip images locally", async () => {
      const FileSystem = require("expo-file-system");
      const clips = [
        createMockClip("1", "file:///photos/photo1.jpg"),
        createMockClip("2", "file:///photos/photo2.jpg"),
      ];

      const paths = await prepareAssets(clips, "1080p");

      expect(FileSystem.copyAsync).toHaveBeenCalledTimes(2);
      expect(paths).toHaveLength(2);
    });

    it("returns paths in correct order", async () => {
      const clips = [
        createMockClip("1", "file:///photos/photo1.jpg"),
        createMockClip("2", "file:///photos/photo2.jpg"),
        createMockClip("3", "file:///photos/photo3.jpg"),
      ];

      const paths = await prepareAssets(clips, "1080p");

      expect(paths[0]).toContain("photo1");
      expect(paths[1]).toContain("photo2");
      expect(paths[2]).toContain("photo3");
    });

    it("creates cache directory if not exists", async () => {
      const FileSystem = require("expo-file-system");
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: false });

      const clips = [createMockClip("1", "file:///photos/photo1.jpg")];

      await prepareAssets(clips, "1080p");

      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
    });

    it("handles empty clips array", async () => {
      const paths = await prepareAssets([], "1080p");

      expect(paths).toEqual([]);
    });

    it("throws error when asset preparation fails", async () => {
      const FileSystem = require("expo-file-system");
      FileSystem.copyAsync.mockRejectedValueOnce(new Error("Copy failed"));

      const clips = [createMockClip("1", "file:///photos/photo1.jpg")];

      await expect(prepareAssets(clips, "1080p")).rejects.toThrow(
        "Copy failed",
      );
    });
  });

  describe("addAudioTrack", () => {
    it("overlays audio on video", async () => {
      const result = await addAudioTrack(
        "/path/video.mp4",
        "file:///audio/music.mp3",
        "/output/final.mp4",
      );

      expect(mockExecute).toHaveBeenCalled();
      expect(result).toContain("final.mp4");
    });

    it("includes audio fade out at end", async () => {
      await addAudioTrack(
        "/path/video.mp4",
        "file:///audio/music.mp3",
        "/output/final.mp4",
      );

      const command = mockExecute.mock.calls[0][0];
      expect(command).toContain("afade");
    });

    it("loops audio to match video length", async () => {
      await addAudioTrack(
        "/path/video.mp4",
        "file:///audio/music.mp3",
        "/output/final.mp4",
      );

      const command = mockExecute.mock.calls[0][0];
      expect(command).toContain("-stream_loop");
    });

    it("returns original video path when no audio provided", async () => {
      const result = await addAudioTrack(
        "/path/video.mp4",
        null,
        "/output/final.mp4",
      );

      expect(result).toBe("/path/video.mp4");
      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe("renderVideo", () => {
    it("renders video from review and returns output path", async () => {
      const review = createMockReview(3);

      const result = await renderVideo(review);

      expect(result.success).toBe(true);
      expect(result.outputPath).toContain(".mp4");
    });

    it("calls progress callback during rendering", async () => {
      const review = createMockReview(3);
      const onProgress = jest.fn();

      await renderVideo(review, { onProgress });

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.any(String),
          progress: expect.any(Number),
        }),
      );
    });

    it("reports preparing status initially", async () => {
      const review = createMockReview(2);
      const progressUpdates: RenderProgress[] = [];

      await renderVideo(review, {
        onProgress: (p) => progressUpdates.push(p),
      });

      expect(progressUpdates[0].status).toBe("preparing");
    });

    it("reports rendering status during FFmpeg execution", async () => {
      const review = createMockReview(2);
      const progressUpdates: RenderProgress[] = [];

      await renderVideo(review, {
        onProgress: (p) => progressUpdates.push(p),
      });

      expect(progressUpdates.some((p) => p.status === "rendering")).toBe(true);
    });

    it("reports saving status when saving to camera roll", async () => {
      const review = createMockReview(2);
      const progressUpdates: RenderProgress[] = [];

      await renderVideo(review, {
        onProgress: (p) => progressUpdates.push(p),
      });

      expect(progressUpdates.some((p) => p.status === "saving")).toBe(true);
    });

    it("reports complete status on success", async () => {
      const review = createMockReview(2);
      const progressUpdates: RenderProgress[] = [];

      await renderVideo(review, {
        onProgress: (p) => progressUpdates.push(p),
      });

      expect(progressUpdates[progressUpdates.length - 1].status).toBe(
        "complete",
      );
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
    });

    it("respects export quality setting from review", async () => {
      const review = createMockReview(2);
      review.exportQuality = "720p";

      await renderVideo(review);

      const command = mockExecute.mock.calls[0][0];
      expect(command).toContain("1280");
      expect(command).toContain("720");
    });

    it("uses transition style from review", async () => {
      const review = createMockReview(3);
      review.transitionStyle = "slide";

      await renderVideo(review);

      const command = mockExecute.mock.calls[0][0];
      expect(command).toContain("slideleft");
    });

    it("handles render failure gracefully", async () => {
      mockExecute.mockRejectedValueOnce(new Error("FFmpeg failed"));
      const review = createMockReview(2);

      const result = await renderVideo(review);

      expect(result.success).toBe(false);
      expect(result.error).toContain("FFmpeg failed");
    });

    it("limits clips to MAX_CLIPS_FOR_EXPORT", async () => {
      const review = createMockReview(60); // More than limit

      await renderVideo(review);

      // Should only process up to 50 clips
      const command = mockExecute.mock.calls[0][0];
      const inputCount = (command.match(/-i /g) || []).length;
      expect(inputCount).toBeLessThanOrEqual(50);
    });

    it("saves to Little Journey album", async () => {
      const MediaLibrary = require("expo-media-library");
      const review = createMockReview(2);

      await renderVideo(review);

      expect(MediaLibrary.createAlbumAsync).toHaveBeenCalledWith(
        "Little Journey",
        expect.anything(),
        false,
      );
    });

    it("handles missing media library permission", async () => {
      const MediaLibrary = require("expo-media-library");
      MediaLibrary.requestPermissionsAsync.mockResolvedValueOnce({
        status: "denied",
      });

      const review = createMockReview(2);

      const result = await renderVideo(review);

      expect(result.success).toBe(false);
      expect(result.error).toContain("permission");
    });

    it("cleans up temporary files after rendering", async () => {
      const FileSystem = require("expo-file-system");
      const review = createMockReview(2);

      await renderVideo(review);

      expect(FileSystem.deleteAsync).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles review with single clip", async () => {
      const review = createMockReview(1);

      const result = await renderVideo(review);

      expect(result.success).toBe(true);
      // Single clip should not have transitions
      const command = mockExecute.mock.calls[0][0];
      expect(command).not.toContain("xfade");
    });

    it("handles review with no clips", async () => {
      const review = createMockReview(0);

      const result = await renderVideo(review);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No clips");
    });

    it("handles clips with missing photo URIs", async () => {
      const review = createMockReview(2);
      review.clips[0].photoUri = "";

      const result = await renderVideo(review);

      // Should skip invalid clips or fail gracefully
      expect(result.success).toBe(false);
    });

    it("handles special characters in file paths", async () => {
      const review = createMockReview(2);
      review.clips[0].photoUri = "file:///photos/baby's first photo (1).jpg";

      const result = await renderVideo(review);

      expect(result.success).toBe(true);
    });
  });
});
