import { renderHook, act } from "@testing-library/react-native";
import { useStorage, StorageProvider } from "@/contexts/storage-context";
import { useEntries, EntryProvider } from "@/contexts/entry-context";
import type { ReactNode } from "react";

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
