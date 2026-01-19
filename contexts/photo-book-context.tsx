import React, { createContext, useContext, useState, useCallback } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEntries, type Entry } from "@/contexts/entry-context";
import { useMilestones, type Milestone } from "@/contexts/milestone-context";
import { useChild } from "@/contexts/child-context";
import { useSubscription } from "@/contexts/subscription-context";

// BOOK-001: Monthly curation constants
export const MAX_PHOTOS_PER_BOOK = 20;
export const MAX_PHOTOS_PER_DAY = 3; // For variety - not all same day

// BOOK-001: Scoring weights for photo curation
const SCORE_MILESTONE = 50; // Has milestone association
const SCORE_CAPTION = 30; // Has caption
const SCORE_TAGS = 10; // Has tags/labels

// BOOK-007: Book pricing tiers
export type BookSize = "mini" | "standard" | "premium";

export interface BookPricingTier {
  id: BookSize;
  name: string;
  pages: number;
  priceMin: number; // SGD
  priceMax: number; // SGD
  description: string;
  icon: string;
}

export const BOOK_PRICING_TIERS: BookPricingTier[] = [
  {
    id: "mini",
    name: "Mini Book",
    pages: 20,
    priceMin: 15,
    priceMax: 20,
    description: "Perfect for monthly memories",
    icon: "📘",
  },
  {
    id: "standard",
    name: "Standard Book",
    pages: 40,
    priceMin: 25,
    priceMax: 35,
    description: "Great for quarterly highlights",
    icon: "📗",
  },
  {
    id: "premium",
    name: "Premium Book",
    pages: 80,
    priceMin: 45,
    priceMax: 60,
    description: "Complete yearly collection",
    icon: "📕",
  },
];

// BOOK-007: Subscription discount
export const SUBSCRIPTION_DISCOUNT_PERCENT = 20;

/**
 * Calculate discounted price for subscribers
 */
export function calculateDiscountedPrice(price: number): number {
  return Math.round(price * (1 - SUBSCRIPTION_DISCOUNT_PERCENT / 100));
}

export interface MonthSelection {
  year: number;
  month: number; // 1-12
}

export type PhotoBookPageType = "title" | "photo" | "milestone" | "blank";

export type BookLayoutTemplate = "classic" | "modern" | "playful";

export type CoverColorTheme =
  | "coral"
  | "sage"
  | "navy"
  | "blush"
  | "gold"
  | "charcoal";

export interface BookCover {
  photoUri?: string;
  title: string;
  childName?: string;
  dateRange?: string;
  colorTheme: CoverColorTheme;
}

export const COVER_COLOR_THEMES: {
  id: CoverColorTheme;
  name: string;
  background: string;
  text: string;
}[] = [
  { id: "coral", name: "Coral", background: "#FF6B6B", text: "#FFFFFF" },
  { id: "sage", name: "Sage", background: "#87A878", text: "#FFFFFF" },
  { id: "navy", name: "Navy", background: "#2C3E50", text: "#FFFFFF" },
  { id: "blush", name: "Blush", background: "#F5B7B1", text: "#4A3728" },
  { id: "gold", name: "Gold", background: "#C9A959", text: "#4A3728" },
  { id: "charcoal", name: "Charcoal", background: "#36454F", text: "#FFFFFF" },
];

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
    .cover-photo {
      max-width: 200px;
      max-height: 200px;
      object-fit: cover;
      border-radius: 50%;
      margin-bottom: 24px;
      border: 4px solid rgba(255,255,255,0.5);
    }
    .date-range {
      font-size: 14px;
      margin-top: 8px;
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
 * Get CSS for cover color theme
 */
function getCoverThemeStyles(theme: CoverColorTheme): {
  background: string;
  text: string;
} {
  const themeConfig = COVER_COLOR_THEMES.find((t) => t.id === theme);
  return themeConfig
    ? { background: themeConfig.background, text: themeConfig.text }
    : { background: "#FF6B6B", text: "#FFFFFF" };
}

/**
 * Generates HTML content for photo book PDF export
 */
function generatePhotoBookHtml(
  pages: PhotoBookPage[],
  cover: BookCover,
  layout: BookLayoutTemplate = "classic",
): string {
  const coverTheme = getCoverThemeStyles(cover.colorTheme);

  const pageHtml = pages
    .map((page, index) => {
      switch (page.type) {
        case "title":
          return `
          <div class="page title-page" style="background: ${coverTheme.background};">
            ${cover.photoUri ? `<img src="${cover.photoUri}" class="cover-photo" />` : ""}
            <h1 style="color: ${coverTheme.text};">${escapeHtml(cover.title)}</h1>
            ${cover.childName ? `<p class="subtitle" style="color: ${coverTheme.text}; opacity: 0.9;">${escapeHtml(cover.childName)}</p>` : ""}
            ${cover.dateRange ? `<p class="date-range" style="color: ${coverTheme.text}; opacity: 0.8;">${escapeHtml(cover.dateRange)}</p>` : ""}
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

/**
 * BOOK-001: Score an entry for curation algorithm
 * Higher score = more likely to be selected
 */
function scoreEntry(entry: Entry): number {
  let score = 0;

  // Milestone entries get highest priority
  if (entry.milestoneId) {
    score += SCORE_MILESTONE;
  }

  // Photos with captions ranked higher
  if (entry.caption && entry.caption.trim().length > 0) {
    score += SCORE_CAPTION;
  }

  // Photos with tags/labels get a bonus
  if (
    (entry.tags && entry.tags.length > 0) ||
    (entry.aiLabels && entry.aiLabels.length > 0)
  ) {
    score += SCORE_TAGS;
  }

  return score;
}

/**
 * BOOK-001: Curate photos for a monthly photo book
 * Pure function for testability
 *
 * Algorithm:
 * 1. Filter entries to the specified month (photo entries with media only)
 * 2. Score each entry based on: milestones (+50), captions (+30), tags (+10)
 * 3. Sort by score descending, then by date ascending (chronological)
 * 4. Enforce variety: max 3 photos per day
 * 5. Select top 20 photos
 */
export function curateMonthlyBook(
  entries: Entry[],
  month: MonthSelection,
): PhotoBookPage[] {
  // Filter to photo entries with media for the specified month
  const monthStr = `${month.year}-${String(month.month).padStart(2, "0")}`;

  const eligibleEntries = entries.filter((entry) => {
    // Must be a photo entry with media
    if (
      entry.type !== "photo" ||
      !entry.mediaUris ||
      entry.mediaUris.length === 0
    ) {
      return false;
    }
    // Must be in the specified month
    return entry.date.startsWith(monthStr);
  });

  if (eligibleEntries.length === 0) {
    return [];
  }

  // Score and sort entries
  const scoredEntries = eligibleEntries.map((entry) => ({
    entry,
    score: scoreEntry(entry),
  }));

  // Sort by score descending, then by date ascending for chronological order
  scoredEntries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score; // Higher score first
    }
    // Same score: sort chronologically
    return new Date(a.entry.date).getTime() - new Date(b.entry.date).getTime();
  });

  // Enforce variety: max photos per day
  const selectedEntries: Entry[] = [];
  const photosPerDay = new Map<string, number>();

  for (const { entry } of scoredEntries) {
    const date = entry.date;
    const currentCount = photosPerDay.get(date) || 0;

    // Skip if we've hit the per-day limit
    if (currentCount >= MAX_PHOTOS_PER_DAY) {
      continue;
    }

    // Add entry
    selectedEntries.push(entry);
    photosPerDay.set(date, currentCount + 1);

    // Stop if we've reached the book limit
    if (selectedEntries.length >= MAX_PHOTOS_PER_BOOK) {
      break;
    }
  }

  // Re-sort selected entries chronologically for book layout
  selectedEntries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Convert to PhotoBookPage objects
  return selectedEntries.map((entry) => ({
    id: `page-curated-${entry.id}`,
    type: entry.milestoneId ? ("milestone" as const) : ("photo" as const),
    entryId: entry.id,
    milestoneId: entry.milestoneId,
    imageUri: entry.mediaUris![0],
    caption: entry.caption,
    date: entry.date,
  }));
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
  cover: BookCover;
  isGenerating: boolean;
  isExporting: boolean;
  canExportPdf: boolean;
  // BOOK-001: Monthly curation state
  monthlyBookEnabled: boolean;
  selectedMonth: MonthSelection;
  generatePhotoBook: () => Promise<void>;
  // BOOK-001: Monthly curation methods
  generateMonthlyBook: () => Promise<void>;
  setMonthlyBookEnabled: (enabled: boolean) => void;
  setSelectedMonth: (month: MonthSelection) => void;
  reorderPage: (fromIndex: number, toIndex: number) => void;
  removePage: (pageId: string) => void;
  addPage: (page: Omit<PhotoBookPage, "id">) => void;
  updatePageCaption: (pageId: string, caption: string) => void;
  setSelectedLayout: (layout: BookLayoutTemplate) => void;
  updateCover: (updates: Partial<BookCover>) => void;
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
  const [cover, setCover] = useState<BookCover>({
    title: child?.name ? `${child.name}'s First Year` : "My First Year",
    childName: child?.name,
    colorTheme: "coral",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // BOOK-001: Monthly curation state
  const [monthlyBookEnabled, setMonthlyBookEnabled] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<MonthSelection>(() => {
    // Default to current month
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

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

  // BOOK-001: Generate monthly photo book using smart curation algorithm
  const generateMonthlyBook = useCallback(async () => {
    setIsGenerating(true);

    try {
      const generatedPages: PhotoBookPage[] = [];

      // Get month name for title
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthName = monthNames[selectedMonth.month - 1];
      const yearStr = selectedMonth.year.toString();

      // Title page
      generatedPages.push({
        id: `page-title-${Date.now()}`,
        type: "title",
        title: child?.name
          ? `${child.name}'s ${monthName} ${yearStr}`
          : `${monthName} ${yearStr} Memories`,
        caption: `A curated collection of ${MAX_PHOTOS_PER_BOOK} special moments`,
      });

      // Curate photos using the algorithm
      const curatedPages = curateMonthlyBook(entries, selectedMonth);

      // Add curated pages
      generatedPages.push(...curatedPages);

      setPages(generatedPages);

      // Update cover with month info
      setCover((current) => ({
        ...current,
        title: child?.name
          ? `${child.name}'s ${monthName} ${yearStr}`
          : `${monthName} ${yearStr} Memories`,
        dateRange: `${monthName} ${yearStr}`,
      }));
    } finally {
      setIsGenerating(false);
    }
  }, [entries, selectedMonth, child]);

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

  const updateCover = useCallback((updates: Partial<BookCover>) => {
    setCover((current) => ({ ...current, ...updates }));
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
      // Generate HTML content for the photo book with cover and selected layout
      const html = generatePhotoBookHtml(pages, cover, selectedLayout);

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
  }, [canExportPdf, pages, cover, selectedLayout, child?.name]);

  return (
    <PhotoBookContext.Provider
      value={{
        pages,
        selectedLayout,
        cover,
        isGenerating,
        isExporting,
        canExportPdf,
        // BOOK-001: Monthly curation state
        monthlyBookEnabled,
        selectedMonth,
        generatePhotoBook,
        // BOOK-001: Monthly curation methods
        generateMonthlyBook,
        setMonthlyBookEnabled,
        setSelectedMonth,
        reorderPage,
        removePage,
        addPage,
        updatePageCaption,
        setSelectedLayout,
        updateCover,
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
