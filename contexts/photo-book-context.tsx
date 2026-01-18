import React, { createContext, useContext, useState, useCallback } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEntries, type Entry } from "@/contexts/entry-context";
import { useMilestones, type Milestone } from "@/contexts/milestone-context";
import { useChild } from "@/contexts/child-context";
import { useSubscription } from "@/contexts/subscription-context";

export type PhotoBookPageType = "title" | "photo" | "milestone" | "blank";

export type BookLayoutTemplate = "classic" | "modern" | "playful";

export interface BookLayout {
  id: BookLayoutTemplate;
  name: string;
  description: string;
  icon: string;
}

export const BOOK_LAYOUTS: BookLayout[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Timeless elegance with serif fonts and clean borders",
    icon: "📖",
  },
  {
    id: "modern",
    name: "Modern",
    description:
      "Minimalist design with sans-serif fonts and full-bleed photos",
    icon: "🎨",
  },
  {
    id: "playful",
    name: "Playful",
    description:
      "Fun and colorful with rounded corners and decorative elements",
    icon: "🎈",
  },
];

/**
 * Get CSS styles for a specific layout template
 */
function getLayoutStyles(layout: BookLayoutTemplate): string {
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      color: #333;
      background: #fff;
    }
    .page {
      width: 100%;
      min-height: 100vh;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .page:last-child {
      page-break-after: auto;
    }
  `;

  switch (layout) {
    case "classic":
      return `
        ${baseStyles}
        body {
          font-family: Georgia, 'Times New Roman', serif;
        }
        .title-page {
          background: linear-gradient(135deg, #f5f0e8 0%, #e8e0d0 100%);
          text-align: center;
          padding: 40px;
          border: 8px double #8b7355;
          margin: 20px;
        }
        .title-page h1 {
          font-size: 42px;
          font-weight: 400;
          font-style: italic;
          margin-bottom: 16px;
          color: #4a3728;
        }
        .title-page .subtitle {
          font-size: 18px;
          color: #6b5a4a;
        }
        .photo-page {
          padding: 30px;
          border: 4px solid #d4c4b0;
          margin: 20px;
        }
        .photo {
          max-width: 100%;
          max-height: 55vh;
          object-fit: contain;
          border: 2px solid #8b7355;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .milestone-badge {
          background: #c9a959;
          color: #4a3728;
          padding: 8px 20px;
          font-size: 14px;
          font-style: italic;
          margin-bottom: 16px;
          border: 1px solid #8b7355;
        }
        .milestone-page h2 {
          font-size: 26px;
          margin-top: 16px;
          color: #4a3728;
          font-weight: 400;
          font-style: italic;
        }
        .caption {
          font-size: 16px;
          color: #4a3728;
          margin-top: 16px;
          text-align: center;
          max-width: 80%;
          font-style: italic;
        }
        .date {
          font-size: 14px;
          color: #8b7355;
          margin-top: 8px;
        }
        .blank-page {
          background: #faf8f5;
          border: 2px solid #d4c4b0;
          margin: 20px;
        }
      `;
    case "modern":
      return `
        ${baseStyles}
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
        }
        .title-page {
          background: #000;
          text-align: center;
          padding: 60px;
        }
        .title-page h1 {
          font-size: 48px;
          font-weight: 200;
          letter-spacing: 4px;
          margin-bottom: 20px;
          color: #fff;
          text-transform: uppercase;
        }
        .title-page .subtitle {
          font-size: 16px;
          color: #999;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .photo-page {
          padding: 0;
        }
        .photo {
          max-width: 100%;
          max-height: 75vh;
          object-fit: cover;
          width: 100%;
        }
        .milestone-badge {
          background: #222;
          color: #fff;
          padding: 10px 24px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .milestone-page h2 {
          font-size: 28px;
          margin-top: 16px;
          color: #000;
          font-weight: 300;
          letter-spacing: 1px;
        }
        .caption {
          font-size: 15px;
          color: #333;
          margin-top: 20px;
          text-align: center;
          max-width: 70%;
          line-height: 1.6;
        }
        .date {
          font-size: 12px;
          color: #999;
          margin-top: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .blank-page {
          background: #f5f5f5;
        }
      `;
    case "playful":
      return `
        ${baseStyles}
        body {
          font-family: 'Comic Sans MS', 'Chalkboard', 'Marker Felt', sans-serif;
        }
        .title-page {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          text-align: center;
          padding: 40px;
          border-radius: 30px;
          margin: 20px;
        }
        .title-page h1 {
          font-size: 38px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #e74c3c;
          text-shadow: 2px 2px 0 #fff;
        }
        .title-page .subtitle {
          font-size: 18px;
          color: #c0392b;
        }
        .photo-page {
          padding: 20px;
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          border-radius: 20px;
          margin: 15px;
        }
        .photo {
          max-width: 100%;
          max-height: 55vh;
          object-fit: contain;
          border-radius: 20px;
          border: 4px solid #fff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        .milestone-badge {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: #fff;
          padding: 10px 24px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 16px;
          box-shadow: 0 4px 10px rgba(240, 87, 108, 0.3);
        }
        .milestone-page h2 {
          font-size: 24px;
          margin-top: 16px;
          color: #9b59b6;
        }
        .caption {
          font-size: 16px;
          color: #2c3e50;
          margin-top: 16px;
          text-align: center;
          max-width: 85%;
          background: rgba(255,255,255,0.8);
          padding: 12px 16px;
          border-radius: 12px;
        }
        .date {
          font-size: 14px;
          color: #7f8c8d;
          margin-top: 8px;
        }
        .blank-page {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          border-radius: 20px;
          margin: 15px;
        }
      `;
    default:
      return baseStyles;
  }
}

/**
 * Generates HTML content for photo book PDF export
 */
function generatePhotoBookHtml(
  pages: PhotoBookPage[],
  childName?: string,
  layout: BookLayoutTemplate = "classic",
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
          ${getLayoutStyles(layout)}
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
  selectedLayout: BookLayoutTemplate;
  isGenerating: boolean;
  isExporting: boolean;
  canExportPdf: boolean;
  generatePhotoBook: () => Promise<void>;
  reorderPage: (fromIndex: number, toIndex: number) => void;
  removePage: (pageId: string) => void;
  addPage: (page: Omit<PhotoBookPage, "id">) => void;
  updatePageCaption: (pageId: string, caption: string) => void;
  setSelectedLayout: (layout: BookLayoutTemplate) => void;
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
  const [selectedLayout, setSelectedLayout] =
    useState<BookLayoutTemplate>("classic");
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

  const addPage = useCallback((page: Omit<PhotoBookPage, "id">) => {
    const newPage: PhotoBookPage = {
      ...page,
      id: `page-${page.type}-${Date.now()}`,
    };
    setPages((current) => [...current, newPage]);
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
      // Generate HTML content for the photo book with selected layout
      const html = generatePhotoBookHtml(pages, child?.name, selectedLayout);

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
  }, [canExportPdf, pages, child?.name, selectedLayout]);

  return (
    <PhotoBookContext.Provider
      value={{
        pages,
        selectedLayout,
        isGenerating,
        isExporting,
        canExportPdf,
        generatePhotoBook,
        reorderPage,
        removePage,
        addPage,
        updatePageCaption,
        setSelectedLayout,
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
