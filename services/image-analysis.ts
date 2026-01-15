/**
 * AI Image Analysis Service (SEARCH-002)
 *
 * Analyzes images and returns semantic labels for search.
 * Uses mock implementation in development, ready for real AI backend integration.
 *
 * Real implementation would call:
 * - Cloudflare Workers AI (e.g., @cf/microsoft/resnet-50)
 * - Google Cloud Vision API
 * - AWS Rekognition
 */

import { getAuthHeaders } from "./auth-api";

// Service configuration
export const IMAGE_ANALYSIS_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "https://api.littlejourney.sg",
  useMock: process.env.EXPO_PUBLIC_USE_MOCK_API !== "false", // Default to mock
  maxLabels: 10, // Maximum labels to return per image
  minConfidence: 0.5, // Minimum confidence threshold (0-1)
};

// Types
export interface LabelWithConfidence {
  label: string;
  confidence: number;
}

export interface ImageAnalysisResult {
  labels: string[];
  labelsWithConfidence: LabelWithConfidence[];
  error?: string;
}

// Common label categories for mock generation
const MOCK_LABEL_CATEGORIES = {
  // People & faces
  person: ["person", "face", "portrait", "people", "human"],
  baby: ["baby", "infant", "child", "toddler", "kid", "newborn"],
  family: ["family", "group", "together", "gathering"],
  smile: ["smile", "happy", "joy", "laughing", "expression"],

  // Outdoor scenes
  outdoor: ["outdoor", "outside", "nature", "scenery"],
  beach: ["beach", "ocean", "sea", "sand", "water", "waves", "coast"],
  park: ["park", "grass", "tree", "garden", "greenery", "lawn"],
  sunset: ["sunset", "sunrise", "sky", "golden hour", "dusk"],
  mountain: ["mountain", "hill", "hiking", "trail", "peak"],

  // Indoor scenes
  indoor: ["indoor", "inside", "room", "home", "house"],
  kitchen: ["kitchen", "cooking", "food", "meal"],
  bedroom: ["bedroom", "bed", "sleep", "nursery"],
  birthday: ["birthday", "cake", "celebration", "party", "candles"],

  // Activities
  playing: ["playing", "play", "toy", "fun", "game"],
  eating: ["eating", "food", "meal", "feeding", "snack"],
  sleeping: ["sleeping", "asleep", "nap", "rest"],
  walking: ["walking", "first steps", "standing", "milestone"],
  swimming: ["swimming", "pool", "water", "splash"],
  picnic: ["picnic", "blanket", "outdoor eating", "basket"],

  // Objects
  toy: ["toy", "stuffed animal", "teddy bear", "doll", "blocks"],
  book: ["book", "reading", "story", "storytime"],
  food: ["food", "fruit", "vegetable", "snack", "meal"],
  animal: ["animal", "pet", "dog", "cat", "bird"],
};

// Extract filename from URI
function getFilename(uri: string): string {
  const parts = uri.split("/");
  return parts[parts.length - 1]?.toLowerCase() || "";
}

// Generate mock labels based on filename hints
function generateMockLabels(uri: string): LabelWithConfidence[] {
  const filename = getFilename(uri);
  const labels: LabelWithConfidence[] = [];

  // Check filename for keyword hints and add relevant labels
  for (const [category, categoryLabels] of Object.entries(
    MOCK_LABEL_CATEGORIES,
  )) {
    if (filename.includes(category)) {
      // Add 2-4 labels from this category with varying confidence
      const numLabels = Math.min(
        categoryLabels.length,
        2 + Math.floor(Math.random() * 3),
      );
      for (let i = 0; i < numLabels; i++) {
        labels.push({
          label: categoryLabels[i],
          confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0
        });
      }
    }
  }

  // If no hints found, add some generic labels
  if (labels.length === 0) {
    // Add some common photo labels
    labels.push(
      { label: "photo", confidence: 0.95 },
      { label: "image", confidence: 0.9 },
      { label: "moment", confidence: 0.85 },
    );

    // Randomly add some contextual labels (50% chance each)
    if (Math.random() > 0.5) {
      labels.push({ label: "indoor", confidence: 0.6 + Math.random() * 0.3 });
    } else {
      labels.push({ label: "outdoor", confidence: 0.6 + Math.random() * 0.3 });
    }

    if (Math.random() > 0.5) {
      labels.push({ label: "person", confidence: 0.7 + Math.random() * 0.2 });
    }
  }

  // Sort by confidence and limit to maxLabels
  return labels
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, IMAGE_ANALYSIS_CONFIG.maxLabels);
}

// Simulate network delay
async function simulateDelay(ms: number = 200): Promise<void> {
  if (IMAGE_ANALYSIS_CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Analyze a single image and return semantic labels.
 */
export async function analyzeImage(
  imageUri: string,
): Promise<ImageAnalysisResult> {
  // Validate input
  if (!imageUri || imageUri.trim() === "") {
    return {
      labels: [],
      labelsWithConfidence: [],
      error: "Invalid image URI: empty string",
    };
  }

  await simulateDelay();

  // Mock implementation
  if (IMAGE_ANALYSIS_CONFIG.useMock) {
    const labelsWithConfidence = generateMockLabels(imageUri);
    return {
      labels: labelsWithConfidence.map((l) => l.label.toLowerCase()),
      labelsWithConfidence: labelsWithConfidence.map((l) => ({
        label: l.label.toLowerCase(),
        confidence: l.confidence,
      })),
    };
  }

  // Real API implementation
  try {
    const response = await fetch(
      `${IMAGE_ANALYSIS_CONFIG.baseUrl}/analyze-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          imageUri,
          maxLabels: IMAGE_ANALYSIS_CONFIG.maxLabels,
          minConfidence: IMAGE_ANALYSIS_CONFIG.minConfidence,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      labels: data.labels || [],
      labelsWithConfidence: data.labelsWithConfidence || [],
    };
  } catch (error) {
    return {
      labels: [],
      labelsWithConfidence: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during analysis",
    };
  }
}

/**
 * Analyze multiple images in parallel.
 */
export async function analyzeImageBatch(
  imageUris: string[],
): Promise<ImageAnalysisResult[]> {
  if (!imageUris || imageUris.length === 0) {
    return [];
  }

  // Analyze all images in parallel
  const results = await Promise.all(imageUris.map((uri) => analyzeImage(uri)));
  return results;
}

/**
 * Convenience function to get just the labels array.
 * Returns empty array on error.
 */
export async function getImageLabels(imageUri: string): Promise<string[]> {
  const result = await analyzeImage(imageUri);
  return result.labels;
}

/**
 * Combine labels from multiple images into a unique set.
 * Useful for entries with multiple photos (carousel).
 */
export async function getLabelsFromImages(
  imageUris: string[],
): Promise<string[]> {
  const results = await analyzeImageBatch(imageUris);

  // Combine all labels into a unique set
  const labelSet = new Set<string>();
  for (const result of results) {
    for (const label of result.labels) {
      labelSet.add(label);
    }
  }

  return Array.from(labelSet);
}
