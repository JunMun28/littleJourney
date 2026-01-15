import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStorage, StorageProvider } from "@/contexts/storage-context";
import { useEntries, EntryProvider } from "@/contexts/entry-context";
import { useDraft, type Draft } from "@/hooks/use-draft";
import type { ReactNode } from "react";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("On This Day memories", () => {
  const entryWrapper = ({ children }: { children: ReactNode }) => (
    <EntryProvider>{children}</EntryProvider>
  );

  it("should return empty array when no entries from previous years on this day", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    // Add entry from today (current year)
    const today = new Date().toISOString().split("T")[0];
    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Today's entry",
        date: today,
      });
    });

    expect(result.current.getOnThisDayEntries()).toHaveLength(0);
  });

  it("should find entries from same day in previous years", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    // Create date string for same day last year (use string format to avoid TZ issues)
    const today = new Date();
    const year = today.getFullYear() - 1;
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const lastYearDate = `${year}-${month}-${day}`;

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Memory from last year",
        date: lastYearDate,
      });
    });

    const memories = result.current.getOnThisDayEntries();
    expect(memories).toHaveLength(1);
    expect(memories[0].caption).toBe("Memory from last year");
  });

  it("should find entries from multiple previous years", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    // Use string format to avoid TZ issues
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const lastYearDate = `${today.getFullYear() - 1}-${month}-${day}`;
    const twoYearsAgoDate = `${today.getFullYear() - 2}-${month}-${day}`;

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "One year ago",
        date: lastYearDate,
      });
      result.current.addEntry({
        type: "text",
        caption: "Two years ago",
        date: twoYearsAgoDate,
      });
    });

    expect(result.current.getOnThisDayEntries()).toHaveLength(2);
  });

  it("should not include entries from different days in previous years", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    // Use string format to avoid TZ issues - pick a day that's definitely different
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    // Pick day 28 if today is not 28, otherwise pick 27 (safe for all months)
    const differentDay = today.getDate() === 28 ? 27 : 28;
    const differentDayStr = String(differentDay).padStart(2, "0");
    const differentDate = `${today.getFullYear() - 1}-${month}-${differentDayStr}`;

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Different day last year",
        date: differentDate,
      });
    });

    expect(result.current.getOnThisDayEntries()).toHaveLength(0);
  });
});

// Test storage enforcement for entry creation
describe("Feed storage integration", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StorageProvider>{children}</StorageProvider>
  );

  describe("canUpload validation", () => {
    it("should allow upload when under storage limit", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      // Free tier: 500MB limit, 0 used
      expect(result.current.canUpload(100 * 1024 * 1024)).toBe(true); // 100MB
    });

    it("should reject upload when would exceed storage limit", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      // Free tier: 500MB limit
      // Add 450MB usage
      act(() => {
        result.current.addUsage(450 * 1024 * 1024);
      });

      // 100MB more would exceed 500MB limit
      expect(result.current.canUpload(100 * 1024 * 1024)).toBe(false);
      // 50MB should fit
      expect(result.current.canUpload(50 * 1024 * 1024)).toBe(true);
    });
  });

  describe("canUploadVideo validation", () => {
    it("should reject video upload on free tier", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      // Free tier doesn't allow videos
      expect(result.current.canUploadVideo(30)).toBe(false);
      expect(result.current.canUploadVideo(0)).toBe(false);
    });

    it("should allow video under duration limit on standard tier", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      act(() => {
        result.current.setTier("standard");
      });

      // Standard tier: 2 minutes max
      expect(result.current.canUploadVideo(60)).toBe(true); // 1 min
      expect(result.current.canUploadVideo(120)).toBe(true); // 2 min
      expect(result.current.canUploadVideo(121)).toBe(false); // over 2 min
    });

    it("should allow longer video on premium tier", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      act(() => {
        result.current.setTier("premium");
      });

      // Premium tier: 10 minutes max
      expect(result.current.canUploadVideo(300)).toBe(true); // 5 min
      expect(result.current.canUploadVideo(600)).toBe(true); // 10 min
      expect(result.current.canUploadVideo(601)).toBe(false); // over 10 min
    });
  });

  describe("usage tracking after upload", () => {
    it("should track storage after successful upload", () => {
      const { result } = renderHook(() => useStorage(), { wrapper });

      const fileSize = 5 * 1024 * 1024; // 5MB

      act(() => {
        result.current.addUsage(fileSize);
      });

      expect(result.current.usedBytes).toBe(fileSize);
      expect(result.current.usagePercent).toBe(1); // 5MB of 500MB = 1%
    });
  });
});

// Test entry tags feature (PRD Section 3.1, 3.2 step 6)
describe("Entry tags", () => {
  const entryWrapper = ({ children }: { children: ReactNode }) => (
    <EntryProvider>{children}</EntryProvider>
  );

  it("should add entry with tags", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Beach day",
        date: "2026-01-15",
        tags: ["beach", "summer", "family"],
      });
    });

    expect(result.current.entries[0].tags).toEqual([
      "beach",
      "summer",
      "family",
    ]);
  });

  it("should add entry without tags", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "No tags entry",
        date: "2026-01-15",
      });
    });

    expect(result.current.entries[0].tags).toBeUndefined();
  });

  it("should update entry tags", () => {
    const { result } = renderHook(() => useEntries(), {
      wrapper: entryWrapper,
    });

    act(() => {
      result.current.addEntry({
        type: "photo",
        caption: "Entry to update",
        date: "2026-01-15",
        tags: ["original"],
      });
    });

    const entryId = result.current.entries[0].id;

    act(() => {
      result.current.updateEntry(entryId, { tags: ["updated", "new"] });
    });

    expect(result.current.entries[0].tags).toEqual(["updated", "new"]);
  });
});

// Test draft auto-save feature (PRD Section 3.5)
describe("Feed draft auto-save", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  it("should load draft and indicate hasDraft when draft exists", async () => {
    const savedDraft: Draft = {
      type: "photo",
      mediaUris: ["file://photo.jpg"],
      caption: "Test caption",
      date: "2026-01-15",
      savedAt: Date.now(),
    };
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedDraft));

    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasDraft).toBe(true);
    expect(result.current.draft?.type).toBe("photo");
    expect(result.current.draft?.caption).toBe("Test caption");
  });

  it("should save draft with media when creating photo entry", async () => {
    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveDraft({
        type: "photo",
        mediaUris: ["file://photo1.jpg", "file://photo2.jpg"],
        mediaSizes: [1024, 2048],
        caption: "My photos",
        date: "2026-01-15",
      });
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    expect(result.current.draft?.mediaUris).toHaveLength(2);
    expect(result.current.draft?.mediaSizes).toEqual([1024, 2048]);
  });

  it("should clear draft when entry is submitted", async () => {
    const savedDraft: Draft = {
      type: "text",
      caption: "Draft caption",
      date: "2026-01-15",
      savedAt: Date.now(),
    };
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedDraft));

    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true);
    });

    await act(async () => {
      await result.current.clearDraft();
    });

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
      "@littlejourney:draft",
    );
    expect(result.current.draft).toBeNull();
    expect(result.current.hasDraft).toBe(false);
  });
});
