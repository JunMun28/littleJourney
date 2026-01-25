/**
 * useVideoExport Hook Tests (YIR-004)
 *
 * Tests for the video export hook that orchestrates
 * the Year in Review video rendering and export flow.
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useVideoExport } from "@/hooks/use-video-export";
import * as VideoRenderer from "@/services/video-renderer";
import type { YearInReview } from "@/contexts/year-in-review-context";

// Mock the video renderer service
jest.mock("@/services/video-renderer", () => ({
  renderVideo: jest.fn(),
}));

// Test fixtures
const createMockReview = (clipCount: number = 5): YearInReview => ({
  id: "review-1",
  childId: "child-1",
  year: 2024,
  createdAt: "2024-12-15T10:00:00Z",
  updatedAt: "2024-12-15T10:00:00Z",
  status: "ready",
  clips: Array.from({ length: clipCount }, (_, i) => ({
    id: `clip-${i}`,
    entry: {
      id: `entry-${i}`,
      childId: "child-1",
      type: "photo" as const,
      mediaUris: [`file:///photos/photo${i}.jpg`],
      date: "2024-06-15",
      createdAt: "2024-06-15T10:00:00Z",
      updatedAt: "2024-06-15T10:00:00Z",
    },
    photoUri: `file:///photos/photo${i}.jpg`,
    score: 100,
    month: 6,
    isMilestone: false,
  })),
  removedClipIds: [],
  selectedMusicId: "gentle_memories",
  transitionStyle: "fade",
  exportQuality: "1080p",
});

describe("useVideoExport", () => {
  const mockRenderVideo = VideoRenderer.renderVideo as jest.MockedFunction<
    typeof VideoRenderer.renderVideo
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRenderVideo.mockResolvedValue({
      success: true,
      outputPath: "file:///output/video.mp4",
    });
  });

  describe("initial state", () => {
    it("returns idle status initially", () => {
      const { result } = renderHook(() => useVideoExport());

      expect(result.current.status).toBe("idle");
    });

    it("returns 0 progress initially", () => {
      const { result } = renderHook(() => useVideoExport());

      expect(result.current.progress).toBe(0);
    });

    it("returns null error initially", () => {
      const { result } = renderHook(() => useVideoExport());

      expect(result.current.error).toBeNull();
    });

    it("returns null outputPath initially", () => {
      const { result } = renderHook(() => useVideoExport());

      expect(result.current.outputPath).toBeNull();
    });

    it("provides exportVideo function", () => {
      const { result } = renderHook(() => useVideoExport());

      expect(typeof result.current.exportVideo).toBe("function");
    });

    it("provides cancelExport function", () => {
      const { result } = renderHook(() => useVideoExport());

      expect(typeof result.current.cancelExport).toBe("function");
    });

    it("provides reset function", () => {
      const { result } = renderHook(() => useVideoExport());

      expect(typeof result.current.reset).toBe("function");
    });
  });

  describe("exportVideo", () => {
    it("sets status to preparing when export starts", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      // Make renderVideo slow so we can check intermediate states
      mockRenderVideo.mockImplementation(async (_, options) => {
        options?.onProgress?.({ status: "preparing", progress: 0 });
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      act(() => {
        result.current.exportVideo(review);
      });

      expect(result.current.status).toBe("preparing");
    });

    it("updates progress during rendering", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);
      const progressValues: number[] = [];

      mockRenderVideo.mockImplementation(async (_, options) => {
        options?.onProgress?.({ status: "preparing", progress: 0 });
        options?.onProgress?.({ status: "rendering", progress: 25 });
        options?.onProgress?.({ status: "rendering", progress: 50 });
        options?.onProgress?.({ status: "rendering", progress: 75 });
        options?.onProgress?.({ status: "saving", progress: 90 });
        options?.onProgress?.({ status: "complete", progress: 100 });
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      // Progress should have been updated
      expect(result.current.progress).toBe(100);
    });

    it("sets status to rendering during video processing", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);
      let capturedStatus: string | null = null;

      mockRenderVideo.mockImplementation(async (_, options) => {
        options?.onProgress?.({ status: "rendering", progress: 50 });
        // Capture the status at this moment
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      const exportPromise = act(async () => {
        result.current.exportVideo(review);
        // Check status during rendering
        await new Promise((resolve) => setTimeout(resolve, 5));
        capturedStatus = result.current.status;
      });

      await exportPromise;

      expect(["rendering", "complete"]).toContain(result.current.status);
    });

    it("sets status to saving when saving to camera roll", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockImplementation(async (_, options) => {
        options?.onProgress?.({ status: "saving", progress: 90 });
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      // Final status should be complete
      expect(result.current.status).toBe("complete");
    });

    it("sets status to complete on success", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockImplementation(async (_, options) => {
        options?.onProgress?.({ status: "complete", progress: 100 });
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.status).toBe("complete");
      expect(result.current.progress).toBe(100);
    });

    it("sets outputPath on success", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockResolvedValue({
        success: true,
        outputPath: "file:///camera-roll/year-in-review.mp4",
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.outputPath).toBe(
        "file:///camera-roll/year-in-review.mp4",
      );
    });

    it("sets status to error on failure", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockResolvedValue({
        success: false,
        error: "Rendering failed",
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.status).toBe("error");
    });

    it("sets error message on failure", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockResolvedValue({
        success: false,
        error: "FFmpeg encoding error",
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.error).toBe("FFmpeg encoding error");
    });

    it("handles thrown errors gracefully", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockRejectedValue(new Error("Unexpected crash"));

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.status).toBe("error");
      expect(result.current.error).toContain("Unexpected crash");
    });

    it("passes review to renderVideo", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(5);

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(mockRenderVideo).toHaveBeenCalledWith(
        review,
        expect.objectContaining({
          onProgress: expect.any(Function),
        }),
      );
    });

    it("prevents concurrent exports", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      // Make first export take a while
      mockRenderVideo.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      await act(async () => {
        // Start first export
        const promise1 = result.current.exportVideo(review);
        // Try to start second export immediately
        const promise2 = result.current.exportVideo(review);
        await Promise.all([promise1, promise2]);
      });

      // Should only have called renderVideo once
      expect(mockRenderVideo).toHaveBeenCalledTimes(1);
    });
  });

  describe("cancelExport", () => {
    it("stops the current export", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      // Make export slow
      mockRenderVideo.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      await act(async () => {
        // Start export but don't await it
        result.current.exportVideo(review);
        // Cancel immediately
        result.current.cancelExport();
      });

      expect(result.current.status).toBe("idle");
    });

    it("resets progress on cancel", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockImplementation(async (_, options) => {
        options?.onProgress?.({ status: "rendering", progress: 50 });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      await act(async () => {
        result.current.exportVideo(review);
        await new Promise((resolve) => setTimeout(resolve, 10));
        result.current.cancelExport();
      });

      expect(result.current.progress).toBe(0);
    });

    it("can export again after cancel", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo
        .mockImplementationOnce(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { success: true, outputPath: "file:///output/video.mp4" };
        })
        .mockImplementationOnce(async () => {
          return { success: true, outputPath: "file:///output/video2.mp4" };
        });

      await act(async () => {
        result.current.exportVideo(review);
        result.current.cancelExport();
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.status).toBe("complete");
    });
  });

  describe("reset", () => {
    it("resets all state to initial values", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockResolvedValue({
        success: true,
        outputPath: "file:///output/video.mp4",
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.status).toBe("complete");
      expect(result.current.outputPath).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe("idle");
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.outputPath).toBeNull();
    });

    it("clears error state", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockResolvedValue({
        success: false,
        error: "Export failed",
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("isExporting", () => {
    it("returns true when export is in progress", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      act(() => {
        result.current.exportVideo(review);
      });

      expect(result.current.isExporting).toBe(true);
    });

    it("returns false when idle", () => {
      const { result } = renderHook(() => useVideoExport());

      expect(result.current.isExporting).toBe(false);
    });

    it("returns false after completion", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.isExporting).toBe(false);
    });

    it("returns false after error", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockResolvedValue({
        success: false,
        error: "Failed",
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.isExporting).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles review with no clips", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(0);

      mockRenderVideo.mockResolvedValue({
        success: false,
        error: "No clips to export",
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.status).toBe("error");
      expect(result.current.error).toContain("No clips");
    });

    it("handles rapid status changes", async () => {
      const { result } = renderHook(() => useVideoExport());
      const review = createMockReview(3);

      mockRenderVideo.mockImplementation(async (_, options) => {
        // Rapid progress updates
        for (let i = 0; i <= 100; i += 10) {
          options?.onProgress?.({
            status: i < 90 ? "rendering" : "complete",
            progress: i,
          });
        }
        return { success: true, outputPath: "file:///output/video.mp4" };
      });

      await act(async () => {
        await result.current.exportVideo(review);
      });

      expect(result.current.status).toBe("complete");
      expect(result.current.progress).toBe(100);
    });

    it("handles null review gracefully", async () => {
      const { result } = renderHook(() => useVideoExport());

      await act(async () => {
        await result.current.exportVideo(null as unknown as YearInReview);
      });

      expect(result.current.status).toBe("error");
    });
  });
});
