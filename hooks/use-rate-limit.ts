import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// PRD Section 13.2 Rate Limiting
const HOURLY_LIMIT = 50;
const DAILY_LIMIT = 200;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const STORAGE_KEY = "@littlejourney:uploads";

interface UploadRecord {
  timestamp: number;
}

interface RateLimitState {
  canUpload: boolean;
  hourlyUploads: number;
  dailyUploads: number;
  rateLimitMessage: string | null;
  isLoading: boolean;
  recordUpload: () => Promise<void>;
}

export function useRateLimit(): RateLimitState {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load upload history on mount
  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: UploadRecord[] = JSON.parse(stored);
        // Clean up old entries
        const cleaned = cleanOldEntries(parsed);
        setUploads(cleaned);
      }
    } catch {
      // If loading fails, start fresh
      setUploads([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove entries older than 24 hours
  const cleanOldEntries = (records: UploadRecord[]): UploadRecord[] => {
    const cutoff = Date.now() - DAY_MS;
    return records.filter((r) => r.timestamp > cutoff);
  };

  // Count uploads within time window
  const countUploadsInWindow = (windowMs: number): number => {
    const cutoff = Date.now() - windowMs;
    return uploads.filter((r) => r.timestamp > cutoff).length;
  };

  const hourlyUploads = countUploadsInWindow(HOUR_MS);
  const dailyUploads = countUploadsInWindow(DAY_MS);

  const isHourlyLimitReached = hourlyUploads >= HOURLY_LIMIT;
  const isDailyLimitReached = dailyUploads >= DAILY_LIMIT;
  const canUpload = !isHourlyLimitReached && !isDailyLimitReached;

  const rateLimitMessage = isHourlyLimitReached
    ? `You've reached the limit of ${HOURLY_LIMIT} uploads per hour. Please try again later.`
    : isDailyLimitReached
      ? `You've reached the limit of ${DAILY_LIMIT} uploads per day. Please try again tomorrow.`
      : null;

  const recordUpload = useCallback(async () => {
    const now = Date.now();
    const newRecord: UploadRecord = { timestamp: now };

    // Clean old entries and add new one
    const cleaned = cleanOldEntries(uploads);
    const updated = [...cleaned, newRecord];

    setUploads(updated);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage failure shouldn't block upload
      console.warn("Failed to persist upload record");
    }
  }, [uploads]);

  return {
    canUpload,
    hourlyUploads,
    dailyUploads,
    rateLimitMessage,
    isLoading,
    recordUpload,
  };
}
