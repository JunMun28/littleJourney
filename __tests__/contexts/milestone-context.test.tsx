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
});
