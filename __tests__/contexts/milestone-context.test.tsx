import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  MilestoneProvider,
  useMilestones,
  type Milestone,
  type MilestoneTemplate,
  MILESTONE_TEMPLATES,
} from "@/contexts/milestone-context";

function TestConsumer() {
  const {
    milestones,
    completedMilestones,
    upcomingMilestones,
    addMilestone,
    completeMilestone,
    deleteMilestone,
    getMilestonesForChild,
  } = useMilestones();

  return (
    <>
      <Text testID="total-count">{milestones.length}</Text>
      <Text testID="completed-count">{completedMilestones.length}</Text>
      <Text testID="upcoming-count">{upcomingMilestones.length}</Text>
      <Text
        testID="add-milestone"
        onPress={() =>
          addMilestone({
            templateId: "full_month",
            childId: "child-1",
            milestoneDate: "2024-07-15",
          })
        }
      >
        Add
      </Text>
      <Text
        testID="add-custom"
        onPress={() =>
          addMilestone({
            childId: "child-1",
            milestoneDate: "2024-08-01",
            customTitle: "First Laugh",
            customDescription: "Baby laughed for the first time",
          })
        }
      >
        Add Custom
      </Text>
      <Text
        testID="complete-first"
        onPress={() => {
          if (milestones[0]) {
            completeMilestone(milestones[0].id, {
              celebrationDate: "2024-07-16",
              photoUri: "photo.jpg",
              notes: "Great celebration!",
            });
          }
        }}
      >
        Complete
      </Text>
      <Text
        testID="delete-first"
        onPress={() => {
          if (milestones[0]) {
            deleteMilestone(milestones[0].id);
          }
        }}
      >
        Delete
      </Text>
      <Text testID="first-title">
        {milestones[0]?.customTitle ??
          MILESTONE_TEMPLATES.find((t) => t.id === milestones[0]?.templateId)
            ?.title ??
          "none"}
      </Text>
      <Text testID="first-completed">
        {milestones[0]?.isCompleted ? "yes" : "no"}
      </Text>
      <Text testID="first-celebration-date">
        {milestones[0]?.celebrationDate ?? "none"}
      </Text>
    </>
  );
}

describe("MilestoneContext", () => {
  it("provides empty milestones initially", () => {
    render(
      <MilestoneProvider>
        <TestConsumer />
      </MilestoneProvider>,
    );

    expect(screen.getByTestId("total-count")).toHaveTextContent("0");
    expect(screen.getByTestId("completed-count")).toHaveTextContent("0");
    expect(screen.getByTestId("upcoming-count")).toHaveTextContent("0");
  });

  it("adds milestone from template", async () => {
    render(
      <MilestoneProvider>
        <TestConsumer />
      </MilestoneProvider>,
    );

    await act(async () => {
      screen.getByTestId("add-milestone").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("total-count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("upcoming-count")).toHaveTextContent("1");
    expect(screen.getByTestId("first-title")).toHaveTextContent("Full Month");
  });

  it("adds custom milestone", async () => {
    render(
      <MilestoneProvider>
        <TestConsumer />
      </MilestoneProvider>,
    );

    await act(async () => {
      screen.getByTestId("add-custom").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("total-count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-title")).toHaveTextContent("First Laugh");
  });

  it("completes milestone with celebration details", async () => {
    render(
      <MilestoneProvider>
        <TestConsumer />
      </MilestoneProvider>,
    );

    // Add milestone first
    await act(async () => {
      screen.getByTestId("add-milestone").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("total-count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-completed")).toHaveTextContent("no");

    // Complete it
    await act(async () => {
      screen.getByTestId("complete-first").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-completed")).toHaveTextContent("yes");
    });
    expect(screen.getByTestId("completed-count")).toHaveTextContent("1");
    expect(screen.getByTestId("upcoming-count")).toHaveTextContent("0");
    expect(screen.getByTestId("first-celebration-date")).toHaveTextContent(
      "2024-07-16",
    );
  });

  it("deletes milestone", async () => {
    render(
      <MilestoneProvider>
        <TestConsumer />
      </MilestoneProvider>,
    );

    // Add milestone first
    await act(async () => {
      screen.getByTestId("add-milestone").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("total-count")).toHaveTextContent("1");
    });

    // Delete it
    await act(async () => {
      screen.getByTestId("delete-first").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("total-count")).toHaveTextContent("0");
    });
  });

  it("throws when useMilestones is used outside MilestoneProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useMilestones must be used within a MilestoneProvider",
    );

    consoleSpy.mockRestore();
  });

  it("provides milestone templates including cultural ones", () => {
    // Chinese milestones
    expect(
      MILESTONE_TEMPLATES.find((t) => t.id === "full_month"),
    ).toBeDefined();
    expect(
      MILESTONE_TEMPLATES.find((t) => t.id === "hundred_days"),
    ).toBeDefined();
    expect(MILESTONE_TEMPLATES.find((t) => t.id === "zhua_zhou")).toBeDefined();

    // Malay milestones
    expect(MILESTONE_TEMPLATES.find((t) => t.id === "aqiqah")).toBeDefined();
    expect(
      MILESTONE_TEMPLATES.find((t) => t.id === "cukur_jambul"),
    ).toBeDefined();

    // Indian milestones
    expect(
      MILESTONE_TEMPLATES.find((t) => t.id === "naming_ceremony"),
    ).toBeDefined();
    expect(
      MILESTONE_TEMPLATES.find((t) => t.id === "annaprashan"),
    ).toBeDefined();

    // Universal milestones
    expect(
      MILESTONE_TEMPLATES.find((t) => t.id === "first_smile"),
    ).toBeDefined();
    expect(
      MILESTONE_TEMPLATES.find((t) => t.id === "first_steps"),
    ).toBeDefined();
  });

  // SGLOCAL-002: Bilingual first words
  describe("bilingual first words (SGLOCAL-002)", () => {
    it("provides LANGUAGE_LABELS constant", () => {
      const { LANGUAGE_LABELS } = require("@/contexts/milestone-context");
      expect(LANGUAGE_LABELS).toBeDefined();
      expect(LANGUAGE_LABELS.english).toBe("English");
      expect(LANGUAGE_LABELS.mandarin).toBe("Mandarin (华语)");
      expect(LANGUAGE_LABELS.malay).toBe("Malay (Bahasa Melayu)");
      expect(LANGUAGE_LABELS.tamil).toBe("Tamil (தமிழ்)");
    });

    it("includes first_words template", () => {
      const template = MILESTONE_TEMPLATES.find((t) => t.id === "first_words");
      expect(template).toBeDefined();
      expect(template?.title).toBe("First Words");
      expect(template?.culturalTradition).toBe("universal");
    });

    it("supports FirstWordLanguage type", () => {
      // TypeScript compile-time check - this will fail to compile if types are wrong
      const languages: Array<
        import("@/contexts/milestone-context").FirstWordLanguage
      > = ["english", "mandarin", "malay", "tamil"];
      expect(languages).toHaveLength(4);
    });

    it("supports FirstWordData in milestone", () => {
      // Type check - FirstWordData structure
      const mockFirstWordData: import("@/contexts/milestone-context").FirstWordData =
        {
          word: "妈妈",
          romanization: "māmā",
          language: "mandarin",
        };
      expect(mockFirstWordData.word).toBe("妈妈");
      expect(mockFirstWordData.romanization).toBe("māmā");
      expect(mockFirstWordData.language).toBe("mandarin");
    });

    it("allows FirstWordData without romanization", () => {
      const mockFirstWordData: import("@/contexts/milestone-context").FirstWordData =
        {
          word: "Mama",
          language: "english",
        };
      expect(mockFirstWordData.word).toBe("Mama");
      expect(mockFirstWordData.romanization).toBeUndefined();
      expect(mockFirstWordData.language).toBe("english");
    });
  });

  // SGLOCAL-003: Singapore-specific milestone templates
  describe("Singapore Local milestones (SGLOCAL-003)", () => {
    it("includes First Hawker Food milestone", () => {
      const template = MILESTONE_TEMPLATES.find(
        (t) => t.id === "first_hawker_food",
      );
      expect(template).toBeDefined();
      expect(template?.title).toBe("First Hawker Food");
      expect(template?.culturalTradition).toBe("universal");
    });

    it("includes First MRT Ride milestone", () => {
      const template = MILESTONE_TEMPLATES.find(
        (t) => t.id === "first_mrt_ride",
      );
      expect(template).toBeDefined();
      expect(template?.title).toBe("First MRT Ride");
      expect(template?.culturalTradition).toBe("universal");
    });

    it("includes First Zoo Visit milestone", () => {
      const template = MILESTONE_TEMPLATES.find(
        (t) => t.id === "first_zoo_visit",
      );
      expect(template).toBeDefined();
      expect(template?.title).toBe("First Zoo Visit");
      expect(template?.culturalTradition).toBe("universal");
    });

    it("all SG local milestones are shown for any cultural tradition", () => {
      const sgMilestones = [
        "first_hawker_food",
        "first_mrt_ride",
        "first_zoo_visit",
      ];
      sgMilestones.forEach((id) => {
        const template = MILESTONE_TEMPLATES.find((t) => t.id === id);
        // Universal milestones appear for all cultural traditions
        expect(template?.culturalTradition).toBe("universal");
      });
    });
  });

  // AIDETECT-007: Milestone comparison to typical ranges
  describe("typical age ranges (AIDETECT-007)", () => {
    it("provides typicalAgeMonths for developmental milestones", () => {
      const firstSteps = MILESTONE_TEMPLATES.find(
        (t) => t.id === "first_steps",
      );
      expect(firstSteps?.typicalAgeMonths).toBeDefined();
      expect(firstSteps?.typicalAgeMonths?.min).toBe(9);
      expect(firstSteps?.typicalAgeMonths?.max).toBe(15);
    });

    it("provides typicalAgeMonths for first_smile", () => {
      const firstSmile = MILESTONE_TEMPLATES.find(
        (t) => t.id === "first_smile",
      );
      expect(firstSmile?.typicalAgeMonths).toBeDefined();
      expect(firstSmile?.typicalAgeMonths?.min).toBe(1);
      expect(firstSmile?.typicalAgeMonths?.max).toBe(4);
    });

    it("provides typicalAgeMonths for first_tooth", () => {
      const firstTooth = MILESTONE_TEMPLATES.find(
        (t) => t.id === "first_tooth",
      );
      expect(firstTooth?.typicalAgeMonths).toBeDefined();
      expect(firstTooth?.typicalAgeMonths?.min).toBe(4);
      expect(firstTooth?.typicalAgeMonths?.max).toBe(10);
    });

    it("exports getTypicalAgeRange helper function", () => {
      const { getTypicalAgeRange } = require("@/contexts/milestone-context");
      expect(getTypicalAgeRange).toBeDefined();
      expect(typeof getTypicalAgeRange).toBe("function");
    });

    it("getTypicalAgeRange returns range for known milestone", () => {
      const { getTypicalAgeRange } = require("@/contexts/milestone-context");
      const range = getTypicalAgeRange("first_steps");
      expect(range).toEqual({ min: 9, max: 15 });
    });

    it("getTypicalAgeRange returns null for milestone without typical range", () => {
      const { getTypicalAgeRange } = require("@/contexts/milestone-context");
      const range = getTypicalAgeRange("full_month");
      expect(range).toBeNull();
    });

    it("exports isWithinTypicalRange helper function", () => {
      const { isWithinTypicalRange } = require("@/contexts/milestone-context");
      expect(isWithinTypicalRange).toBeDefined();
      expect(typeof isWithinTypicalRange).toBe("function");
    });

    it("isWithinTypicalRange returns true when child age is within range", () => {
      const { isWithinTypicalRange } = require("@/contexts/milestone-context");
      // Child completed first steps at 11 months (typical range 9-15)
      expect(isWithinTypicalRange("first_steps", 11)).toBe(true);
    });

    it("isWithinTypicalRange returns false when child age is below range", () => {
      const { isWithinTypicalRange } = require("@/contexts/milestone-context");
      // Child completed first steps at 6 months (early, below typical range 9-15)
      expect(isWithinTypicalRange("first_steps", 6)).toBe(false);
    });

    it("isWithinTypicalRange returns false when child age is above range", () => {
      const { isWithinTypicalRange } = require("@/contexts/milestone-context");
      // Child completed first steps at 18 months (late, above typical range 9-15)
      expect(isWithinTypicalRange("first_steps", 18)).toBe(false);
    });

    it("isWithinTypicalRange returns null for milestone without typical range", () => {
      const { isWithinTypicalRange } = require("@/contexts/milestone-context");
      expect(isWithinTypicalRange("full_month", 1)).toBeNull();
    });
  });
});
