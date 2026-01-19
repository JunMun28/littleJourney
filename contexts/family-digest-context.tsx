import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useEntries, type Entry } from "./entry-context";
import {
  useMilestones,
  type Milestone,
  type MilestoneTemplate,
  MILESTONE_TEMPLATES,
} from "./milestone-context";

// DIGEST-002: Configurable digest frequency
export type DigestFrequency = "daily" | "weekly" | "monthly";

// DIGEST-004: WhatsApp option
export type DeliveryMethod = "email" | "whatsapp";

export interface FamilyMemberDigestConfig {
  familyMemberId: string;
  enabled: boolean;
  frequency: DigestFrequency;
  deliveryMethod: DeliveryMethod;
  // WhatsApp-specific (DIGEST-004)
  whatsappNumber?: string;
  // Tracking
  lastSentAt?: string; // ISO timestamp
  nextScheduledAt?: string; // ISO timestamp
}

// Generated digest content
export interface DigestContent {
  familyMemberId: string;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  entries: Entry[];
  milestones: Milestone[]; // DIGEST-003: Highlighted milestones
  hasMilestones: boolean; // DIGEST-003: Flag for celebratory formatting
  totalPhotos: number;
  totalVideos: number;
  totalVoiceNotes: number;
}

interface FamilyDigestContextValue {
  // Per-member digest configurations
  digestConfigs: FamilyMemberDigestConfig[];

  // Configuration management
  enableDigest: (
    familyMemberId: string,
    frequency: DigestFrequency,
    deliveryMethod: DeliveryMethod,
    whatsappNumber?: string,
  ) => void;
  disableDigest: (familyMemberId: string) => void;
  updateDigestConfig: (
    familyMemberId: string,
    updates: Partial<Omit<FamilyMemberDigestConfig, "familyMemberId">>,
  ) => void;
  getDigestConfig: (
    familyMemberId: string,
  ) => FamilyMemberDigestConfig | undefined;

  // Content generation
  generateDigestContent: (
    familyMemberId: string,
    frequency: DigestFrequency,
  ) => DigestContent | null;
  getEntriesForPeriod: (startDate: string, endDate: string) => Entry[];
  getMilestonesForPeriod: (startDate: string, endDate: string) => Milestone[];
  // DIGEST-003: Get milestone template info for celebratory formatting
  getMilestoneTemplateInfo: (templateId: string) => MilestoneTemplate | null;

  // Sending (mock - actual sending TBD with backend)
  markDigestSent: (familyMemberId: string) => void;
  getNextScheduledDate: (frequency: DigestFrequency, fromDate?: Date) => string;
}

const FamilyDigestContext = createContext<FamilyDigestContextValue | null>(
  null,
);

interface FamilyDigestProviderProps {
  children: ReactNode;
}

// Pure function for calculating period start date
export function calculatePeriodStart(
  frequency: DigestFrequency,
  endDate: Date = new Date(),
): Date {
  const start = new Date(endDate);

  switch (frequency) {
    case "daily":
      start.setDate(start.getDate() - 1);
      break;
    case "weekly":
      start.setDate(start.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(start.getMonth() - 1);
      break;
  }

  return start;
}

// Pure function for calculating next scheduled date
export function calculateNextScheduledDate(
  frequency: DigestFrequency,
  fromDate: Date = new Date(),
): Date {
  const next = new Date(fromDate);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}

export function FamilyDigestProvider({ children }: FamilyDigestProviderProps) {
  const [digestConfigs, setDigestConfigs] = useState<
    FamilyMemberDigestConfig[]
  >([]);
  const { entries } = useEntries();
  const { milestones } = useMilestones();

  const enableDigest = useCallback(
    (
      familyMemberId: string,
      frequency: DigestFrequency,
      deliveryMethod: DeliveryMethod,
      whatsappNumber?: string,
    ) => {
      const nextScheduledAt =
        calculateNextScheduledDate(frequency).toISOString();

      setDigestConfigs((prev) => {
        const existing = prev.find((c) => c.familyMemberId === familyMemberId);
        if (existing) {
          return prev.map((c) =>
            c.familyMemberId === familyMemberId
              ? {
                  ...c,
                  enabled: true,
                  frequency,
                  deliveryMethod,
                  whatsappNumber:
                    deliveryMethod === "whatsapp" ? whatsappNumber : undefined,
                  nextScheduledAt,
                }
              : c,
          );
        }
        return [
          ...prev,
          {
            familyMemberId,
            enabled: true,
            frequency,
            deliveryMethod,
            whatsappNumber:
              deliveryMethod === "whatsapp" ? whatsappNumber : undefined,
            nextScheduledAt,
          },
        ];
      });
    },
    [],
  );

  const disableDigest = useCallback((familyMemberId: string) => {
    setDigestConfigs((prev) =>
      prev.map((c) =>
        c.familyMemberId === familyMemberId
          ? { ...c, enabled: false, nextScheduledAt: undefined }
          : c,
      ),
    );
  }, []);

  const updateDigestConfig = useCallback(
    (
      familyMemberId: string,
      updates: Partial<Omit<FamilyMemberDigestConfig, "familyMemberId">>,
    ) => {
      setDigestConfigs((prev) =>
        prev.map((c) =>
          c.familyMemberId === familyMemberId ? { ...c, ...updates } : c,
        ),
      );
    },
    [],
  );

  const getDigestConfig = useCallback(
    (familyMemberId: string): FamilyMemberDigestConfig | undefined => {
      return digestConfigs.find((c) => c.familyMemberId === familyMemberId);
    },
    [digestConfigs],
  );

  const getEntriesForPeriod = useCallback(
    (startDate: string, endDate: string): Entry[] => {
      const start = new Date(startDate);
      const end = new Date(endDate);

      return entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      });
    },
    [entries],
  );

  const getMilestonesForPeriod = useCallback(
    (startDate: string, endDate: string): Milestone[] => {
      const start = new Date(startDate);
      const end = new Date(endDate);

      return milestones.filter((milestone) => {
        if (!milestone.isCompleted) return false;
        const milestoneDate = new Date(milestone.milestoneDate);
        return milestoneDate >= start && milestoneDate <= end;
      });
    },
    [milestones],
  );

  // DIGEST-003: Get milestone template info for celebratory formatting
  const getMilestoneTemplateInfo = useCallback(
    (templateId: string): MilestoneTemplate | null => {
      return (
        MILESTONE_TEMPLATES.find((template) => template.id === templateId) ??
        null
      );
    },
    [],
  );

  const generateDigestContent = useCallback(
    (
      familyMemberId: string,
      frequency: DigestFrequency,
    ): DigestContent | null => {
      const endDate = new Date();
      const startDate = calculatePeriodStart(frequency, endDate);

      const periodEntries = getEntriesForPeriod(
        startDate.toISOString(),
        endDate.toISOString(),
      );
      const periodMilestones = getMilestonesForPeriod(
        startDate.toISOString(),
        endDate.toISOString(),
      );

      // Return null if no content
      if (periodEntries.length === 0 && periodMilestones.length === 0) {
        return null;
      }

      const totalPhotos = periodEntries.filter(
        (e) => e.type === "photo",
      ).length;
      const totalVideos = periodEntries.filter(
        (e) => e.type === "video",
      ).length;
      const totalVoiceNotes = periodEntries.filter(
        (e) => e.type === "voice",
      ).length;

      return {
        familyMemberId,
        periodStart: startDate.toISOString().split("T")[0],
        periodEnd: endDate.toISOString().split("T")[0],
        entries: periodEntries,
        milestones: periodMilestones,
        hasMilestones: periodMilestones.length > 0, // DIGEST-003
        totalPhotos,
        totalVideos,
        totalVoiceNotes,
      };
    },
    [getEntriesForPeriod, getMilestonesForPeriod],
  );

  const markDigestSent = useCallback((familyMemberId: string) => {
    setDigestConfigs((prev) =>
      prev.map((c) => {
        if (c.familyMemberId !== familyMemberId) return c;
        const nextScheduledAt = calculateNextScheduledDate(
          c.frequency,
        ).toISOString();
        return {
          ...c,
          lastSentAt: new Date().toISOString(),
          nextScheduledAt,
        };
      }),
    );
  }, []);

  const getNextScheduledDate = useCallback(
    (frequency: DigestFrequency, fromDate?: Date): string => {
      return calculateNextScheduledDate(frequency, fromDate).toISOString();
    },
    [],
  );

  const value = useMemo(
    (): FamilyDigestContextValue => ({
      digestConfigs,
      enableDigest,
      disableDigest,
      updateDigestConfig,
      getDigestConfig,
      generateDigestContent,
      getEntriesForPeriod,
      getMilestonesForPeriod,
      getMilestoneTemplateInfo, // DIGEST-003
      markDigestSent,
      getNextScheduledDate,
    }),
    [
      digestConfigs,
      enableDigest,
      disableDigest,
      updateDigestConfig,
      getDigestConfig,
      generateDigestContent,
      getEntriesForPeriod,
      getMilestonesForPeriod,
      getMilestoneTemplateInfo,
      markDigestSent,
      getNextScheduledDate,
    ],
  );

  return (
    <FamilyDigestContext.Provider value={value}>
      {children}
    </FamilyDigestContext.Provider>
  );
}

export function useFamilyDigest(): FamilyDigestContextValue {
  const context = useContext(FamilyDigestContext);
  if (context === null) {
    throw new Error(
      "useFamilyDigest must be used within a FamilyDigestProvider",
    );
  }
  return context;
}
