/**
 * Tests for useImageAnalysis hook (SEARCH-002)
 */

import { renderHook, act } from "@testing-library/react-native";
import { useImageAnalysis } from "@/hooks/use-image-analysis";

describe("useImageAnalysis hook", () => {
  it("should initialize with idle state", () => {
    const { result } = renderHook(() => useImageAnalysis());

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.labels).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should analyze a single image", async () => {
    const { result } = renderHook(() => useImageAnalysis());

    await act(async () => {
      await result.current.analyzeImages(["file:///photo/beach-sunset.jpg"]);
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.labels.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it("should analyze multiple images and combine labels", async () => {
    const { result } = renderHook(() => useImageAnalysis());

    await act(async () => {
      await result.current.analyzeImages([
        "file:///photo/beach-sunset.jpg",
        "file:///photo/baby-smile.jpg",
      ]);
    });

    expect(result.current.isAnalyzing).toBe(false);
    // Should have combined labels from both images (deduplicated)
    expect(result.current.labels.length).toBeGreaterThan(0);
  });

  it("should handle errors gracefully", async () => {
    const { result } = renderHook(() => useImageAnalysis());

    await act(async () => {
      await result.current.analyzeImages([""]); // Empty URI should error
    });

    expect(result.current.isAnalyzing).toBe(false);
    // Empty array because of error, but should not throw
    expect(Array.isArray(result.current.labels)).toBe(true);
  });

  it("should reset state with reset function", async () => {
    const { result } = renderHook(() => useImageAnalysis());

    // First analyze something
    await act(async () => {
      await result.current.analyzeImages(["file:///photo/beach.jpg"]);
    });

    expect(result.current.labels.length).toBeGreaterThan(0);

    // Then reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.labels).toEqual([]);
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle empty image array", async () => {
    const { result } = renderHook(() => useImageAnalysis());

    await act(async () => {
      await result.current.analyzeImages([]);
    });

    expect(result.current.labels).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
