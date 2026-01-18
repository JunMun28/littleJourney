import { render, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { CommunityProvider, useCommunity } from "@/contexts/community-context";

// Test component that uses the context
function TestConsumer({
  onValues,
}: {
  onValues: (values: ReturnType<typeof useCommunity>) => void;
}) {
  const values = useCommunity();
  onValues(values);
  return <Text testID="test-consumer">Consumer</Text>;
}

function renderWithProvider(
  onValues: (values: ReturnType<typeof useCommunity>) => void,
) {
  return render(
    <CommunityProvider>
      <TestConsumer onValues={onValues} />
    </CommunityProvider>,
  );
}

describe("CommunityContext", () => {
  describe("initial state", () => {
    it("should default communityDataSharingEnabled to false", () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      expect(contextValues).not.toBeNull();
      expect(contextValues!.communityDataSharingEnabled).toBe(false);
    });

    it("should provide explanation text for what is shared", () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      expect(contextValues!.sharingExplanation).toBeDefined();
      expect(contextValues!.sharingExplanation.length).toBeGreaterThan(0);
    });
  });

  describe("setCommunityDataSharingEnabled", () => {
    it("should enable community sharing", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await waitFor(() => {
        expect(contextValues!.communityDataSharingEnabled).toBe(true);
      });
    });

    it("should disable community sharing", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      // First enable
      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      // Then disable
      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(false);
      });

      await waitFor(() => {
        expect(contextValues!.communityDataSharingEnabled).toBe(false);
      });
    });
  });

  describe("useCommunity hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer onValues={() => {}} />);
      }).toThrow("useCommunity must be used within a CommunityProvider");

      consoleSpy.mockRestore();
    });
  });

  // COMMUNITY-002: Milestone statistics
  describe("getMilestoneStatistics", () => {
    it("should return null when community sharing is disabled", () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      expect(contextValues!.communityDataSharingEnabled).toBe(false);
      const stats = contextValues!.getMilestoneStatistics("first_steps");
      expect(stats).toBeNull();
    });

    it("should return statistics when community sharing is enabled", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await waitFor(() => {
        const stats = contextValues!.getMilestoneStatistics("first_steps");
        expect(stats).not.toBeNull();
        expect(stats!.templateId).toBe("first_steps");
        expect(stats!.distribution).toBeDefined();
        expect(stats!.typicalRangeMonths).toBeDefined();
      });
    });

    it("should include distribution data with age buckets", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await waitFor(() => {
        const stats = contextValues!.getMilestoneStatistics("first_steps");
        expect(stats!.distribution.length).toBeGreaterThan(0);
        // Each bucket should have ageMonths and percentage
        expect(stats!.distribution[0].ageMonths).toBeDefined();
        expect(stats!.distribution[0].percentage).toBeDefined();
      });
    });

    it("should include typical range in months", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await waitFor(() => {
        const stats = contextValues!.getMilestoneStatistics("first_steps");
        expect(stats!.typicalRangeMonths.min).toBeDefined();
        expect(stats!.typicalRangeMonths.max).toBeDefined();
        expect(stats!.typicalRangeMonths.min).toBeLessThan(
          stats!.typicalRangeMonths.max,
        );
      });
    });

    it("should return null for unknown milestone template", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await waitFor(() => {
        const stats = contextValues!.getMilestoneStatistics("unknown_template");
        expect(stats).toBeNull();
      });
    });
  });

  describe("isWithinNormalRange", () => {
    it("should return null when community sharing is disabled", () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      const result = contextValues!.isWithinNormalRange("first_steps", 12);
      expect(result).toBeNull();
    });

    it("should return true when child age is within typical range", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await waitFor(() => {
        // First Steps typical range is 9-15 months per PRD
        const result = contextValues!.isWithinNormalRange("first_steps", 12);
        expect(result).toBe(true);
      });
    });

    it("should return false when child age is outside typical range", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await waitFor(() => {
        // 6 months is very early for first steps
        const result = contextValues!.isWithinNormalRange("first_steps", 6);
        expect(result).toBe(false);
      });
    });
  });

  // COMMUNITY-001: Anonymous milestone questions
  describe("submitQuestion", () => {
    it("should submit an anonymous question", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await act(async () => {
        contextValues!.submitQuestion("Is 14 months late for first steps?");
      });

      await waitFor(() => {
        expect(contextValues!.questions.length).toBe(1);
        expect(contextValues!.questions[0].text).toBe(
          "Is 14 months late for first steps?",
        );
        expect(contextValues!.questions[0].isAnonymous).toBe(true);
      });
    });

    it("should assign a unique id to each question", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await act(async () => {
        contextValues!.submitQuestion("Question 1");
        contextValues!.submitQuestion("Question 2");
      });

      await waitFor(() => {
        expect(contextValues!.questions.length).toBe(2);
        expect(contextValues!.questions[0].id).not.toBe(
          contextValues!.questions[1].id,
        );
      });
    });

    it("should include timestamp in question", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      const beforeSubmit = new Date().toISOString();

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await act(async () => {
        contextValues!.submitQuestion("Test question");
      });

      await waitFor(() => {
        expect(contextValues!.questions[0].submittedAt).toBeDefined();
        expect(
          new Date(contextValues!.questions[0].submittedAt).getTime(),
        ).toBeGreaterThanOrEqual(new Date(beforeSubmit).getTime());
      });
    });
  });

  describe("getQuestionsWithResponses", () => {
    it("should return questions with mock responses", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await act(async () => {
        contextValues!.submitQuestion("When should baby start walking?");
      });

      await waitFor(() => {
        const questionsWithResponses =
          contextValues!.getQuestionsWithResponses();
        expect(questionsWithResponses.length).toBe(1);
        // Should have mock responses
        expect(questionsWithResponses[0].responses.length).toBeGreaterThan(0);
      });
    });

    it("should return responses as anonymous", async () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      await act(async () => {
        contextValues!.setCommunityDataSharingEnabled(true);
      });

      await act(async () => {
        contextValues!.submitQuestion("Test question");
      });

      await waitFor(() => {
        const questionsWithResponses =
          contextValues!.getQuestionsWithResponses();
        const responses = questionsWithResponses[0].responses;
        responses.forEach((response) => {
          expect(response.isAnonymous).toBe(true);
        });
      });
    });
  });

  describe("questions state", () => {
    it("should start with empty questions array", () => {
      let contextValues: ReturnType<typeof useCommunity> | null = null;
      renderWithProvider((values) => {
        contextValues = values;
      });

      expect(contextValues!.questions).toEqual([]);
    });
  });
});
