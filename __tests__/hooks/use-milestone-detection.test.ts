/**
 * Tests for useMilestoneDetection hook (AIDETECT-001)
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useMilestoneDetection } from "@/hooks/use-milestone-detection";

// Mock the milestone-detection service
jest.mock("@/services/milestone-detection", () => ({
  detectMilestonesFromImages: jest.fn(),
}));

import { detectMilestonesFromImages } from "@/services/milestone-detection";

const mockDetect = detectMilestonesFromImages as jest.MockedFunction<
  typeof detectMilestonesFromImages
>;

describe("useMilestoneDetection hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts with initial state", () => {
    const { result } = renderHook(() => useMilestoneDetection());

    expect(result.current.isDetecting).toBe(false);
    expect(result.current.suggestions).toHaveLength(0);
    expect(result.current.imageLabels).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it("handles empty input", async () => {
    const { result } = renderHook(() => useMilestoneDetection());

    await act(async () => {
      await result.current.detectMilestones([]);
    });

    expect(result.current.suggestions).toHaveLength(0);
    expect(mockDetect).not.toHaveBeenCalled();
  });

  it("detects milestones and updates state", async () => {
    mockDetect.mockResolvedValue({
      suggestions: [
        {
          templateId: "first_steps",
          template: {
            id: "first_steps",
            title: "First Steps",
            description: "Baby's first steps",
            culturalTradition: "universal",
          },
          confidence: 0.85,
          matchedLabels: ["walking"],
        },
      ],
      imageLabels: ["walking", "toddler"],
    });

    const { result } = renderHook(() => useMilestoneDetection());

    await act(async () => {
      await result.current.detectMilestones(["file:///test.jpg"]);
    });

    await waitFor(() => {
      expect(result.current.isDetecting).toBe(false);
    });

    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].templateId).toBe("first_steps");
    expect(result.current.imageLabels).toContain("walking");
  });

  it("handles detection errors", async () => {
    mockDetect.mockResolvedValue({
      suggestions: [],
      imageLabels: [],
      error: "Analysis failed",
    });

    const { result } = renderHook(() => useMilestoneDetection());

    await act(async () => {
      await result.current.detectMilestones(["file:///test.jpg"]);
    });

    expect(result.current.error).toBe("Analysis failed");
    expect(result.current.suggestions).toHaveLength(0);
  });

  it("handles thrown errors", async () => {
    mockDetect.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMilestoneDetection());

    await act(async () => {
      await result.current.detectMilestones(["file:///test.jpg"]);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.suggestions).toHaveLength(0);
  });

  it("dismisses suggestions", async () => {
    mockDetect.mockResolvedValue({
      suggestions: [
        {
          templateId: "first_steps",
          template: {
            id: "first_steps",
            title: "First Steps",
            description: "Baby's first steps",
            culturalTradition: "universal",
          },
          confidence: 0.85,
          matchedLabels: ["walking"],
        },
        {
          templateId: "first_smile",
          template: {
            id: "first_smile",
            title: "First Smile",
            description: "Baby's first smile",
            culturalTradition: "universal",
          },
          confidence: 0.75,
          matchedLabels: ["smile"],
        },
      ],
      imageLabels: ["walking", "smile"],
    });

    const { result } = renderHook(() => useMilestoneDetection());

    await act(async () => {
      await result.current.detectMilestones(["file:///test.jpg"]);
    });

    expect(result.current.suggestions).toHaveLength(2);

    act(() => {
      result.current.dismissSuggestion("first_steps");
    });

    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].templateId).toBe("first_smile");
  });

  it("resets state", async () => {
    mockDetect.mockResolvedValue({
      suggestions: [
        {
          templateId: "first_steps",
          template: {
            id: "first_steps",
            title: "First Steps",
            description: "Baby's first steps",
            culturalTradition: "universal",
          },
          confidence: 0.85,
          matchedLabels: ["walking"],
        },
      ],
      imageLabels: ["walking"],
    });

    const { result } = renderHook(() => useMilestoneDetection());

    await act(async () => {
      await result.current.detectMilestones(["file:///test.jpg"]);
    });

    expect(result.current.suggestions).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isDetecting).toBe(false);
    expect(result.current.suggestions).toHaveLength(0);
    expect(result.current.imageLabels).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it("returns detection result from detectMilestones", async () => {
    mockDetect.mockResolvedValue({
      suggestions: [
        {
          templateId: "first_steps",
          template: {
            id: "first_steps",
            title: "First Steps",
            description: "Baby's first steps",
            culturalTradition: "universal",
          },
          confidence: 0.85,
          matchedLabels: ["walking"],
        },
      ],
      imageLabels: ["walking"],
    });

    const { result } = renderHook(() => useMilestoneDetection());

    let detectionResult;
    await act(async () => {
      detectionResult = await result.current.detectMilestones([
        "file:///test.jpg",
      ]);
    });

    expect(detectionResult).toBeDefined();
    expect(detectionResult!.suggestions).toHaveLength(1);
    expect(detectionResult!.imageLabels).toContain("walking");
  });
});
