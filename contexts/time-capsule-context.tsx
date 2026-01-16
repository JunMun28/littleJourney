import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export type CapsuleStatus = "sealed" | "unlocked" | "opened_early";
export type UnlockType = "age" | "custom_date";

// Preset unlock ages per PRD CAPSULE-001
export const PRESET_UNLOCK_AGES = [5, 10, 18, 21] as const;
export type PresetUnlockAge = (typeof PRESET_UNLOCK_AGES)[number];

export interface TimeCapsule {
  id: string;
  letterContent: string;
  attachedPhotoUris?: string[];
  voiceMessageUri?: string; // CAPSULE-002: Voice recording
  videoMessageUri?: string; // CAPSULE-003: Video message
  unlockType: UnlockType;
  unlockAge?: number; // Age when capsule unlocks (if unlockType === 'age')
  unlockDate?: string; // ISO date string (if unlockType === 'custom_date')
  status: CapsuleStatus;
  sealedAt: string; // ISO timestamp when capsule was sealed
  unlockedAt?: string; // ISO timestamp when capsule was unlocked
  createdAt: string;
  updatedAt: string;
  childId?: string; // Reference to child this capsule is for
}

export interface NewTimeCapsule {
  letterContent: string;
  attachedPhotoUris?: string[];
  voiceMessageUri?: string;
  videoMessageUri?: string;
  unlockType: UnlockType;
  unlockAge?: number;
  unlockDate?: string;
  childId?: string;
}

interface TimeCapsuleContextValue {
  capsules: TimeCapsule[];
  createCapsule: (capsule: NewTimeCapsule) => TimeCapsule;
  getCapsule: (id: string) => TimeCapsule | undefined;
  getSealedCapsules: () => TimeCapsule[];
  getUnlockedCapsules: () => TimeCapsule[];
  forceUnlock: (id: string) => void; // CAPSULE-007: Emergency unlock
}

const TimeCapsuleContext = createContext<TimeCapsuleContextValue | null>(null);

interface TimeCapsuleProviderProps {
  children: ReactNode;
}

function generateId(): string {
  return `capsule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function TimeCapsuleProvider({ children }: TimeCapsuleProviderProps) {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);

  const createCapsule = useCallback(
    (newCapsule: NewTimeCapsule): TimeCapsule => {
      const now = new Date().toISOString();
      const capsule: TimeCapsule = {
        ...newCapsule,
        id: generateId(),
        status: "sealed", // CAPSULE-004: Capsules are sealed immediately on creation
        sealedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      // TODO: Persist to backend/storage
      setCapsules((prev) => [capsule, ...prev]); // Newest first
      return capsule;
    },
    [],
  );

  const getCapsule = useCallback(
    (id: string): TimeCapsule | undefined => {
      return capsules.find((capsule) => capsule.id === id);
    },
    [capsules],
  );

  const getSealedCapsules = useCallback((): TimeCapsule[] => {
    return capsules.filter((capsule) => capsule.status === "sealed");
  }, [capsules]);

  const getUnlockedCapsules = useCallback((): TimeCapsule[] => {
    return capsules.filter(
      (capsule) =>
        capsule.status === "unlocked" || capsule.status === "opened_early",
    );
  }, [capsules]);

  const forceUnlock = useCallback((id: string): void => {
    const now = new Date().toISOString();
    // TODO: Persist to backend/storage
    setCapsules((prev) =>
      prev.map((capsule) =>
        capsule.id === id
          ? {
              ...capsule,
              status: "opened_early" as CapsuleStatus,
              unlockedAt: now,
              updatedAt: now,
            }
          : capsule,
      ),
    );
  }, []);

  const value: TimeCapsuleContextValue = useMemo(
    () => ({
      capsules,
      createCapsule,
      getCapsule,
      getSealedCapsules,
      getUnlockedCapsules,
      forceUnlock,
    }),
    [
      capsules,
      createCapsule,
      getCapsule,
      getSealedCapsules,
      getUnlockedCapsules,
      forceUnlock,
    ],
  );

  return (
    <TimeCapsuleContext.Provider value={value}>
      {children}
    </TimeCapsuleContext.Provider>
  );
}

export function useTimeCapsules(): TimeCapsuleContextValue {
  const context = useContext(TimeCapsuleContext);
  if (context === null) {
    throw new Error(
      "useTimeCapsules must be used within a TimeCapsuleProvider",
    );
  }
  return context;
}
