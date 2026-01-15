import React, { createContext, useContext, useState, useCallback } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEntries, type Entry } from "@/contexts/entry-context";
import { useMilestones, type Milestone } from "@/contexts/milestone-context";
import { useChild } from "@/contexts/child-context";
import { useSubscription } from "@/contexts/subscription-context";

export type PhotoBookPageType = "title" | "photo" | "milestone" | "blank";

/**
 * Generates HTML content for photo book PDF export
 */
function generatePhotoBookHtml(
  pages: PhotoBookPage[],
  childName?: string,
): string {
  const pageHtml = pages
    .map((page, index) => {
      switch (page.type) {
        case "title":
          return `
          <div class="page title-page">
            <h1>${escapeHtml(page.title || `${childName || "Baby"}'s First Year`)}</h1>
            ${page.caption ? `<p class="subtitle">${escapeHtml(page.caption)}</p>` : ""}
          </div>
        `;
        case "milestone":
          return `
          <div class="page photo-page milestone-page">
            ${page.imageUri ? `<img src="${page.imageUri}" class="photo" />` : ""}
            <div class="milestone-badge">✨ Milestone</div>
            ${page.title ? `<h2>${escapeHtml(page.title)}</h2>` : ""}
            ${page.caption ? `<p class="caption">${escapeHtml(page.caption)}</p>` : ""}
            ${page.date ? `<p class="date">${formatDate(page.date)}</p>` : ""}
          </div>
        `;
        case "photo":
          return `
          <div class="page photo-page">
            ${page.imageUri ? `<img src="${page.imageUri}" class="photo" />` : ""}
            ${page.caption ? `<p class="caption">${escapeHtml(page.caption)}</p>` : ""}
            ${page.date ? `<p class="date">${formatDate(page.date)}</p>` : ""}
          </div>
        `;
        case "blank":
          return `<div class="page blank-page"></div>`;
        default:
          return "";
      }
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #333;
            background: #fff;
          }
          .page {
            width: 100%;
            min-height: 100vh;
            padding: 40px;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .title-page {
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            text-align: center;
          }
          .title-page h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 16px;
            color: #0a7ea4;
          }
          .title-page .subtitle {
            font-size: 18px;
            color: #666;
          }
          .photo-page {
            padding: 20px;
          }
          .photo {
            max-width: 100%;
            max-height: 60vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .milestone-badge {
            background: #ffd700;
            color: #333;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          .milestone-page h2 {
            font-size: 24px;
            margin-top: 16px;
            color: #0a7ea4;
          }
          .caption {
            font-size: 16px;
            color: #333;
            margin-top: 16px;
            text-align: center;
            max-width: 80%;
          }
          .date {
            font-size: 14px;
            color: #666;
            margin-top: 8px;
          }
          .blank-page {
            background: #fafafa;
          }
        </style>
      </head>
      <body>
        ${pageHtml}
      </body>
    </html>
  `;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Format date for display in photo book
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-SG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

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
    if (!canExportPdf || pages.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      // Generate HTML content for the photo book
      const html = generatePhotoBookHtml(pages, child?.name);

      // Create PDF from HTML
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Share the PDF file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        const childName = child?.name || "Baby";
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `${childName}'s Photo Book`,
        });
      }
    } finally {
      setIsExporting(false);
    }
  }, [canExportPdf, pages, child?.name]);

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
