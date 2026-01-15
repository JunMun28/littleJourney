import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRateLimit } from "@/hooks/use-rate-limit";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

describe("useRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
  });

  describe("canUpload", () => {
    it("returns true when no uploads have been made", async () => {
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canUpload).toBe(true);
    });

    it("returns false when hourly limit (50) is reached", async () => {
      const now = Date.now();
      const recentUploads = Array.from({ length: 50 }, (_, i) => ({
        timestamp: now - i * 1000, // 50 uploads in last minute
      }));
      mockGetItem.mockResolvedValue(JSON.stringify(recentUploads));

      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canUpload).toBe(false);
      expect(result.current.hourlyUploads).toBe(50);
    });

    it("returns false when daily limit (200) is reached", async () => {
      const now = Date.now();
      // 200 uploads spread across last 12 hours
      const recentUploads = Array.from({ length: 200 }, (_, i) => ({
        timestamp: now - i * 3 * 60 * 1000, // every 3 minutes
      }));
      mockGetItem.mockResolvedValue(JSON.stringify(recentUploads));

      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canUpload).toBe(false);
      expect(result.current.dailyUploads).toBe(200);
    });

    it("returns true when uploads are outside rate limit windows", async () => {
      const now = Date.now();
      // Old uploads from 2 days ago
      const oldUploads = Array.from({ length: 100 }, (_, i) => ({
        timestamp: now - 48 * 60 * 60 * 1000 - i * 1000,
      }));
      mockGetItem.mockResolvedValue(JSON.stringify(oldUploads));

      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.canUpload).toBe(true);
      expect(result.current.hourlyUploads).toBe(0);
      expect(result.current.dailyUploads).toBe(0);
    });
  });

  describe("recordUpload", () => {
    it("records an upload and increments counts", async () => {
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.recordUpload();
      });

      expect(mockSetItem).toHaveBeenCalled();
      expect(result.current.hourlyUploads).toBe(1);
      expect(result.current.dailyUploads).toBe(1);
    });

    it("cleans up old entries when recording", async () => {
      const now = Date.now();
      // Mix of old and recent uploads
      const uploads = [
        { timestamp: now - 1000 }, // 1 second ago
        { timestamp: now - 48 * 60 * 60 * 1000 }, // 2 days ago (should be cleaned)
      ];
      mockGetItem.mockResolvedValue(JSON.stringify(uploads));

      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.recordUpload();
      });

      // Verify that setItem was called with cleaned data (no 2-day old entry)
      const setItemCall = mockSetItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      // Should have 2 entries: the recent one + new one (old one cleaned)
      expect(savedData.length).toBe(2);
    });
  });

  describe("getRateLimitMessage", () => {
    it("returns hourly message when hourly limit reached", async () => {
      const now = Date.now();
      const recentUploads = Array.from({ length: 50 }, (_, i) => ({
        timestamp: now - i * 1000,
      }));
      mockGetItem.mockResolvedValue(JSON.stringify(recentUploads));

      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rateLimitMessage).toContain("50 uploads per hour");
    });

    it("returns daily message when daily limit reached", async () => {
      const now = Date.now();
      // 200 uploads spread across day, but only 30 in last hour
      const recentUploads = Array.from({ length: 200 }, (_, i) => ({
        timestamp: now - i * 7 * 60 * 1000, // every 7 minutes
      }));
      mockGetItem.mockResolvedValue(JSON.stringify(recentUploads));

      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rateLimitMessage).toContain("200 uploads per day");
    });

    it("returns null when under limits", async () => {
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rateLimitMessage).toBeNull();
    });
  });
});
