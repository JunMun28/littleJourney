import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { EntryType } from "@/contexts/entry-context";

const DRAFT_STORAGE_KEY = "@littlejourney:draft";

export interface Draft {
  type: EntryType | null;
  mediaUris?: string[];
  mediaSizes?: number[];
  caption: string;
  date: string;
  savedAt: number;
}

interface UseDraftReturn {
  draft: Draft | null;
  isLoading: boolean;
  hasDraft: boolean;
  saveDraft: (data: Omit<Draft, "savedAt">) => Promise<void>;
  clearDraft: () => Promise<void>;
}

export function useDraft(): UseDraftReturn {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load draft from storage on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const stored = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        if (stored) {
          setDraft(JSON.parse(stored));
        }
      } catch (error) {
        // Silently fail - draft will be null
        console.warn("Failed to load draft:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, []);

  const saveDraft = useCallback(async (data: Omit<Draft, "savedAt">) => {
    // Don't save empty drafts (no type selected)
    if (!data.type) {
      return;
    }

    const draftWithTimestamp: Draft = {
      ...data,
      savedAt: Date.now(),
    };

    try {
      await AsyncStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(draftWithTimestamp),
      );
      setDraft(draftWithTimestamp);
    } catch (error) {
      console.warn("Failed to save draft:", error);
    }
  }, []);

  const clearDraft = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraft(null);
    } catch (error) {
      console.warn("Failed to clear draft:", error);
    }
  }, []);

  return {
    draft,
    isLoading,
    hasDraft: draft !== null,
    saveDraft,
    clearDraft,
  };
}
