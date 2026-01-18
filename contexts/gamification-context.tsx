import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useMilestones, MILESTONE_TEMPLATES } from "./milestone-context";
import { useEntries } from "./entry-context";

// Badge types
export type BadgeType = "milestone" | "achievement" | "streak" | "special";

// Streak data (GAME-002)
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
}

// Monthly goal data (GAME-003)
export interface MonthlyGoalData {
  currentCount: number;
  goalCount: number;
  isGoalMet: boolean;
  progressPercent: number;
  monthName: string;
}

// Helper to format date as YYYY-MM-DD in local timezone
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Pure function to calculate streak from entry dates
export function calculateStreak(entries: { date: string }[]): StreakData {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastEntryDate: null };
  }

  // Get unique dates sorted descending (newest first)
  const uniqueDates = [...new Set(entries.map((e) => e.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const lastEntryDate = uniqueDates[0];

  // Get today and yesterday in local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateLocal(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateLocal(yesterday);

  let longestStreak = 0;
  let tempStreak = 0;

  // Check if last entry was today or yesterday to have active streak
  const hasActiveStreak =
    lastEntryDate === todayStr || lastEntryDate === yesterdayStr;

  // Calculate all streaks by iterating through sorted dates
  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      // Parse dates and check if consecutive
      const [cY, cM, cD] = uniqueDates[i].split("-").map(Number);
      const [pY, pM, pD] = uniqueDates[i - 1].split("-").map(Number);

      const currentDate = new Date(cY, cM - 1, cD);
      const prevDate = new Date(pY, pM - 1, pD);

      // Check if this date is exactly 1 day before the previous date
      const diffMs = prevDate.getTime() - currentDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        // Streak broken, record longest if needed
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
  }

  // Final longest streak check
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }

  // Calculate current streak (walking back from most recent)
  let currentStreak = 0;
  if (hasActiveStreak) {
    currentStreak = 1;
    const [y, m, d] = lastEntryDate.split("-").map(Number);
    let checkDate = new Date(y, m - 1, d);

    for (let i = 1; i < uniqueDates.length; i++) {
      const expectedPrev = new Date(checkDate);
      expectedPrev.setDate(expectedPrev.getDate() - 1);
      const expectedPrevStr = formatDateLocal(expectedPrev);

      if (uniqueDates[i] === expectedPrevStr) {
        currentStreak++;
        checkDate = expectedPrev;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak, lastEntryDate };
}

// Default monthly goal (GAME-003)
export const DEFAULT_MONTHLY_GOAL = 10;

// Pure function to calculate monthly goal progress
export function calculateMonthlyGoal(
  entries: { date: string }[],
  goalCount: number = DEFAULT_MONTHLY_GOAL,
): MonthlyGoalData {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

  // Count entries in current month
  const currentCount = entries.filter((e) =>
    e.date.startsWith(currentMonth),
  ).length;

  const isGoalMet = currentCount >= goalCount;
  const progressPercent = Math.min(
    100,
    Math.round((currentCount / goalCount) * 100),
  );
  const monthName = now.toLocaleString("en-US", { month: "long" });

  return {
    currentCount,
    goalCount,
    isGoalMet,
    progressPercent,
    monthName,
  };
}

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
  // Monthly goal badge (GAME-003)
  {
    id: "badge_monthly_goal",
    type: "achievement",
    title: "Monthly Champion",
    description: "Reached monthly entry goal",
    icon: "🎯",
    unlockCondition: "Create 10 entries in a single month",
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
  // Streak data (GAME-002)
  streakData: StreakData;
  // Monthly goal data (GAME-003)
  monthlyGoalData: MonthlyGoalData;
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

  // Calculate streak data (GAME-002)
  const streakData = useMemo(() => calculateStreak(entries), [entries]);

  // Calculate monthly goal data (GAME-003)
  const monthlyGoalData = useMemo(
    () => calculateMonthlyGoal(entries),
    [entries],
  );

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

    // Streak badges (GAME-002)
    if (streakData.longestStreak >= 7) unlocked.push("badge_week_streak");
    if (streakData.longestStreak >= 30) unlocked.push("badge_month_streak");

    // Monthly goal badge (GAME-003)
    if (monthlyGoalData.isGoalMet) unlocked.push("badge_monthly_goal");

    // TODO: First year badge requires child birth date comparison (GAME-004)

    return unlocked;
  }, [completedMilestones, entries, streakData, monthlyGoalData]);

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
    streakData,
    monthlyGoalData,
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
