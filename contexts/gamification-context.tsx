import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { useMilestones, MILESTONE_TEMPLATES } from "./milestone-context";
import { useEntries } from "./entry-context";

// Badge types
export type BadgeType = "milestone" | "achievement" | "streak" | "special";

export interface Badge {
  id: string;
  type: BadgeType;
  title: string;
  description: string;
  icon: string; // Emoji icon for display
  linkedMilestoneTemplateId?: string; // For milestone badges
  unlockCondition?: string; // Description of how to unlock
}

// Generate milestone badges from templates
const milestoneBadges: Badge[] = MILESTONE_TEMPLATES.map((template) => ({
  id: `badge_${template.id}`,
  type: "milestone" as BadgeType,
  title: template.title,
  description: `Completed ${template.title} milestone`,
  icon: getMilestoneIcon(template.id),
  linkedMilestoneTemplateId: template.id,
  unlockCondition: `Complete the "${template.title}" milestone`,
}));

// Achievement badges for streaks and goals (GAME-002, GAME-003)
const achievementBadges: Badge[] = [
  {
    id: "badge_first_entry",
    type: "achievement",
    title: "First Memory",
    description: "Created your first journal entry",
    icon: "🌟",
    unlockCondition: "Create your first journal entry",
  },
  {
    id: "badge_week_streak",
    type: "streak",
    title: "Week Warrior",
    description: "7-day journaling streak",
    icon: "🔥",
    unlockCondition: "Journal for 7 consecutive days",
  },
  {
    id: "badge_month_streak",
    type: "streak",
    title: "Monthly Champion",
    description: "30-day journaling streak",
    icon: "💪",
    unlockCondition: "Journal for 30 consecutive days",
  },
  {
    id: "badge_10_entries",
    type: "achievement",
    title: "Memory Keeper",
    description: "Created 10 journal entries",
    icon: "📚",
    unlockCondition: "Create 10 journal entries",
  },
  {
    id: "badge_50_entries",
    type: "achievement",
    title: "Story Teller",
    description: "Created 50 journal entries",
    icon: "📖",
    unlockCondition: "Create 50 journal entries",
  },
  {
    id: "badge_100_entries",
    type: "achievement",
    title: "Memory Master",
    description: "Created 100 journal entries",
    icon: "🏆",
    unlockCondition: "Create 100 journal entries",
  },
  {
    id: "badge_first_year",
    type: "special",
    title: "First Year Complete",
    description: "Completed baby's first year journey",
    icon: "🎂",
    unlockCondition: "Use the app for your child's first year",
  },
  {
    id: "badge_5_milestones",
    type: "achievement",
    title: "Milestone Tracker",
    description: "Completed 5 milestones",
    icon: "⭐",
    unlockCondition: "Complete 5 milestones",
  },
  {
    id: "badge_10_milestones",
    type: "achievement",
    title: "Milestone Master",
    description: "Completed 10 milestones",
    icon: "🌟",
    unlockCondition: "Complete 10 milestones",
  },
];

// All badge definitions
export const BADGE_DEFINITIONS: Badge[] = [
  ...milestoneBadges,
  ...achievementBadges,
];

// Helper to get milestone icon based on template ID
function getMilestoneIcon(templateId: string): string {
  const iconMap: Record<string, string> = {
    // Chinese milestones
    full_month: "🌙",
    hundred_days: "💯",
    zhua_zhou: "🎁",
    first_lunar_new_year: "🧧",
    // Malay milestones
    aqiqah: "🐑",
    cukur_jambul: "✂️",
    first_hari_raya: "🌙",
    // Indian milestones
    naming_ceremony: "📜",
    annaprashan: "🍚",
    first_deepavali: "🪔",
    // Universal milestones
    first_smile: "😊",
    first_laugh: "😄",
    first_steps: "👶",
    first_words: "💬",
    first_tooth: "🦷",
    first_haircut: "💇",
    first_day_school: "🎒",
  };
  return iconMap[templateId] || "🏅";
}

interface GamificationContextValue {
  // All badges
  allBadges: Badge[];
  unlockedBadges: Badge[];
  lockedBadges: Badge[];
  newlyUnlockedBadges: Badge[];
  seenBadgeIds: string[];
  // Counts
  totalBadges: number;
  unlockedCount: number;
  // Methods
  getBadgeById: (id: string) => Badge | undefined;
  isBadgeUnlocked: (badgeId: string) => boolean;
  markBadgeAsSeen: (badgeId: string) => void;
}

const GamificationContext = createContext<GamificationContextValue | null>(
  null,
);

interface GamificationProviderProps {
  children: ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const { completedMilestones } = useMilestones();
  const { entries } = useEntries();

  // Track which badges user has seen (for "new" indicator)
  const [seenBadgeIds, setSeenBadgeIds] = useState<string[]>([]);

  // Calculate unlocked badges based on completed milestones and achievements
  const unlockedBadgeIds = useMemo(() => {
    const unlocked: string[] = [];

    // Milestone badges
    completedMilestones.forEach((milestone) => {
      if (milestone.templateId) {
        unlocked.push(`badge_${milestone.templateId}`);
      }
    });

    // Entry count badges
    const entryCount = entries.length;
    if (entryCount >= 1) unlocked.push("badge_first_entry");
    if (entryCount >= 10) unlocked.push("badge_10_entries");
    if (entryCount >= 50) unlocked.push("badge_50_entries");
    if (entryCount >= 100) unlocked.push("badge_100_entries");

    // Milestone count badges
    const milestoneCount = completedMilestones.length;
    if (milestoneCount >= 5) unlocked.push("badge_5_milestones");
    if (milestoneCount >= 10) unlocked.push("badge_10_milestones");

    // TODO: Streak badges require date tracking (GAME-002)
    // TODO: First year badge requires child birth date comparison (GAME-004)

    return unlocked;
  }, [completedMilestones, entries]);

  const unlockedBadges = useMemo(
    () => BADGE_DEFINITIONS.filter((b) => unlockedBadgeIds.includes(b.id)),
    [unlockedBadgeIds],
  );

  const lockedBadges = useMemo(
    () => BADGE_DEFINITIONS.filter((b) => !unlockedBadgeIds.includes(b.id)),
    [unlockedBadgeIds],
  );

  const newlyUnlockedBadges = useMemo(
    () => unlockedBadges.filter((b) => !seenBadgeIds.includes(b.id)),
    [unlockedBadges, seenBadgeIds],
  );

  const getBadgeById = useCallback((id: string): Badge | undefined => {
    return BADGE_DEFINITIONS.find((b) => b.id === id);
  }, []);

  const isBadgeUnlocked = useCallback(
    (badgeId: string): boolean => {
      return unlockedBadgeIds.includes(badgeId);
    },
    [unlockedBadgeIds],
  );

  const markBadgeAsSeen = useCallback((badgeId: string) => {
    setSeenBadgeIds((prev) => {
      if (prev.includes(badgeId)) return prev;
      return [...prev, badgeId];
    });
  }, []);

  const value: GamificationContextValue = {
    allBadges: BADGE_DEFINITIONS,
    unlockedBadges,
    lockedBadges,
    newlyUnlockedBadges,
    seenBadgeIds,
    totalBadges: BADGE_DEFINITIONS.length,
    unlockedCount: unlockedBadges.length,
    getBadgeById,
    isBadgeUnlocked,
    markBadgeAsSeen,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextValue {
  const context = useContext(GamificationContext);
  if (context === null) {
    throw new Error(
      "useGamification must be used within a GamificationProvider",
    );
  }
  return context;
}
