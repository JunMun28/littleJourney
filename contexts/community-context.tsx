import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// COMMUNITY-001: Anonymous question types
export interface CommunityQuestion {
  id: string;
  text: string;
  isAnonymous: boolean;
  submittedAt: string;
}

export interface CommunityResponse {
  id: string;
  questionId: string;
  text: string;
  isAnonymous: boolean;
  respondedAt: string;
}

export interface QuestionWithResponses extends CommunityQuestion {
  responses: CommunityResponse[];
}

// COMMUNITY-002: Milestone statistics types
export interface AgeBucket {
  ageMonths: number;
  percentage: number;
}

export interface MilestoneStatistics {
  templateId: string;
  distribution: AgeBucket[];
  typicalRangeMonths: {
    min: number;
    max: number;
  };
  totalDataPoints: number;
}

interface CommunityContextValue {
  // State
  communityDataSharingEnabled: boolean;
  sharingExplanation: string;
  questions: CommunityQuestion[];

  // Actions
  setCommunityDataSharingEnabled: (enabled: boolean) => void;

  // COMMUNITY-001: Anonymous questions
  submitQuestion: (text: string) => void;
  getQuestionsWithResponses: () => QuestionWithResponses[];

  // COMMUNITY-002: Statistics
  getMilestoneStatistics: (templateId: string) => MilestoneStatistics | null;
  isWithinNormalRange: (
    templateId: string,
    childAgeMonths: number,
  ) => boolean | null;
}

const SHARING_EXPLANATION =
  "When enabled, anonymized milestone timing data (e.g., age when child reached milestones) " +
  "is shared to help other parents understand typical ranges. Your name, photos, and " +
  "personal details are never shared. You can disable this at any time.";

// COMMUNITY-002: Simulated community milestone statistics
// Based on typical developmental ranges from pediatric literature
// In production, this would come from aggregated anonymized user data
const MILESTONE_STATISTICS_DATA: Record<string, MilestoneStatistics> = {
  first_smile: {
    templateId: "first_smile",
    distribution: [
      { ageMonths: 1, percentage: 15 },
      { ageMonths: 2, percentage: 50 },
      { ageMonths: 3, percentage: 30 },
      { ageMonths: 4, percentage: 5 },
    ],
    typicalRangeMonths: { min: 1, max: 4 },
    totalDataPoints: 2847,
  },
  first_laugh: {
    templateId: "first_laugh",
    distribution: [
      { ageMonths: 3, percentage: 20 },
      { ageMonths: 4, percentage: 45 },
      { ageMonths: 5, percentage: 25 },
      { ageMonths: 6, percentage: 10 },
    ],
    typicalRangeMonths: { min: 3, max: 6 },
    totalDataPoints: 2156,
  },
  first_steps: {
    templateId: "first_steps",
    distribution: [
      { ageMonths: 9, percentage: 5 },
      { ageMonths: 10, percentage: 10 },
      { ageMonths: 11, percentage: 20 },
      { ageMonths: 12, percentage: 30 },
      { ageMonths: 13, percentage: 20 },
      { ageMonths: 14, percentage: 10 },
      { ageMonths: 15, percentage: 5 },
    ],
    typicalRangeMonths: { min: 9, max: 15 },
    totalDataPoints: 3421,
  },
  first_words: {
    templateId: "first_words",
    distribution: [
      { ageMonths: 9, percentage: 5 },
      { ageMonths: 10, percentage: 15 },
      { ageMonths: 11, percentage: 25 },
      { ageMonths: 12, percentage: 30 },
      { ageMonths: 13, percentage: 15 },
      { ageMonths: 14, percentage: 7 },
      { ageMonths: 15, percentage: 3 },
    ],
    typicalRangeMonths: { min: 9, max: 15 },
    totalDataPoints: 2978,
  },
  first_tooth: {
    templateId: "first_tooth",
    distribution: [
      { ageMonths: 4, percentage: 5 },
      { ageMonths: 5, percentage: 10 },
      { ageMonths: 6, percentage: 30 },
      { ageMonths: 7, percentage: 25 },
      { ageMonths: 8, percentage: 15 },
      { ageMonths: 9, percentage: 10 },
      { ageMonths: 10, percentage: 5 },
    ],
    typicalRangeMonths: { min: 4, max: 10 },
    totalDataPoints: 2654,
  },
};

// COMMUNITY-001: Mock responses to simulate community interaction
// In production, this would come from a backend API
const MOCK_RESPONSES: string[] = [
  "Every child is different! My little one took their time too and is now running around perfectly fine.",
  "I asked my pediatrician the same thing - they said the typical range is quite wide and not to worry unless there are other concerns.",
  "Our baby did the same. The doctor said it's completely normal. Try not to compare too much with other kids!",
  "This is more common than you think. My first was early, second was late. Both are healthy now!",
  "Talked to our child development specialist about this. They mentioned that as long as baby is progressing, the exact timing varies a lot.",
];

const CommunityContext = createContext<CommunityContextValue | null>(null);

interface CommunityProviderProps {
  children: ReactNode;
}

export function CommunityProvider({ children }: CommunityProviderProps) {
  // Default OFF per PRD requirement (COMMUNITY-003: "Verify default is OFF")
  const [communityDataSharingEnabled, setCommunityDataSharingEnabledState] =
    useState(false);

  // COMMUNITY-001: Questions state
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);

  const setCommunityDataSharingEnabled = useCallback((enabled: boolean) => {
    setCommunityDataSharingEnabledState(enabled);
  }, []);

  // COMMUNITY-001: Submit anonymous question
  const submitQuestion = useCallback((text: string) => {
    const newQuestion: CommunityQuestion = {
      id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      isAnonymous: true,
      submittedAt: new Date().toISOString(),
    };
    setQuestions((prev) => [...prev, newQuestion]);
  }, []);

  // COMMUNITY-001: Get questions with mock responses
  const getQuestionsWithResponses = useCallback((): QuestionWithResponses[] => {
    return questions.map((question) => {
      // Generate 2-3 mock responses per question
      const numResponses = 2 + Math.floor(Math.random() * 2);
      const shuffled = [...MOCK_RESPONSES].sort(() => Math.random() - 0.5);
      const responses: CommunityResponse[] = shuffled
        .slice(0, numResponses)
        .map((text, index) => ({
          id: `response_${question.id}_${index}`,
          questionId: question.id,
          text,
          isAnonymous: true,
          respondedAt: new Date(
            new Date(question.submittedAt).getTime() + (index + 1) * 3600000,
          ).toISOString(),
        }));
      return { ...question, responses };
    });
  }, [questions]);

  // COMMUNITY-002: Get milestone statistics
  const getMilestoneStatistics = useCallback(
    (templateId: string): MilestoneStatistics | null => {
      // Only show statistics when sharing is enabled (respects privacy opt-in)
      if (!communityDataSharingEnabled) {
        return null;
      }
      return MILESTONE_STATISTICS_DATA[templateId] ?? null;
    },
    [communityDataSharingEnabled],
  );

  // COMMUNITY-002: Check if child's milestone completion is within normal range
  const isWithinNormalRange = useCallback(
    (templateId: string, childAgeMonths: number): boolean | null => {
      if (!communityDataSharingEnabled) {
        return null;
      }
      const stats = MILESTONE_STATISTICS_DATA[templateId];
      if (!stats) {
        return null;
      }
      return (
        childAgeMonths >= stats.typicalRangeMonths.min &&
        childAgeMonths <= stats.typicalRangeMonths.max
      );
    },
    [communityDataSharingEnabled],
  );

  const value: CommunityContextValue = useMemo(
    () => ({
      communityDataSharingEnabled,
      sharingExplanation: SHARING_EXPLANATION,
      questions,
      setCommunityDataSharingEnabled,
      submitQuestion,
      getQuestionsWithResponses,
      getMilestoneStatistics,
      isWithinNormalRange,
    }),
    [
      communityDataSharingEnabled,
      questions,
      setCommunityDataSharingEnabled,
      submitQuestion,
      getQuestionsWithResponses,
      getMilestoneStatistics,
      isWithinNormalRange,
    ],
  );

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity(): CommunityContextValue {
  const context = useContext(CommunityContext);
  if (context === null) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
}
