/**
 * @jest-environment jsdom
 */

import {
  getDirectUploadUrl,
  uploadVideo,
  getVideoMetadata,
  getVideoThumbnailUrl,
  getVideoPlaybackUrl,
  deleteVideo,
  isCloudflareStreamUrl,
  extractVideoIdFromUrl,
  clearMockVideos,
} from "@/services/cloudflare-stream";
import * as FileSystem from "expo-file-system";

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  getInfoAsync: jest.fn(),
  createUploadTask: jest.fn(),
}));

describe("Cloudflare Stream Service", () => {
  beforeEach(() => {
    clearMockVideos();
    jest.clearAllMocks();
  });

  describe("getDirectUploadUrl", () => {
    it("should return upload URL and uid in mock mode", async () => {
      const result = await getDirectUploadUrl(120); // 2 minutes

      expect(result.success).toBe(true);
      expect(result.data?.uploadUrl).toMatch(
        /mock-upload\.cloudflarestream\.com/,
      );
      expect(result.data?.uid).toMatch(/mock-video-\d+/);
    });

    it("should accept metadata parameter", async () => {
      const result = await getDirectUploadUrl(120, { childId: "child-1" });

      expect(result.success).toBe(true);
      expect(result.data?.uid).toBeDefined();
    });

    it("should generate unique UIDs for each request", async () => {
      const result1 = await getDirectUploadUrl(120);
      const result2 = await getDirectUploadUrl(120);

      expect(result1.data?.uid).not.toBe(result2.data?.uid);
    });
  });

  describe("uploadVideo", () => {
    beforeEach(() => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1000000,
      });
    });

    it("should upload video and return uid", async () => {
      const result = await uploadVideo(
        "file:///path/to/video.mp4",
        "https://mock-upload.cloudflarestream.com/mock-video-1",
      );

      expect(result.success).toBe(true);
      expect(result.data?.uid).toBe("mock-video-1");
    });

    it("should report upload progress", async () => {
      const progressUpdates: number[] = [];

      await uploadVideo(
        "file:///path/to/video.mp4",
        "https://mock-upload.cloudflarestream.com/mock-video-2",
        (progress) => {
          progressUpdates.push(progress.percentage);
        },
      );

      // Should receive multiple progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      // Final update should be 100%
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it("should store video metadata after upload", async () => {
      await uploadVideo(
        "file:///path/to/video.mp4",
        "https://mock-upload.cloudflarestream.com/mock-video-3",
      );

      const metadata = await getVideoMetadata("mock-video-3");

      expect(metadata.success).toBe(true);
      expect(metadata.data?.status.state).toBe("ready");
      expect(metadata.data?.thumbnail).toContain("mock-video-3");
    });
  });

  describe("getVideoMetadata", () => {
    it("should return metadata for uploaded video", async () => {
      // First upload a video
      await uploadVideo(
        "file:///path/to/video.mp4",
        "https://mock-upload.cloudflarestream.com/test-video",
      );

      const result = await getVideoMetadata("test-video");

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        uid: "test-video",
        status: { state: "ready" },
      });
      expect(result.data?.playback.hls).toContain("test-video");
      expect(result.data?.playback.dash).toContain("test-video");
    });

    it("should return mock metadata for unknown video ids", async () => {
      const result = await getVideoMetadata("unknown-video-id");

      expect(result.success).toBe(true);
      expect(result.data?.uid).toBe("unknown-video-id");
      expect(result.data?.status.state).toBe("ready");
    });
  });

  describe("getVideoThumbnailUrl", () => {
    it("should return thumbnail URL for video id", () => {
      const url = getVideoThumbnailUrl("video-123");

      expect(url).toContain("video-123");
      expect(url).toContain("thumbnail");
      expect(url).toMatch(/\.jpg$/);
    });

    it("should support timestamp parameter", () => {
      const url = getVideoThumbnailUrl("video-123", 5);

      // Mock mode doesn't use timestamp in URL
      expect(url).toContain("video-123");
    });
  });

  describe("getVideoPlaybackUrl", () => {
    it("should return HLS playback URL", () => {
      const url = getVideoPlaybackUrl("video-456");

      expect(url).toContain("video-456");
      expect(url).toContain("m3u8");
    });
  });

  describe("deleteVideo", () => {
    it("should delete video successfully", async () => {
      // Upload first
      await uploadVideo(
        "file:///path/to/video.mp4",
        "https://mock-upload.cloudflarestream.com/to-delete",
      );

      // Verify it exists
      const beforeDelete = await getVideoMetadata("to-delete");
      expect(beforeDelete.success).toBe(true);

      // Delete
      const result = await deleteVideo("to-delete");
      expect(result.success).toBe(true);
    });
  });

  describe("URL utilities", () => {
    describe("isCloudflareStreamUrl", () => {
      it("should return true for Cloudflare Stream URLs", () => {
        expect(
          isCloudflareStreamUrl(
            "https://customer-abc.cloudflarestream.com/video-1/manifest/video.m3u8",
          ),
        ).toBe(true);
        expect(
          isCloudflareStreamUrl(
            "https://mock-cdn.cloudflarestream.com/video-1/thumbnails/thumbnail.jpg",
          ),
        ).toBe(true);
      });

      it("should return false for non-Cloudflare URLs", () => {
        expect(isCloudflareStreamUrl("file:///path/to/video.mp4")).toBe(false);
        expect(isCloudflareStreamUrl("https://youtube.com/watch?v=abc")).toBe(
          false,
        );
      });
    });

    describe("extractVideoIdFromUrl", () => {
      it("should extract video ID from Cloudflare Stream URL", () => {
        expect(
          extractVideoIdFromUrl(
            "https://customer-abc.cloudflarestream.com/video-123/manifest/video.m3u8",
          ),
        ).toBe("video-123");
      });

      it("should return null for invalid URLs", () => {
        expect(
          extractVideoIdFromUrl("https://youtube.com/watch?v=abc"),
        ).toBeNull();
        expect(extractVideoIdFromUrl("file:///path/to/video.mp4")).toBeNull();
      });
    });
  });

  describe("clearMockVideos", () => {
    it("should reset mock video storage and counter", async () => {
      // Upload some videos
      await uploadVideo(
        "file:///a.mp4",
        "https://mock-upload.cloudflarestream.com/v1",
      );
      await uploadVideo(
        "file:///b.mp4",
        "https://mock-upload.cloudflarestream.com/v2",
      );

      // Clear
      clearMockVideos();

      // Get new upload URL - should restart from 1
      const result = await getDirectUploadUrl(60);
      expect(result.data?.uid).toBe("mock-video-1");
    });
  });
});
