import React, { createContext, useContext, useState, useCallback } from "react";
import { useEntries, type Entry } from "@/contexts/entry-context";
import { useMilestones, type Milestone } from "@/contexts/milestone-context";
import { useChild } from "@/contexts/child-context";
import { useSubscription } from "@/contexts/subscription-context";

export type PhotoBookPageType = "title" | "photo" | "milestone" | "blank";

export interface PhotoBookPage {
  id: string;
  type: PhotoBookPageType;
  entryId?: string;
  milestoneId?: string;
  imageUri?: string;
  caption?: string;
  date?: string;
  title?: string;
}

interface PhotoBookContextType {
  pages: PhotoBookPage[];
  isGenerating: boolean;
  isExporting: boolean;
  canExportPdf: boolean;
  generatePhotoBook: () => Promise<void>;
  reorderPage: (fromIndex: number, toIndex: number) => void;
  removePage: (pageId: string) => void;
  updatePageCaption: (pageId: string, caption: string) => void;
  clearPhotoBook: () => void;
  exportPdf: () => Promise<void>;
}

const PhotoBookContext = createContext<PhotoBookContextType | undefined>(
  undefined,
);

export function PhotoBookProvider({ children }: { children: React.ReactNode }) {
  const { entries } = useEntries();
  const { milestones } = useMilestones();
  const { child } = useChild();
  const { currentPlan } = useSubscription();

  const [pages, setPages] = useState<PhotoBookPage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // PDF export only for paid tiers per PRD Section 10.3
  const canExportPdf = currentPlan !== "free";

  const generatePhotoBook = useCallback(async () => {
    setIsGenerating(true);

    try {
      const generatedPages: PhotoBookPage[] = [];

      // Title page
      generatedPages.push({
        id: `page-title-${Date.now()}`,
        type: "title",
        title: child?.name ? `${child.name}'s First Year` : "My First Year",
        caption: child?.dateOfBirth
          ? `Born ${new Date(child.dateOfBirth).toLocaleDateString("en-SG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}`
          : undefined,
      });

      // Get photo entries with milestone associations
      const photoEntries = entries.filter((e) => e.type === "photo");

      // Sort by date ascending for chronological order
      const sortedEntries = [...photoEntries].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Create pages from entries, prioritizing milestone entries
      const completedMilestones = milestones.filter((m) => m.isCompleted);

      // First, add milestone entries
      for (const milestone of completedMilestones) {
        // Find entries near the milestone date
        const milestoneDate = new Date(
          milestone.celebrationDate || milestone.milestoneDate,
        );
        const nearbyEntry = sortedEntries.find((entry) => {
          const entryDate = new Date(entry.date);
          const daysDiff = Math.abs(
            (milestoneDate.getTime() - entryDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return daysDiff <= 3; // Within 3 days
        });

        if (
          nearbyEntry &&
          nearbyEntry.mediaUris &&
          nearbyEntry.mediaUris.length > 0
        ) {
          generatedPages.push({
            id: `page-milestone-${milestone.id}`,
            type: "milestone",
            entryId: nearbyEntry.id,
            milestoneId: milestone.id,
            imageUri: nearbyEntry.mediaUris[0],
            caption: milestone.customTitle || nearbyEntry.caption,
            date: milestone.celebrationDate || milestone.milestoneDate,
            title: milestone.customTitle,
          });
        }
      }

      // Then add remaining photo entries (not already in milestone pages)
      const usedEntryIds = new Set(
        generatedPages.filter((p) => p.entryId).map((p) => p.entryId),
      );

      for (const entry of sortedEntries) {
        if (
          !usedEntryIds.has(entry.id) &&
          entry.mediaUris &&
          entry.mediaUris.length > 0
        ) {
          generatedPages.push({
            id: `page-photo-${entry.id}`,
            type: "photo",
            entryId: entry.id,
            imageUri: entry.mediaUris[0],
            caption: entry.caption,
            date: entry.date,
          });
        }
      }

      setPages(generatedPages);
    } finally {
      setIsGenerating(false);
    }
  }, [entries, milestones, child]);

  const reorderPage = useCallback((fromIndex: number, toIndex: number) => {
    setPages((current) => {
      const newPages = [...current];
      const [removed] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, removed);
      return newPages;
    });
  }, []);

  const removePage = useCallback((pageId: string) => {
    setPages((current) => current.filter((p) => p.id !== pageId));
  }, []);

  const updatePageCaption = useCallback((pageId: string, caption: string) => {
    setPages((current) =>
      current.map((p) => (p.id === pageId ? { ...p, caption } : p)),
    );
  }, []);

  const clearPhotoBook = useCallback(() => {
    setPages([]);
  }, []);

  const exportPdf = useCallback(async () => {
    if (!canExportPdf) {
      return;
    }

    setIsExporting(true);

    try {
      // TODO: Implement PDF generation using expo-print or similar
      // For now, this is a placeholder that simulates export delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // PDF generation will be implemented with expo-print + expo-sharing
      // Similar pattern to export-context.tsx
    } finally {
      setIsExporting(false);
    }
  }, [canExportPdf]);

  return (
    <PhotoBookContext.Provider
      value={{
        pages,
        isGenerating,
        isExporting,
        canExportPdf,
        generatePhotoBook,
        reorderPage,
        removePage,
        updatePageCaption,
        clearPhotoBook,
        exportPdf,
      }}
    >
      {children}
    </PhotoBookContext.Provider>
  );
}

export function usePhotoBook() {
  const context = useContext(PhotoBookContext);
  if (context === undefined) {
    throw new Error("usePhotoBook must be used within a PhotoBookProvider");
  }
  return context;
}
