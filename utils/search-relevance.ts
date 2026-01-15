import type { Entry } from "@/contexts/entry-context";

// Scoring weights for different match types
const SCORE_WEIGHTS = {
  EXACT_CAPTION_MATCH: 100, // Full query matches caption exactly
  CAPTION_START: 50, // Match at the start of caption
  CAPTION_WORD_START: 30, // Match at start of a word in caption
  CAPTION_CONTAINS: 15, // Match anywhere in caption
  TAG_EXACT: 20, // Exact tag match
  TAG_CONTAINS: 10, // Partial tag match
  AI_LABEL_EXACT: 25, // Exact AI label match (SEARCH-002)
  AI_LABEL_CONTAINS: 12, // Partial AI label match (SEARCH-002)
};

/**
 * Calculate relevance score for an entry against a search query.
 * Higher scores indicate more relevant matches.
 */
export function calculateRelevanceScore(entry: Entry, query: string): number {
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    return 0;
  }

  let score = 0;

  // Score caption matches
  const caption = (entry.caption ?? "").toLowerCase();
  if (caption) {
    // Exact match (full caption equals query)
    if (caption === searchTerm) {
      score += SCORE_WEIGHTS.EXACT_CAPTION_MATCH;
    }
    // Match at start of caption
    else if (caption.startsWith(searchTerm)) {
      score += SCORE_WEIGHTS.CAPTION_START;
    }
    // Match at start of a word (word boundary)
    else if (
      new RegExp(`\\b${escapeRegex(searchTerm)}`, "i").test(entry.caption ?? "")
    ) {
      score += SCORE_WEIGHTS.CAPTION_WORD_START;
    }
    // Match anywhere in caption
    else if (caption.includes(searchTerm)) {
      score += SCORE_WEIGHTS.CAPTION_CONTAINS;
    }
  }

  // Score tag matches
  const tags = entry.tags ?? [];
  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    if (tagLower === searchTerm) {
      score += SCORE_WEIGHTS.TAG_EXACT;
    } else if (tagLower.includes(searchTerm)) {
      score += SCORE_WEIGHTS.TAG_CONTAINS;
    }
  }

  // Score AI label matches (SEARCH-002)
  const aiLabels = entry.aiLabels ?? [];
  for (const label of aiLabels) {
    const labelLower = label.toLowerCase();
    if (labelLower === searchTerm) {
      score += SCORE_WEIGHTS.AI_LABEL_EXACT;
    } else if (labelLower.includes(searchTerm)) {
      score += SCORE_WEIGHTS.AI_LABEL_CONTAINS;
    }
  }

  return score;
}

/**
 * Sort entries by relevance to the search query.
 * Returns only entries with non-zero relevance, sorted by score descending.
 * Maintains original order for entries with equal scores (stable sort).
 */
export function sortByRelevance(entries: Entry[], query: string): Entry[] {
  const searchTerm = query.trim();

  if (!searchTerm) {
    return [];
  }

  // Calculate scores and filter out zero-relevance entries
  const scoredEntries = entries
    .map((entry, index) => ({
      entry,
      score: calculateRelevanceScore(entry, searchTerm),
      originalIndex: index, // For stable sort
    }))
    .filter(({ score }) => score > 0);

  // Sort by score descending, maintaining original order for ties (stable sort)
  scoredEntries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.originalIndex - b.originalIndex;
  });

  return scoredEntries.map(({ entry }) => entry);
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
