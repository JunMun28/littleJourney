/**
 * AI Milestone Detection Service (AIDETECT-001)
 *
 * Analyzes images and suggests relevant developmental milestones.
 * Uses image analysis service to detect scene content, then maps
 * detected labels to milestone templates.
 *
 * Integration with real AI would use:
 * - OpenAI Vision API
 * - Google Cloud Vision
 * - Cloudflare Workers AI
 */

import {
  analyzeImage,
  type ImageAnalysisResult,
} from "@/services/image-analysis";
import {
  MILESTONE_TEMPLATES,
  type MilestoneTemplate,
} from "@/contexts/milestone-context";

// Mapping of image labels to milestone template IDs
// Each key is a label that might be detected in an image
// Values are template IDs that should be suggested when label is found
const LABEL_TO_MILESTONE_MAP: Record<string, string[]> = {
  // First Steps
  walking: ["first_steps"],
  "first steps": ["first_steps"],
  standing: ["first_steps"],
  toddler: ["first_steps"],

  // First Solid Food (AIDETECT-002)
  eating: ["first_solid_food", "annaprashan", "first_hawker_food"],
  food: ["first_solid_food", "annaprashan", "first_hawker_food"],
  feeding: ["first_solid_food", "annaprashan"],
  "solid food": ["first_solid_food", "annaprashan"],
  "high chair": ["first_solid_food", "annaprashan"],
  spoon: ["first_solid_food", "annaprashan"],
  puree: ["first_solid_food"],
  mashed: ["first_solid_food"],
  cereal: ["first_solid_food"],
  "baby food": ["first_solid_food"],
  hawker: ["first_hawker_food"],

  // First Birthday (AIDETECT-002)
  birthday: ["first_birthday", "zhua_zhou"],
  cake: ["first_birthday", "zhua_zhou"],
  candles: ["first_birthday", "zhua_zhou"],
  party: ["first_birthday", "zhua_zhou"],
  celebration: ["full_month", "hundred_days", "first_birthday", "zhua_zhou"],
  "one year": ["first_birthday"],
  "1 year": ["first_birthday"],
  "first birthday": ["first_birthday"],

  // First Swim (AIDETECT-002)
  swimming: ["first_swim"],
  pool: ["first_swim"],
  swim: ["first_swim"],
  "first swim": ["first_swim"],
  swimsuit: ["first_swim"],
  floatie: ["first_swim"],
  "swimming pool": ["first_swim"],
  splash: ["first_swim"],
  water: [],

  // First Smile/Laugh
  smile: ["first_smile"],
  smiling: ["first_smile"],
  happy: ["first_smile", "first_laugh"],
  laughing: ["first_laugh"],
  joy: ["first_smile", "first_laugh"],
  giggling: ["first_laugh"],

  // First Tooth
  tooth: ["first_tooth"],
  teeth: ["first_tooth"],
  dental: ["first_tooth"],

  // First Haircut
  haircut: ["first_haircut"],
  scissors: ["first_haircut"],
  "hair cut": ["first_haircut"],
  barber: ["first_haircut"],

  // School/Education
  school: ["first_day_school"],
  classroom: ["first_day_school"],
  uniform: ["first_day_school"],
  preschool: ["first_day_school"],
  childcare: ["first_day_school"],
  nursery: ["first_day_school"],

  // Singapore Local
  mrt: ["first_mrt_ride"],
  train: ["first_mrt_ride"],
  station: ["first_mrt_ride"],
  zoo: ["first_zoo_visit"],
  animal: ["first_zoo_visit"],
  singapore: [],

  // Cultural celebrations
  "red packet": ["first_lunar_new_year"],
  "ang bao": ["first_lunar_new_year"],
  "chinese new year": ["first_lunar_new_year"],
  deepavali: ["first_deepavali"],
  diwali: ["first_deepavali"],
  "hari raya": ["first_hari_raya"],
  eid: ["first_hari_raya"],

  // Baby basics (generic)
  baby: [],
  infant: [],
  newborn: ["full_month"],
};

// Confidence thresholds
const MIN_CONFIDENCE_FOR_SUGGESTION = 0.5;
const HIGH_CONFIDENCE_THRESHOLD = 0.75;

export interface MilestoneSuggestion {
  templateId: string;
  template: MilestoneTemplate;
  confidence: number;
  matchedLabels: string[];
}

export interface MilestoneDetectionResult {
  suggestions: MilestoneSuggestion[];
  imageLabels: string[];
  error?: string;
}

/**
 * Get milestone template by ID
 */
function getTemplate(templateId: string): MilestoneTemplate | undefined {
  return MILESTONE_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Calculate confidence score based on matched labels
 */
function calculateConfidence(
  matchedLabels: string[],
  totalLabels: number,
  labelConfidences: Map<string, number>,
): number {
  if (matchedLabels.length === 0 || totalLabels === 0) return 0;

  // Base confidence from number of matching labels
  const matchRatio = Math.min(matchedLabels.length / 3, 1); // Cap at 3 matches = 100%

  // Average confidence of matched labels
  let avgConfidence = 0;
  for (const label of matchedLabels) {
    avgConfidence += labelConfidences.get(label) ?? 0.5;
  }
  avgConfidence = avgConfidence / matchedLabels.length;

  // Combined score
  return Math.min(matchRatio * 0.4 + avgConfidence * 0.6, 1);
}

/**
 * Detect potential milestones from an image URI.
 *
 * @param imageUri - The image to analyze
 * @returns Detection result with suggestions
 */
export async function detectMilestonesFromImage(
  imageUri: string,
): Promise<MilestoneDetectionResult> {
  if (!imageUri || imageUri.trim() === "") {
    return {
      suggestions: [],
      imageLabels: [],
      error: "Invalid image URI",
    };
  }

  // Analyze the image
  const analysisResult: ImageAnalysisResult = await analyzeImage(imageUri);

  if (analysisResult.error) {
    return {
      suggestions: [],
      imageLabels: [],
      error: analysisResult.error,
    };
  }

  const labels = analysisResult.labels;
  const labelsWithConfidence = analysisResult.labelsWithConfidence;

  // Build label confidence map
  const labelConfidences = new Map<string, number>();
  for (const { label, confidence } of labelsWithConfidence) {
    labelConfidences.set(label, confidence);
  }

  // Find matching milestones
  const milestoneMatches = new Map<string, string[]>();

  for (const label of labels) {
    const normalizedLabel = label.toLowerCase();
    const matchingTemplateIds = LABEL_TO_MILESTONE_MAP[normalizedLabel];

    if (matchingTemplateIds && matchingTemplateIds.length > 0) {
      for (const templateId of matchingTemplateIds) {
        const existingLabels = milestoneMatches.get(templateId) ?? [];
        if (!existingLabels.includes(normalizedLabel)) {
          milestoneMatches.set(templateId, [
            ...existingLabels,
            normalizedLabel,
          ]);
        }
      }
    }
  }

  // Convert to suggestions with confidence scores
  const suggestions: MilestoneSuggestion[] = [];

  for (const [templateId, matchedLabels] of milestoneMatches) {
    const template = getTemplate(templateId);
    if (!template) continue;

    const confidence = calculateConfidence(
      matchedLabels,
      labels.length,
      labelConfidences,
    );

    if (confidence >= MIN_CONFIDENCE_FOR_SUGGESTION) {
      suggestions.push({
        templateId,
        template,
        confidence,
        matchedLabels,
      });
    }
  }

  // Sort by confidence (highest first)
  suggestions.sort((a, b) => b.confidence - a.confidence);

  // Limit to top 3 suggestions
  const topSuggestions = suggestions.slice(0, 3);

  return {
    suggestions: topSuggestions,
    imageLabels: labels,
  };
}

/**
 * Detect milestones from multiple images.
 * Combines results and deduplicates suggestions.
 *
 * @param imageUris - Array of image URIs to analyze
 * @returns Combined detection result
 */
export async function detectMilestonesFromImages(
  imageUris: string[],
): Promise<MilestoneDetectionResult> {
  if (!imageUris || imageUris.length === 0) {
    return {
      suggestions: [],
      imageLabels: [],
    };
  }

  // Analyze all images in parallel
  const results = await Promise.all(
    imageUris.map((uri) => detectMilestonesFromImage(uri)),
  );

  // Combine labels (unique)
  const allLabels = new Set<string>();
  for (const result of results) {
    for (const label of result.imageLabels) {
      allLabels.add(label);
    }
  }

  // Combine suggestions, keeping highest confidence per template
  const suggestionMap = new Map<string, MilestoneSuggestion>();

  for (const result of results) {
    for (const suggestion of result.suggestions) {
      const existing = suggestionMap.get(suggestion.templateId);
      if (!existing || suggestion.confidence > existing.confidence) {
        // Merge matched labels
        const mergedLabels = existing
          ? [
              ...new Set([
                ...existing.matchedLabels,
                ...suggestion.matchedLabels,
              ]),
            ]
          : suggestion.matchedLabels;

        suggestionMap.set(suggestion.templateId, {
          ...suggestion,
          matchedLabels: mergedLabels,
        });
      }
    }
  }

  // Sort by confidence and take top 3
  const suggestions = Array.from(suggestionMap.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  // Collect any errors
  const errors = results
    .filter((r) => r.error)
    .map((r) => r.error)
    .join("; ");

  return {
    suggestions,
    imageLabels: Array.from(allLabels),
    error: errors || undefined,
  };
}

/**
 * Check if a suggestion has high confidence
 */
export function isHighConfidence(suggestion: MilestoneSuggestion): boolean {
  return suggestion.confidence >= HIGH_CONFIDENCE_THRESHOLD;
}
