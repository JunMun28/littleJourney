import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { useEntries, type Entry } from "@/contexts/entry-context";
import { useMilestones, type Milestone } from "@/contexts/milestone-context";
import { useChild } from "@/contexts/child-context";

/**
 * Year in Review feature (YIR-001 through YIR-005)
 * Generates highlight compilations for a child's year.
 */

// Scoring weights for highlight curation
const SCORE_MILESTONE = 100; // Milestone entries are top priority
const SCORE_CAPTION = 40; // Has caption
const SCORE_TAGS = 20; // Has AI tags
const SCORE_MULTI_PHOTO = 15; // Multiple photos in entry
const SCORE_VOICE = 30; // Has voice recording

// Curation constants
export const MAX_HIGHLIGHTS_PER_YEAR = 50; // Max clips for year review
export const MAX_HIGHLIGHTS_PER_MONTH = 5; // Ensure monthly variety
export const MONTHLY_RECAP_MAX_HIGHLIGHTS = 15; // Shorter monthly recaps

// Music track options for year in review (YIR-003)
export interface MusicTrack {
  id: string;
  name: string;
  duration: number; // seconds
  uri: string | null; // null = placeholder for bundled asset
  category: "gentle" | "playful" | "nostalgic" | "celebratory";
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "gentle_memories",
    name: "Gentle Memories",
    duration: 180,
    uri: null,
    category: "gentle",
  },
  {
    id: "playful_moments",
    name: "Playful Moments",
    duration: 150,
    uri: null,
    category: "playful",
  },
  {
    id: "nostalgic_journey",
    name: "Nostalgic Journey",
    duration: 200,
    uri: null,
    category: "nostalgic",
  },
  {
    id: "celebration_time",
    name: "Celebration Time",
    duration: 120,
    uri: null,
    category: "celebratory",
  },
  {
    id: "growing_up",
    name: "Growing Up",
    duration: 180,
    uri: null,
    category: "nostalgic",
  },
  {
    id: "happy_days",
    name: "Happy Days",
    duration: 160,
    uri: null,
    category: "playful",
  },
];

// Transition styles for slideshow (YIR-002)
export type TransitionStyle = "fade" | "slide" | "zoom" | "dissolve";

export const TRANSITION_STYLES: {
  id: TransitionStyle;
  name: string;
  description: string;
}[] = [
  { id: "fade", name: "Fade", description: "Smooth cross-fade between clips" },
  { id: "slide", name: "Slide", description: "Slide left to right" },
  { id: "zoom", name: "Zoom", description: "Gentle zoom in/out effect" },
  {
    id: "dissolve",
    name: "Dissolve",
    description: "Soft dissolve transition",
  },
];

// Video quality options (YIR-004)
export type VideoQuality = "720p" | "1080p";

export const VIDEO_QUALITIES: {
  id: VideoQuality;
  name: string;
  resolution: string;
}[] = [
  { id: "720p", name: "HD", resolution: "1280x720" },
  { id: "1080p", name: "Full HD", resolution: "1920x1080" },
];

/**
 * A highlight clip for inclusion in year/month review.
 */
export interface ReviewClip {
  id: string;
  entry: Entry;
  photoUri: string; // Primary photo for the clip
  score: number;
  month: number; // 1-12
  isMilestone: boolean;
  milestone?: Milestone;
}

/**
 * YIR-001/YIR-002: Year in Review configuration and state.
 */
export interface YearInReview {
  id: string;
  childId: string;
  year: number;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "generating" | "ready" | "exported";
  // Curated clips (can be customized)
  clips: ReviewClip[];
  // Removed clips (for reset functionality)
  removedClipIds: string[];
  // Customization options (YIR-002)
  selectedMusicId: string;
  transitionStyle: TransitionStyle;
  // Export options (YIR-004)
  exportQuality: VideoQuality;
  exportedUri?: string;
}

/**
 * YIR-005: Monthly recap (shorter version).
 */
export interface MonthlyRecap {
  id: string;
  childId: string;
  year: number;
  month: number; // 1-12
  createdAt: string;
  status: "pending" | "generating" | "ready";
  clips: ReviewClip[];
}

export interface GenerateYearInReviewInput {
  childId: string;
  year: number;
}

export interface CustomizeYearInReviewInput {
  reviewId: string;
  addClipIds?: string[];
  removeClipIds?: string[];
  musicId?: string;
  transitionStyle?: TransitionStyle;
  exportQuality?: VideoQuality;
}

interface YearInReviewContextValue {
  /** All year in review compilations */
  yearInReviews: YearInReview[];
  /** Monthly recaps (YIR-005) */
  monthlyRecaps: MonthlyRecap[];
  /** Generate year in review for a child (YIR-001) */
  generateYearInReview: (
    input: GenerateYearInReviewInput,
  ) => Promise<YearInReview>;
  /** Customize a year in review (YIR-002) */
  customizeYearInReview: (input: CustomizeYearInReviewInput) => YearInReview;
  /** Reset to AI-generated selection */
  resetToAISuggestion: (reviewId: string) => YearInReview;
  /** Get year in review by ID */
  getYearInReview: (reviewId: string) => YearInReview | undefined;
  /** Get year in review for specific child and year */
  getYearInReviewForChild: (
    childId: string,
    year: number,
  ) => YearInReview | undefined;
  /** Generate monthly recap (YIR-005) */
  generateMonthlyRecap: (
    childId: string,
    year: number,
    month: number,
  ) => Promise<MonthlyRecap>;
  /** Get monthly recap */
  getMonthlyRecap: (
    childId: string,
    year: number,
    month: number,
  ) => MonthlyRecap | undefined;
  /** Check if child's birthday is today or upcoming */
  isYearInReviewPromptNeeded: (childId: string) => boolean;
  /** Mark year in review as exported (YIR-004) */
  markAsExported: (reviewId: string, exportedUri: string) => void;
  /** Send prompt notification for year in review */
  sendYearInReviewPrompt: (childId: string) => Promise<boolean>;
  /** Available clips for adding back to review */
  getAvailableClipsForReview: (reviewId: string) => ReviewClip[];
}

const YearInReviewContext = createContext<YearInReviewContextValue | null>(
  null,
);

function generateId(): string {
  return `yir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Score an entry for inclusion in year in review.
 * Higher score = more likely to be included.
 */
function scoreEntry(entry: Entry, milestones: Milestone[]): number {
  let score = 0;

  // Milestone entries get highest priority
  const milestone = milestones.find((m) => m.id === entry.milestoneId);
  if (milestone) {
    score += SCORE_MILESTONE;
  }

  // Photos with captions ranked higher
  if (entry.caption && entry.caption.trim().length > 0) {
    score += SCORE_CAPTION;
  }

  // Photos with AI tags get a bonus
  if (entry.aiLabels && entry.aiLabels.length > 0) {
    score += SCORE_TAGS;
  }

  // Multiple photos get a small bonus
  if (entry.mediaUris && entry.mediaUris.length > 1) {
    score += SCORE_MULTI_PHOTO;
  }

  // Voice entries get a bonus
  if (entry.type === "voice" && entry.audioUri) {
    score += SCORE_VOICE;
  }

  return score;
}

/**
 * Curate highlights for a given time period.
 * Ensures variety across months and prioritizes milestones.
 */
function curateHighlights(
  entries: Entry[],
  milestones: Milestone[],
  maxTotal: number,
  maxPerMonth: number,
): ReviewClip[] {
  // Score all entries
  const scoredEntries = entries.map((entry) => ({
    entry,
    score: scoreEntry(entry, milestones),
    milestone: milestones.find((m) => m.id === entry.milestoneId),
  }));

  // Sort by score descending
  scoredEntries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Same score: sort chronologically
    return new Date(a.entry.date).getTime() - new Date(b.entry.date).getTime();
  });

  // Select with monthly variety constraint
  const selected: ReviewClip[] = [];
  const clipsByMonth = new Map<number, number>();

  for (const { entry, score, milestone } of scoredEntries) {
    if (selected.length >= maxTotal) break;

    const month = new Date(entry.date).getMonth() + 1; // 1-12
    const currentMonthCount = clipsByMonth.get(month) || 0;

    // Skip if we've hit the per-month limit (unless we don't have enough total)
    if (currentMonthCount >= maxPerMonth && selected.length < maxTotal / 2) {
      continue;
    }

    // Must have at least one photo
    const photoUri = entry.mediaUris?.[0];
    if (!photoUri && entry.type === "photo") {
      continue;
    }

    const clip: ReviewClip = {
      id: `clip_${entry.id}`,
      entry,
      photoUri: photoUri || "",
      score,
      month,
      isMilestone: !!milestone,
      milestone,
    };

    selected.push(clip);
    clipsByMonth.set(month, currentMonthCount + 1);
  }

  // Sort selected clips chronologically for playback
  selected.sort(
    (a, b) =>
      new Date(a.entry.date).getTime() - new Date(b.entry.date).getTime(),
  );

  return selected;
}

interface YearInReviewProviderProps {
  children: ReactNode;
}

export function YearInReviewProvider({ children }: YearInReviewProviderProps) {
  const { entries } = useEntries();
  const { milestones } = useMilestones();
  const { child } = useChild();

  const [yearInReviews, setYearInReviews] = useState<YearInReview[]>([]);
  const [monthlyRecaps, setMonthlyRecaps] = useState<MonthlyRecap[]>([]);
  // Store original AI-generated clips for reset
  const [originalClipsMap, setOriginalClipsMap] = useState<
    Map<string, ReviewClip[]>
  >(new Map());

  // Get entries for a specific year
  const getEntriesForYear = useCallback(
    (year: number): Entry[] => {
      return entries.filter((e) => {
        const entryYear = new Date(e.date).getFullYear();
        return entryYear === year && e.type === "photo" && e.mediaUris?.length;
      });
    },
    [entries],
  );

  // Get entries for a specific month
  const getEntriesForMonth = useCallback(
    (year: number, month: number): Entry[] => {
      return entries.filter((e) => {
        const date = new Date(e.date);
        return (
          date.getFullYear() === year &&
          date.getMonth() + 1 === month &&
          e.type === "photo" &&
          e.mediaUris?.length
        );
      });
    },
    [entries],
  );

  // Generate year in review (YIR-001)
  const generateYearInReview = useCallback(
    async (input: GenerateYearInReviewInput): Promise<YearInReview> => {
      const { childId, year } = input;

      // Check if one already exists
      const existing = yearInReviews.find(
        (yir) => yir.childId === childId && yir.year === year,
      );
      if (existing) {
        return existing;
      }

      // Get entries for the year
      const yearEntries = getEntriesForYear(year);

      // Curate highlights
      const clips = curateHighlights(
        yearEntries,
        milestones,
        MAX_HIGHLIGHTS_PER_YEAR,
        MAX_HIGHLIGHTS_PER_MONTH,
      );

      const now = new Date().toISOString();
      const review: YearInReview = {
        id: generateId(),
        childId,
        year,
        createdAt: now,
        updatedAt: now,
        status: "ready",
        clips,
        removedClipIds: [],
        selectedMusicId: MUSIC_LIBRARY[0].id,
        transitionStyle: "fade",
        exportQuality: "1080p",
      };

      // Store original clips for reset
      setOriginalClipsMap((prev) => new Map(prev).set(review.id, [...clips]));

      setYearInReviews((prev) => [...prev, review]);
      return review;
    },
    [yearInReviews, getEntriesForYear, milestones],
  );

  // Customize year in review (YIR-002)
  const customizeYearInReview = useCallback(
    (input: CustomizeYearInReviewInput): YearInReview => {
      const review = yearInReviews.find((yir) => yir.id === input.reviewId);
      if (!review) {
        throw new Error(`Year in review not found: ${input.reviewId}`);
      }

      const updated: YearInReview = {
        ...review,
        updatedAt: new Date().toISOString(),
      };

      // Remove clips
      if (input.removeClipIds?.length) {
        updated.clips = updated.clips.filter(
          (c) => !input.removeClipIds?.includes(c.id),
        );
        updated.removedClipIds = [
          ...updated.removedClipIds,
          ...input.removeClipIds,
        ];
      }

      // Add clips back
      if (input.addClipIds?.length) {
        const originalClips = originalClipsMap.get(review.id) || [];
        const clipsToAdd = originalClips.filter(
          (c) =>
            input.addClipIds?.includes(c.id) &&
            !updated.clips.some((uc) => uc.id === c.id),
        );
        updated.clips = [...updated.clips, ...clipsToAdd];
        updated.removedClipIds = updated.removedClipIds.filter(
          (id) => !input.addClipIds?.includes(id),
        );
        // Re-sort chronologically
        updated.clips.sort(
          (a, b) =>
            new Date(a.entry.date).getTime() - new Date(b.entry.date).getTime(),
        );
      }

      // Update music
      if (input.musicId) {
        updated.selectedMusicId = input.musicId;
      }

      // Update transition
      if (input.transitionStyle) {
        updated.transitionStyle = input.transitionStyle;
      }

      // Update export quality
      if (input.exportQuality) {
        updated.exportQuality = input.exportQuality;
      }

      setYearInReviews((prev) =>
        prev.map((yir) => (yir.id === input.reviewId ? updated : yir)),
      );

      return updated;
    },
    [yearInReviews, originalClipsMap],
  );

  // Reset to AI suggestion
  const resetToAISuggestion = useCallback(
    (reviewId: string): YearInReview => {
      const review = yearInReviews.find((yir) => yir.id === reviewId);
      if (!review) {
        throw new Error(`Year in review not found: ${reviewId}`);
      }

      const originalClips = originalClipsMap.get(reviewId);
      if (!originalClips) {
        throw new Error("Original clips not found for reset");
      }

      const updated: YearInReview = {
        ...review,
        clips: [...originalClips],
        removedClipIds: [],
        updatedAt: new Date().toISOString(),
      };

      setYearInReviews((prev) =>
        prev.map((yir) => (yir.id === reviewId ? updated : yir)),
      );

      return updated;
    },
    [yearInReviews, originalClipsMap],
  );

  // Get year in review by ID
  const getYearInReview = useCallback(
    (reviewId: string): YearInReview | undefined => {
      return yearInReviews.find((yir) => yir.id === reviewId);
    },
    [yearInReviews],
  );

  // Get year in review for specific child and year
  const getYearInReviewForChild = useCallback(
    (childId: string, year: number): YearInReview | undefined => {
      return yearInReviews.find(
        (yir) => yir.childId === childId && yir.year === year,
      );
    },
    [yearInReviews],
  );

  // Generate monthly recap (YIR-005)
  const generateMonthlyRecap = useCallback(
    async (
      childId: string,
      year: number,
      month: number,
    ): Promise<MonthlyRecap> => {
      // Check if exists
      const existing = monthlyRecaps.find(
        (mr) =>
          mr.childId === childId && mr.year === year && mr.month === month,
      );
      if (existing) {
        return existing;
      }

      // Get entries for the month
      const monthEntries = getEntriesForMonth(year, month);

      // Curate highlights (smaller set for monthly)
      const clips = curateHighlights(
        monthEntries,
        milestones,
        MONTHLY_RECAP_MAX_HIGHLIGHTS,
        MONTHLY_RECAP_MAX_HIGHLIGHTS, // No per-month limit for monthly recap
      );

      const recap: MonthlyRecap = {
        id: `mr_${childId}_${year}_${month}`,
        childId,
        year,
        month,
        createdAt: new Date().toISOString(),
        status: "ready",
        clips,
      };

      setMonthlyRecaps((prev) => [...prev, recap]);
      return recap;
    },
    [monthlyRecaps, getEntriesForMonth, milestones],
  );

  // Get monthly recap
  const getMonthlyRecap = useCallback(
    (
      childId: string,
      year: number,
      month: number,
    ): MonthlyRecap | undefined => {
      return monthlyRecaps.find(
        (mr) =>
          mr.childId === childId && mr.year === year && mr.month === month,
      );
    },
    [monthlyRecaps],
  );

  // Check if year in review prompt is needed (birthday or year end)
  const isYearInReviewPromptNeeded = useCallback(
    (childId: string): boolean => {
      if (!child || child.id !== childId) return false;

      const today = new Date();
      const dateOfBirth = child.dateOfBirth
        ? new Date(child.dateOfBirth)
        : null;

      if (!dateOfBirth) return false;

      // Check if today is child's birthday
      const isBirthday =
        today.getMonth() === dateOfBirth.getMonth() &&
        today.getDate() === dateOfBirth.getDate();

      // Check if it's year end (December 15-31)
      const isYearEnd = today.getMonth() === 11 && today.getDate() >= 15;

      // Check if review already exists for current year
      const currentYear = today.getFullYear();
      const existingReview = yearInReviews.find(
        (yir) => yir.childId === childId && yir.year === currentYear,
      );

      return (isBirthday || isYearEnd) && !existingReview;
    },
    [child, yearInReviews],
  );

  // Mark as exported (YIR-004)
  const markAsExported = useCallback(
    (reviewId: string, exportedUri: string): void => {
      setYearInReviews((prev) =>
        prev.map((yir) =>
          yir.id === reviewId
            ? {
                ...yir,
                status: "exported",
                exportedUri,
                updatedAt: new Date().toISOString(),
              }
            : yir,
        ),
      );
    },
    [],
  );

  // Send prompt notification
  const sendYearInReviewPrompt = useCallback(
    async (childId: string): Promise<boolean> => {
      if (!child || child.id !== childId) return false;

      const today = new Date();
      const currentYear = today.getFullYear();

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🎬 ${child.name}'s Year in Review is ready!`,
            body: `Create a beautiful highlight reel of ${child.name}'s amazing ${currentYear}.`,
            data: { type: "year_in_review", childId, year: currentYear },
          },
          trigger: null, // Send immediately
        });
        return true;
      } catch (error) {
        console.error("Failed to send year in review prompt:", error);
        return false;
      }
    },
    [child],
  );

  // Get available clips for adding back
  const getAvailableClipsForReview = useCallback(
    (reviewId: string): ReviewClip[] => {
      const review = yearInReviews.find((yir) => yir.id === reviewId);
      if (!review) return [];

      const originalClips = originalClipsMap.get(reviewId) || [];
      const currentClipIds = new Set(review.clips.map((c) => c.id));

      return originalClips.filter((c) => !currentClipIds.has(c.id));
    },
    [yearInReviews, originalClipsMap],
  );

  const value: YearInReviewContextValue = {
    yearInReviews,
    monthlyRecaps,
    generateYearInReview,
    customizeYearInReview,
    resetToAISuggestion,
    getYearInReview,
    getYearInReviewForChild,
    generateMonthlyRecap,
    getMonthlyRecap,
    isYearInReviewPromptNeeded,
    markAsExported,
    sendYearInReviewPrompt,
    getAvailableClipsForReview,
  };

  return (
    <YearInReviewContext.Provider value={value}>
      {children}
    </YearInReviewContext.Provider>
  );
}

export function useYearInReview(): YearInReviewContextValue {
  const context = useContext(YearInReviewContext);
  if (context === null) {
    throw new Error(
      "useYearInReview must be used within a YearInReviewProvider",
    );
  }
  return context;
}
