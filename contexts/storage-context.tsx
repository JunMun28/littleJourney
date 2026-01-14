import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export type SubscriptionTier = "free" | "standard" | "premium";

// PRD Section 12.1 Tier Structure - Storage limits in bytes
export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 500 * 1024 * 1024, // 500MB
  standard: 10 * 1024 * 1024 * 1024, // 10GB
  premium: 50 * 1024 * 1024 * 1024, // 50GB
};

// PRD Section 9.1 - Video duration limits in seconds
export const VIDEO_DURATION_LIMITS: Record<SubscriptionTier, number> = {
  free: 0, // No video
  standard: 2 * 60, // 2 minutes
  premium: 10 * 60, // 10 minutes
};

interface StorageContextValue {
  usedBytes: number;
  limitBytes: number;
  usagePercent: number;
  tier: SubscriptionTier;
  canUpload: (bytes: number) => boolean;
  canUploadVideo: (durationSeconds: number) => boolean;
  addUsage: (bytes: number) => void;
  removeUsage: (bytes: number) => void;
  setTier: (tier: SubscriptionTier) => void;
}

const StorageContext = createContext<StorageContextValue | null>(null);

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [usedBytes, setUsedBytes] = useState(0);
  const [tier, setTierState] = useState<SubscriptionTier>("free");

  const limitBytes = TIER_LIMITS[tier];

  const usagePercent = useMemo(() => {
    if (limitBytes === 0) return 100;
    return Math.round((usedBytes / limitBytes) * 100);
  }, [usedBytes, limitBytes]);

  const canUpload = useCallback(
    (bytes: number): boolean => {
      return usedBytes + bytes <= limitBytes;
    },
    [usedBytes, limitBytes],
  );

  const canUploadVideo = useCallback(
    (durationSeconds: number): boolean => {
      const maxDuration = VIDEO_DURATION_LIMITS[tier];
      return maxDuration > 0 && durationSeconds <= maxDuration;
    },
    [tier],
  );

  const addUsage = useCallback((bytes: number): void => {
    setUsedBytes((prev) => prev + bytes);
    // TODO: Persist to backend
  }, []);

  const removeUsage = useCallback((bytes: number): void => {
    setUsedBytes((prev) => Math.max(0, prev - bytes));
    // TODO: Persist to backend
  }, []);

  const setTier = useCallback((newTier: SubscriptionTier): void => {
    setTierState(newTier);
    // TODO: Persist to backend (handled by Stripe webhook in production)
  }, []);

  const value: StorageContextValue = {
    usedBytes,
    limitBytes,
    usagePercent,
    tier,
    canUpload,
    canUploadVideo,
    addUsage,
    removeUsage,
    setTier,
  };

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}

export function useStorage(): StorageContextValue {
  const context = useContext(StorageContext);
  if (context === null) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
}
