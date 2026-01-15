/**
 * Tests for AI Image Analysis Service (SEARCH-002)
 *
 * Service analyzes images and returns semantic labels for search
 */

import {
  analyzeImage,
  analyzeImageBatch,
  getImageLabels,
  ImageAnalysisResult,
  IMAGE_ANALYSIS_CONFIG,
} from "@/services/image-analysis";

describe("Image Analysis Service", () => {
  describe("analyzeImage", () => {
    it("should return labels for a valid image URI", async () => {
      const result = await analyzeImage("file:///path/to/beach-photo.jpg");

      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(Array.isArray(result.labels)).toBe(true);
      expect(result.labels.length).toBeGreaterThan(0);
    });

    it("should return labels as lowercase strings", async () => {
      const result = await analyzeImage("file:///path/to/photo.jpg");

      result.labels.forEach((label) => {
        expect(typeof label).toBe("string");
        expect(label).toBe(label.toLowerCase());
      });
    });

    it("should include confidence scores for each label", async () => {
      const result = await analyzeImage("file:///path/to/photo.jpg");

      expect(result.labelsWithConfidence).toBeDefined();
      expect(result.labelsWithConfidence.length).toBe(result.labels.length);
      result.labelsWithConfidence.forEach((item) => {
        expect(item.label).toBeDefined();
        expect(typeof item.confidence).toBe("number");
        expect(item.confidence).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeLessThanOrEqual(1);
      });
    });

    it("should return error for empty URI", async () => {
      const result = await analyzeImage("");

      expect(result.error).toBeDefined();
      expect(result.labels).toEqual([]);
    });

    it("should handle analysis errors gracefully", async () => {
      // Force error by using invalid URI scheme in non-mock mode
      const originalUseMock = IMAGE_ANALYSIS_CONFIG.useMock;
      IMAGE_ANALYSIS_CONFIG.useMock = false;

      const result = await analyzeImage("invalid://bad-uri");

      expect(result.error).toBeDefined();
      expect(result.labels).toEqual([]);

      IMAGE_ANALYSIS_CONFIG.useMock = originalUseMock;
    });
  });

  describe("analyzeImageBatch", () => {
    it("should analyze multiple images in parallel", async () => {
      const uris = [
        "file:///path/to/photo1.jpg",
        "file:///path/to/photo2.jpg",
        "file:///path/to/photo3.jpg",
      ];

      const results = await analyzeImageBatch(uris);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.labels).toBeDefined();
        expect(Array.isArray(result.labels)).toBe(true);
      });
    });

    it("should return empty array for empty input", async () => {
      const results = await analyzeImageBatch([]);

      expect(results).toEqual([]);
    });

    it("should handle partial failures", async () => {
      const uris = ["file:///valid.jpg", "", "file:///another-valid.jpg"];

      const results = await analyzeImageBatch(uris);

      expect(results).toHaveLength(3);
      expect(results[0].labels.length).toBeGreaterThan(0);
      expect(results[1].error).toBeDefined();
      expect(results[2].labels.length).toBeGreaterThan(0);
    });
  });

  describe("getImageLabels (convenience function)", () => {
    it("should return just the labels array", async () => {
      const labels = await getImageLabels("file:///path/to/photo.jpg");

      expect(Array.isArray(labels)).toBe(true);
      expect(labels.length).toBeGreaterThan(0);
      labels.forEach((label) => {
        expect(typeof label).toBe("string");
      });
    });

    it("should return empty array on error", async () => {
      const labels = await getImageLabels("");

      expect(labels).toEqual([]);
    });
  });

  describe("mock mode", () => {
    it("should generate contextual labels based on filename in mock mode", async () => {
      // Mock mode generates labels based on filename hints
      const beachResult = await analyzeImage("file:///photos/beach-sunset.jpg");
      const babyResult = await analyzeImage("file:///photos/baby-smile.jpg");
      const parkResult = await analyzeImage("file:///photos/park-picnic.jpg");

      // Beach-related filename should include beach-related labels
      expect(
        beachResult.labels.some(
          (l) =>
            l.includes("beach") ||
            l.includes("sunset") ||
            l.includes("outdoor"),
        ),
      ).toBe(true);

      // Baby-related filename should include baby-related labels
      expect(
        babyResult.labels.some(
          (l) =>
            l.includes("baby") || l.includes("smile") || l.includes("face"),
        ),
      ).toBe(true);

      // Park-related filename should include park-related labels
      expect(
        parkResult.labels.some(
          (l) =>
            l.includes("park") || l.includes("outdoor") || l.includes("picnic"),
        ),
      ).toBe(true);
    });

    it("should return generic labels for filenames without hints", async () => {
      const result = await analyzeImage("file:///photos/IMG_1234.jpg");

      // Should still return some labels
      expect(result.labels.length).toBeGreaterThan(0);
    });
  });
});
