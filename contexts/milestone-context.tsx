import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { CulturalTradition } from "./child-context";

// AIDETECT-007: Typical age range for developmental milestones
export interface TypicalAgeRange {
  min: number; // Minimum typical age in months
  max: number; // Maximum typical age in months
}

export interface MilestoneTemplate {
  id: string;
  title: string;
  titleLocal?: string; // e.g., "满月" for Full Month
  description: string;
  culturalTradition: CulturalTradition | "universal";
  daysFromBirth?: number; // For auto-calculating milestone date
  typicalAgeMonths?: TypicalAgeRange; // AIDETECT-007: Typical age range for developmental milestones
}

// Supported languages for bilingual first words (SGLOCAL-002)
export type FirstWordLanguage = "english" | "mandarin" | "malay" | "tamil";

export interface FirstWordData {
  word: string; // The word in original language
  romanization?: string; // Romanization for non-Latin scripts (e.g., pinyin)
  language: FirstWordLanguage;
}

export interface Milestone {
  id: string;
  templateId?: string; // Reference to template, undefined for custom
  childId: string;
  milestoneDate: string; // ISO date (calculated/traditional date)
  celebrationDate?: string; // ISO date (when actually celebrated)
  customTitle?: string; // For custom milestones
  customDescription?: string;
  isCompleted: boolean;
  photoUri?: string;
  notes?: string;
  // Bilingual first words support (SGLOCAL-002)
  firstWordData?: FirstWordData;
  createdAt: string;
  updatedAt: string;
}

export interface AddMilestoneInput {
  templateId?: string;
  childId: string;
  milestoneDate: string;
  customTitle?: string;
  customDescription?: string;
  // Bilingual first words support (SGLOCAL-002)
  firstWordData?: FirstWordData;
}

export interface CompleteMilestoneInput {
  celebrationDate?: string;
  photoUri?: string;
  notes?: string;
}

// SGLOCAL-002: Language labels for display
export const LANGUAGE_LABELS: Record<FirstWordLanguage, string> = {
  english: "English",
  mandarin: "Mandarin (华语)",
  malay: "Malay (Bahasa Melayu)",
  tamil: "Tamil (தமிழ்)",
};

// PRD Section 5.1 - Milestone Templates by Culture
export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  // Chinese Milestones
  {
    id: "full_month",
    title: "Full Month",
    titleLocal: "满月",
    description: "Traditional celebration at 30 days old",
    culturalTradition: "chinese",
    daysFromBirth: 30,
  },
  {
    id: "hundred_days",
    title: "100 Days",
    titleLocal: "百日",
    description: "Celebration of first 100 days",
    culturalTradition: "chinese",
    daysFromBirth: 100,
  },
  {
    id: "zhua_zhou",
    title: "Zhua Zhou",
    titleLocal: "抓周",
    description: "First birthday grab ceremony",
    culturalTradition: "chinese",
    daysFromBirth: 365,
  },
  {
    id: "first_lunar_new_year",
    title: "First Lunar New Year",
    description: "Baby's first Chinese New Year celebration",
    culturalTradition: "chinese",
  },

  // Malay Milestones
  {
    id: "aqiqah",
    title: "Aqiqah",
    description: "Islamic naming ceremony on 7th day",
    culturalTradition: "malay",
    daysFromBirth: 7,
  },
  {
    id: "cukur_jambul",
    title: "Cukur Jambul",
    description: "Head shaving ceremony",
    culturalTradition: "malay",
  },
  {
    id: "first_hari_raya",
    title: "First Hari Raya",
    description: "Baby's first Eid celebration",
    culturalTradition: "malay",
  },

  // Indian Milestones
  {
    id: "naming_ceremony",
    title: "Naming Ceremony",
    description: "Traditional naming ritual",
    culturalTradition: "indian",
  },
  {
    id: "annaprashan",
    title: "Annaprashan",
    description: "First solid food ceremony",
    culturalTradition: "indian",
  },
  {
    id: "first_deepavali",
    title: "First Deepavali",
    description: "Baby's first Diwali celebration",
    culturalTradition: "indian",
  },

  // Universal Milestones (with AIDETECT-007 typical age ranges)
  {
    id: "first_smile",
    title: "First Smile",
    description: "Baby's first social smile",
    culturalTradition: "universal",
    typicalAgeMonths: { min: 1, max: 4 }, // Typically 6-8 weeks to 4 months
  },
  {
    id: "first_laugh",
    title: "First Laugh",
    description: "Baby's first laugh out loud",
    culturalTradition: "universal",
    typicalAgeMonths: { min: 3, max: 6 }, // Typically 3-4 months
  },
  {
    id: "first_steps",
    title: "First Steps",
    description: "Baby's first independent steps",
    culturalTradition: "universal",
    typicalAgeMonths: { min: 9, max: 15 }, // Typically 9-15 months
  },
  {
    id: "first_words",
    title: "First Words",
    description: "Baby's first meaningful words",
    culturalTradition: "universal",
    typicalAgeMonths: { min: 9, max: 15 }, // Typically 9-15 months
  },
  {
    id: "first_tooth",
    title: "First Tooth",
    description: "Baby's first tooth appears",
    culturalTradition: "universal",
    typicalAgeMonths: { min: 4, max: 10 }, // Typically 4-10 months
  },
  {
    id: "first_haircut",
    title: "First Haircut",
    description: "Baby's first haircut",
    culturalTradition: "universal",
    // No typical range - varies by family preference
  },
  {
    id: "first_day_school",
    title: "First Day of School",
    description: "Starting preschool or childcare",
    culturalTradition: "universal",
    typicalAgeMonths: { min: 18, max: 48 }, // Typically 18 months to 4 years
  },

  // Singapore Local Milestones (SGLOCAL-003)
  {
    id: "first_hawker_food",
    title: "First Hawker Food",
    description: "Baby's first meal at a hawker centre",
    culturalTradition: "universal",
  },
  {
    id: "first_mrt_ride",
    title: "First MRT Ride",
    description: "Baby's first ride on the MRT",
    culturalTradition: "universal",
  },
  {
    id: "first_zoo_visit",
    title: "First Zoo Visit",
    description: "Baby's first visit to Singapore Zoo",
    culturalTradition: "universal",
  },
];

interface MilestoneContextValue {
  milestones: Milestone[];
  completedMilestones: Milestone[];
  upcomingMilestones: Milestone[];
  addMilestone: (input: AddMilestoneInput) => Milestone;
  completeMilestone: (id: string, input: CompleteMilestoneInput) => void;
  deleteMilestone: (id: string) => void;
  getMilestonesForChild: (childId: string) => Milestone[];
}

const MilestoneContext = createContext<MilestoneContextValue | null>(null);

interface MilestoneProviderProps {
  children: ReactNode;
}

export function MilestoneProvider({ children }: MilestoneProviderProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const completedMilestones = useMemo(
    () => milestones.filter((m) => m.isCompleted),
    [milestones],
  );

  const upcomingMilestones = useMemo(
    () => milestones.filter((m) => !m.isCompleted),
    [milestones],
  );

  const addMilestone = useCallback((input: AddMilestoneInput): Milestone => {
    const now = new Date().toISOString();
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      templateId: input.templateId,
      childId: input.childId,
      milestoneDate: input.milestoneDate,
      customTitle: input.customTitle,
      customDescription: input.customDescription,
      isCompleted: false,
      firstWordData: input.firstWordData, // SGLOCAL-002: Bilingual first words
      createdAt: now,
      updatedAt: now,
    };
    setMilestones((prev) => [...prev, newMilestone]);
    return newMilestone;
  }, []);

  const completeMilestone = useCallback(
    (id: string, input: CompleteMilestoneInput) => {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                isCompleted: true,
                celebrationDate: input.celebrationDate,
                photoUri: input.photoUri,
                notes: input.notes,
                updatedAt: new Date().toISOString(),
              }
            : m,
        ),
      );
    },
    [],
  );

  const deleteMilestone = useCallback((id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const getMilestonesForChild = useCallback(
    (childId: string) => {
      return milestones.filter((m) => m.childId === childId);
    },
    [milestones],
  );

  const value: MilestoneContextValue = {
    milestones,
    completedMilestones,
    upcomingMilestones,
    addMilestone,
    completeMilestone,
    deleteMilestone,
    getMilestonesForChild,
  };

  return (
    <MilestoneContext.Provider value={value}>
      {children}
    </MilestoneContext.Provider>
  );
}

export function useMilestones(): MilestoneContextValue {
  const context = useContext(MilestoneContext);
  if (context === null) {
    throw new Error("useMilestones must be used within a MilestoneProvider");
  }
  return context;
}

// AIDETECT-007: Helper functions for typical age range comparison

/**
 * Get the typical age range for a milestone template
 * @param templateId - The milestone template ID
 * @returns The typical age range in months, or null if not defined
 */
export function getTypicalAgeRange(templateId: string): TypicalAgeRange | null {
  const template = MILESTONE_TEMPLATES.find((t) => t.id === templateId);
  return template?.typicalAgeMonths ?? null;
}

/**
 * Check if a child's age at milestone completion is within the typical range
 * @param templateId - The milestone template ID
 * @param childAgeMonths - The child's age in months when the milestone was completed
 * @returns true if within range, false if outside range, null if no typical range defined
 */
export function isWithinTypicalRange(
  templateId: string,
  childAgeMonths: number,
): boolean | null {
  const range = getTypicalAgeRange(templateId);
  if (!range) return null;
  return childAgeMonths >= range.min && childAgeMonths <= range.max;
}
