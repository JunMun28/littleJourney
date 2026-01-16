import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useEntries, type Entry } from "@/contexts/entry-context";

/**
 * Represents a memory from a previous year on today's date.
 * OTD-001 through OTD-007 features.
 */
export interface Memory {
  id: string;
  entry: Entry;
  yearsAgo: number;
  year: number;
  isDismissed: boolean;
}

/**
 * A "Then vs Now" comparison combining a past memory with a current photo.
 * OTD-004: Create side-by-side growth comparisons.
 */
export interface ThenVsNow {
  id: string;
  memoryId: string;
  thenPhotoUri: string;
  thenDate: string;
  currentPhotoUri: string;
  currentDate: string;
  caption?: string;
  createdAt: string;
}

export interface CreateThenVsNowInput {
  memoryId: string;
  currentPhotoUri: string;
  caption?: string;
}

interface MemoryGroup {
  year: number;
  yearsAgo: number;
  memories: Memory[];
}

interface OnThisDayContextValue {
  /** All memories for today from previous years */
  memories: Memory[];
  /** Whether there are any memories to show today */
  hasMemoriesToday: boolean;
  /** Get memories grouped by year (OTD-003) */
  getMemoriesByYear: () => MemoryGroup[];
  /** Dismiss a memory so it won't show again today */
  dismissMemory: (memoryId: string) => void;
  /** Create a Then vs Now comparison (OTD-004) */
  createThenVsNow: (input: CreateThenVsNowInput) => ThenVsNow;
  /** All created Then vs Now comparisons */
  thenVsNowComparisons: ThenVsNow[];
  /** Get list of years that have memories (sorted recent first) */
  yearsWithMemories: () => number[];
  /** Get a specific memory by ID */
  getMemory: (memoryId: string) => Memory | undefined;
}

const OnThisDayContext = createContext<OnThisDayContextValue | null>(null);

function generateId(): string {
  return `otd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface OnThisDayProviderProps {
  children: ReactNode;
}

export function OnThisDayProvider({ children }: OnThisDayProviderProps) {
  const { getOnThisDayEntries } = useEntries();

  // Track dismissed memory IDs for today's session
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  // Track created Then vs Now comparisons
  const [comparisons, setComparisons] = useState<ThenVsNow[]>([]);

  // Build memories from entries, calculating years ago for each
  const allMemories = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const entries = getOnThisDayEntries();

    return entries
      .map((entry): Memory => {
        const entryYear = new Date(entry.date).getFullYear();
        const yearsAgo = currentYear - entryYear;
        return {
          id: `memory_${entry.id}`,
          entry,
          yearsAgo,
          year: entryYear,
          isDismissed: dismissedIds.has(`memory_${entry.id}`),
        };
      })
      .filter((m) => m.yearsAgo > 0) // Only past years
      .sort((a, b) => a.yearsAgo - b.yearsAgo); // Most recent first
  }, [getOnThisDayEntries, dismissedIds]);

  // Filter out dismissed memories
  const memories = useMemo(
    () => allMemories.filter((m) => !m.isDismissed),
    [allMemories],
  );

  const hasMemoriesToday = memories.length > 0;

  // Group memories by year (OTD-003: Multi-year memories)
  const getMemoriesByYear = useCallback((): MemoryGroup[] => {
    const groups = new Map<number, Memory[]>();

    for (const memory of memories) {
      const existing = groups.get(memory.year) || [];
      existing.push(memory);
      groups.set(memory.year, existing);
    }

    // Convert to array and sort by year descending (most recent first)
    return Array.from(groups.entries())
      .map(([year, mems]) => ({
        year,
        yearsAgo: mems[0]?.yearsAgo ?? 0,
        memories: mems,
      }))
      .sort((a, b) => b.year - a.year);
  }, [memories]);

  // Get list of years with memories
  const yearsWithMemories = useCallback((): number[] => {
    const years = new Set(memories.map((m) => m.year));
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  }, [memories]);

  // Dismiss a memory
  const dismissMemory = useCallback((memoryId: string) => {
    setDismissedIds((prev) => new Set([...prev, memoryId]));
  }, []);

  // Get a specific memory
  const getMemory = useCallback(
    (memoryId: string): Memory | undefined => {
      return allMemories.find((m) => m.id === memoryId);
    },
    [allMemories],
  );

  // Create a Then vs Now comparison (OTD-004)
  const createThenVsNow = useCallback(
    (input: CreateThenVsNowInput): ThenVsNow => {
      const memory = getMemory(input.memoryId);

      if (!memory) {
        throw new Error(`Memory not found: ${input.memoryId}`);
      }

      const thenPhotoUri = memory.entry.mediaUris?.[0] ?? "";
      const now = new Date().toISOString();

      const comparison: ThenVsNow = {
        id: generateId(),
        memoryId: input.memoryId,
        thenPhotoUri,
        thenDate: memory.entry.date,
        currentPhotoUri: input.currentPhotoUri,
        currentDate: now.split("T")[0], // YYYY-MM-DD
        caption: input.caption,
        createdAt: now,
      };

      setComparisons((prev) => [comparison, ...prev]);
      return comparison;
    },
    [getMemory],
  );

  const value: OnThisDayContextValue = {
    memories,
    hasMemoriesToday,
    getMemoriesByYear,
    dismissMemory,
    createThenVsNow,
    thenVsNowComparisons: comparisons,
    yearsWithMemories,
    getMemory,
  };

  return (
    <OnThisDayContext.Provider value={value}>
      {children}
    </OnThisDayContext.Provider>
  );
}

export function useOnThisDay(): OnThisDayContextValue {
  const context = useContext(OnThisDayContext);
  if (context === null) {
    throw new Error("useOnThisDay must be used within an OnThisDayProvider");
  }
  return context;
}
