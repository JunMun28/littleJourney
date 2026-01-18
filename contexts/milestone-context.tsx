import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { CulturalTradition } from "./child-context";

export interface MilestoneTemplate {
  id: string;
  title: string;
  titleLocal?: string; // e.g., "满月" for Full Month
  description: string;
  culturalTradition: CulturalTradition | "universal";
  daysFromBirth?: number; // For auto-calculating milestone date
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
  createdAt: string;
  updatedAt: string;
}

export interface AddMilestoneInput {
  templateId?: string;
  childId: string;
  milestoneDate: string;
  customTitle?: string;
  customDescription?: string;
}

export interface CompleteMilestoneInput {
  celebrationDate?: string;
  photoUri?: string;
  notes?: string;
}

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

  // Universal Milestones
  {
    id: "first_smile",
    title: "First Smile",
    description: "Baby's first social smile",
    culturalTradition: "universal",
  },
  {
    id: "first_laugh",
    title: "First Laugh",
    description: "Baby's first laugh out loud",
    culturalTradition: "universal",
  },
  {
    id: "first_steps",
    title: "First Steps",
    description: "Baby's first independent steps",
    culturalTradition: "universal",
  },
  {
    id: "first_words",
    title: "First Words",
    description: "Baby's first meaningful words",
    culturalTradition: "universal",
  },
  {
    id: "first_tooth",
    title: "First Tooth",
    description: "Baby's first tooth appears",
    culturalTradition: "universal",
  },
  {
    id: "first_haircut",
    title: "First Haircut",
    description: "Baby's first haircut",
    culturalTradition: "universal",
  },
  {
    id: "first_day_school",
    title: "First Day of School",
    description: "Starting preschool or childcare",
    culturalTradition: "universal",
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
