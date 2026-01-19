/**
 * Tests for AI Milestone Detection Service (AIDETECT-001)
 */

import {
  detectMilestonesFromImage,
  detectMilestonesFromImages,
  isHighConfidence,
  type MilestoneSuggestion,
} from "@/services/milestone-detection";

// Mock the image-analysis service
jest.mock("@/services/image-analysis", () => ({
  analyzeImage: jest.fn(),
}));

import { analyzeImage } from "@/services/image-analysis";

const mockAnalyzeImage = analyzeImage as jest.MockedFunction<
  typeof analyzeImage
>;

describe("milestone-detection service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("detectMilestonesFromImage", () => {
    it("returns empty suggestions for empty URI", async () => {
      const result = await detectMilestonesFromImage("");
      expect(result.suggestions).toHaveLength(0);
      expect(result.error).toBe("Invalid image URI");
    });

    it("suggests first_steps milestone when walking detected", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: ["walking", "toddler", "outdoor"],
        labelsWithConfidence: [
          { label: "walking", confidence: 0.9 },
          { label: "toddler", confidence: 0.85 },
          { label: "outdoor", confidence: 0.7 },
        ],
      });

      const result = await detectMilestonesFromImage(
        "file:///test/walking.jpg",
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].templateId).toBe("first_steps");
      expect(result.suggestions[0].confidence).toBeGreaterThan(0.5);
    });

    it("suggests birthday/zhua_zhou milestone when cake/birthday detected", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: ["birthday", "cake", "celebration"],
        labelsWithConfidence: [
          { label: "birthday", confidence: 0.95 },
          { label: "cake", confidence: 0.9 },
          { label: "celebration", confidence: 0.8 },
        ],
      });

      const result = await detectMilestonesFromImage(
        "file:///test/birthday.jpg",
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      const templateIds = result.suggestions.map((s) => s.templateId);
      expect(templateIds).toContain("zhua_zhou");
    });

    it("suggests first_smile milestone when smiling detected", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: ["smile", "baby", "happy"],
        labelsWithConfidence: [
          { label: "smile", confidence: 0.88 },
          { label: "baby", confidence: 0.92 },
          { label: "happy", confidence: 0.75 },
        ],
      });

      const result = await detectMilestonesFromImage("file:///test/smile.jpg");

      expect(result.suggestions.length).toBeGreaterThan(0);
      const templateIds = result.suggestions.map((s) => s.templateId);
      expect(templateIds).toContain("first_smile");
    });

    it("returns no suggestions when no milestone labels detected", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: ["photo", "image", "moment"],
        labelsWithConfidence: [
          { label: "photo", confidence: 0.95 },
          { label: "image", confidence: 0.9 },
          { label: "moment", confidence: 0.85 },
        ],
      });

      const result = await detectMilestonesFromImage(
        "file:///test/generic.jpg",
      );

      expect(result.suggestions).toHaveLength(0);
      expect(result.imageLabels).toEqual(["photo", "image", "moment"]);
    });

    it("passes through image analysis errors", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: [],
        labelsWithConfidence: [],
        error: "Network error",
      });

      const result = await detectMilestonesFromImage("file:///test/image.jpg");

      expect(result.suggestions).toHaveLength(0);
      expect(result.error).toBe("Network error");
    });

    it("limits suggestions to top 3", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: [
          "walking",
          "smile",
          "laughing",
          "birthday",
          "cake",
          "celebration",
        ],
        labelsWithConfidence: [
          { label: "walking", confidence: 0.9 },
          { label: "smile", confidence: 0.88 },
          { label: "laughing", confidence: 0.85 },
          { label: "birthday", confidence: 0.82 },
          { label: "cake", confidence: 0.8 },
          { label: "celebration", confidence: 0.75 },
        ],
      });

      const result = await detectMilestonesFromImage(
        "file:///test/multiple.jpg",
      );

      expect(result.suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe("detectMilestonesFromImages", () => {
    it("returns empty for empty array", async () => {
      const result = await detectMilestonesFromImages([]);
      expect(result.suggestions).toHaveLength(0);
      expect(result.imageLabels).toHaveLength(0);
    });

    it("combines labels from multiple images", async () => {
      mockAnalyzeImage
        .mockResolvedValueOnce({
          labels: ["walking", "toddler"],
          labelsWithConfidence: [
            { label: "walking", confidence: 0.9 },
            { label: "toddler", confidence: 0.85 },
          ],
        })
        .mockResolvedValueOnce({
          labels: ["smile", "baby"],
          labelsWithConfidence: [
            { label: "smile", confidence: 0.88 },
            { label: "baby", confidence: 0.92 },
          ],
        });

      const result = await detectMilestonesFromImages([
        "file:///test/1.jpg",
        "file:///test/2.jpg",
      ]);

      expect(result.imageLabels).toContain("walking");
      expect(result.imageLabels).toContain("smile");
    });

    it("deduplicates suggestions keeping highest confidence", async () => {
      mockAnalyzeImage
        .mockResolvedValueOnce({
          labels: ["smile"],
          labelsWithConfidence: [{ label: "smile", confidence: 0.7 }],
        })
        .mockResolvedValueOnce({
          labels: ["smile", "happy"],
          labelsWithConfidence: [
            { label: "smile", confidence: 0.9 },
            { label: "happy", confidence: 0.85 },
          ],
        });

      const result = await detectMilestonesFromImages([
        "file:///test/1.jpg",
        "file:///test/2.jpg",
      ]);

      const smileSuggestions = result.suggestions.filter(
        (s) => s.templateId === "first_smile",
      );
      expect(smileSuggestions).toHaveLength(1);
      // Should keep the higher confidence one
      expect(smileSuggestions[0].confidence).toBeGreaterThan(0.5);
    });
  });

  // AIDETECT-002: Milestone detection accuracy tests
  describe("AIDETECT-002 accuracy", () => {
    it("suggests first_solid_food milestone when eating solid food detected", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: ["eating", "baby", "food", "high chair"],
        labelsWithConfidence: [
          { label: "eating", confidence: 0.9 },
          { label: "baby", confidence: 0.88 },
          { label: "food", confidence: 0.85 },
          { label: "high chair", confidence: 0.8 },
        ],
      });

      const result = await detectMilestonesFromImage(
        "file:///test/solid-food.jpg",
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      const templateIds = result.suggestions.map((s) => s.templateId);
      expect(templateIds).toContain("first_solid_food");
    });

    it("suggests first_birthday milestone when cake and birthday detected", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: ["birthday", "cake", "baby", "celebration"],
        labelsWithConfidence: [
          { label: "birthday", confidence: 0.95 },
          { label: "cake", confidence: 0.92 },
          { label: "baby", confidence: 0.88 },
          { label: "celebration", confidence: 0.85 },
        ],
      });

      const result = await detectMilestonesFromImage(
        "file:///test/first-birthday.jpg",
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      const templateIds = result.suggestions.map((s) => s.templateId);
      expect(templateIds).toContain("first_birthday");
    });

    it("suggests first_swim milestone when swimming pool detected", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: ["swimming", "pool", "baby", "water"],
        labelsWithConfidence: [
          { label: "swimming", confidence: 0.9 },
          { label: "pool", confidence: 0.88 },
          { label: "baby", confidence: 0.85 },
          { label: "water", confidence: 0.8 },
        ],
      });

      const result = await detectMilestonesFromImage(
        "file:///test/first-swim.jpg",
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      const templateIds = result.suggestions.map((s) => s.templateId);
      expect(templateIds).toContain("first_swim");
    });

    it("suggests first_swim for splash label", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: ["splash", "baby", "fun"],
        labelsWithConfidence: [
          { label: "splash", confidence: 0.85 },
          { label: "baby", confidence: 0.9 },
          { label: "fun", confidence: 0.7 },
        ],
      });

      const result = await detectMilestonesFromImage("file:///test/splash.jpg");

      expect(result.suggestions.length).toBeGreaterThan(0);
      const templateIds = result.suggestions.map((s) => s.templateId);
      expect(templateIds).toContain("first_swim");
    });

    it("suggests first_solid_food for puree/cereal labels", async () => {
      mockAnalyzeImage.mockResolvedValue({
        labels: ["puree", "baby", "feeding"],
        labelsWithConfidence: [
          { label: "puree", confidence: 0.88 },
          { label: "baby", confidence: 0.92 },
          { label: "feeding", confidence: 0.85 },
        ],
      });

      const result = await detectMilestonesFromImage("file:///test/puree.jpg");

      expect(result.suggestions.length).toBeGreaterThan(0);
      const templateIds = result.suggestions.map((s) => s.templateId);
      expect(templateIds).toContain("first_solid_food");
    });
  });

  describe("isHighConfidence", () => {
    it("returns true for confidence >= 0.75", () => {
      const suggestion: MilestoneSuggestion = {
        templateId: "first_steps",
        template: {
          id: "first_steps",
          title: "First Steps",
          description: "Baby's first steps",
          culturalTradition: "universal",
        },
        confidence: 0.8,
        matchedLabels: ["walking"],
      };
      expect(isHighConfidence(suggestion)).toBe(true);
    });

    it("returns false for confidence < 0.75", () => {
      const suggestion: MilestoneSuggestion = {
        templateId: "first_steps",
        template: {
          id: "first_steps",
          title: "First Steps",
          description: "Baby's first steps",
          culturalTradition: "universal",
        },
        confidence: 0.6,
        matchedLabels: ["walking"],
      };
      expect(isHighConfidence(suggestion)).toBe(false);
    });
  });
});
