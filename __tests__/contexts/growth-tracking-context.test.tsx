import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  GrowthTrackingProvider,
  useGrowthTracking,
  type MeasurementType,
  type PercentileStandard,
} from "@/contexts/growth-tracking-context";

// Extended test consumer for Singapore standards tests
function TestConsumerWithSingapore() {
  const {
    measurements,
    preferredStandard,
    setPreferredStandard,
    addMeasurement,
    calculatePercentile,
  } = useGrowthTracking();

  // Calculate percentile for first measurement using current standard
  let sgPercentileResult = null;
  if (measurements.length > 0 && measurements[0].type === "height") {
    sgPercentileResult = calculatePercentile(measurements[0], 12, "male");
  }

  return (
    <>
      <Text testID="count">{measurements.length}</Text>
      <Text testID="preferred-standard">{preferredStandard}</Text>
      <Text testID="sg-percentile-desc">
        {sgPercentileResult?.rangeDescription ?? "none"}
      </Text>
      <Text
        testID="set-singapore"
        onPress={() => setPreferredStandard("singapore")}
      >
        Set Singapore
      </Text>
      <Text
        testID="add-sg-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 75.5,
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add SG Height
      </Text>
    </>
  );
}

function TestConsumer() {
  const {
    measurements,
    preferredStandard,
    setPreferredStandard,
    addMeasurement,
    getMeasurements,
    deleteMeasurement,
    calculatePercentile,
    getLatestMeasurement,
  } = useGrowthTracking();

  const child1Measurements = getMeasurements("child-1");
  const child1Heights = getMeasurements("child-1", "height");
  const latestHeight = getLatestMeasurement("child-1", "height");
  const latestWeight = getLatestMeasurement("child-1", "weight");

  // Calculate percentile for first measurement if exists
  let percentileResult = null;
  if (measurements.length > 0 && measurements[0].type === "height") {
    percentileResult = calculatePercentile(measurements[0], 12, "male");
  }

  return (
    <>
      <Text testID="count">{measurements.length}</Text>
      <Text testID="child1-count">{child1Measurements.length}</Text>
      <Text testID="child1-height-count">{child1Heights.length}</Text>
      <Text testID="preferred-standard">{preferredStandard}</Text>
      <Text testID="first-type">{measurements[0]?.type ?? "none"}</Text>
      <Text testID="first-value">{measurements[0]?.value ?? 0}</Text>
      <Text testID="first-childId">{measurements[0]?.childId ?? "none"}</Text>
      <Text testID="latest-height">{latestHeight?.value ?? 0}</Text>
      <Text testID="latest-weight">{latestWeight?.value ?? 0}</Text>
      <Text testID="percentile">
        {percentileResult?.percentile ?? "none"}
      </Text>
      <Text testID="percentile-normal">
        {percentileResult?.isWithinNormalRange?.toString() ?? "none"}
      </Text>
      <Text testID="percentile-desc">
        {percentileResult?.rangeDescription ?? "none"}
      </Text>
      <Text
        testID="add-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 75.5,
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add Height
      </Text>
      <Text
        testID="add-weight"
        onPress={() =>
          addMeasurement({
            type: "weight",
            value: 9.5,
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add Weight
      </Text>
      <Text
        testID="add-head"
        onPress={() =>
          addMeasurement({
            type: "head_circumference",
            value: 46.2,
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add Head
      </Text>
      <Text
        testID="add-height-with-photo"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 78.0,
            date: "2024-07-20",
            childId: "child-1",
            photoUri: "file:///growth-photo.jpg",
          })
        }
      >
        Add Height with Photo
      </Text>
      <Text
        testID="add-child2-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 80.0,
            date: "2024-08-01",
            childId: "child-2",
          })
        }
      >
        Add Child 2 Height
      </Text>
      <Text
        testID="delete-first"
        onPress={() => {
          if (measurements.length > 0) {
            deleteMeasurement(measurements[0].id);
          }
        }}
      >
        Delete First
      </Text>
      <Text
        testID="set-singapore"
        onPress={() => setPreferredStandard("singapore")}
      >
        Set Singapore
      </Text>
      <Text
        testID="add-low-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 68.0, // Below 3rd percentile for 12mo boy
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add Low Height
      </Text>
      <Text
        testID="add-high-height"
        onPress={() =>
          addMeasurement({
            type: "height",
            value: 82.0, // Above 97th percentile for 12mo boy
            date: "2024-06-15",
            childId: "child-1",
          })
        }
      >
        Add High Height
      </Text>
    </>
  );
}

describe("GrowthTrackingContext", () => {
  it("provides empty measurements initially", () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("preferred-standard")).toHaveTextContent("who");
  });

  it("adds a height measurement", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("first-type")).toHaveTextContent("height");
    expect(screen.getByTestId("first-value")).toHaveTextContent("75.5");
    expect(screen.getByTestId("first-childId")).toHaveTextContent("child-1");
  });

  it("adds a weight measurement", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-weight").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-type")).toHaveTextContent("weight");
    });
    expect(screen.getByTestId("first-value")).toHaveTextContent("9.5");
  });

  it("adds a head circumference measurement", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-head").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("first-type")).toHaveTextContent(
        "head_circumference"
      );
    });
    expect(screen.getByTestId("first-value")).toHaveTextContent("46.2");
  });

  it("filters measurements by childId", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress();
    });
    await act(async () => {
      screen.getByTestId("add-child2-height").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });
    expect(screen.getByTestId("child1-count")).toHaveTextContent("1");
  });

  it("filters measurements by type", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress();
    });
    await act(async () => {
      screen.getByTestId("add-weight").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("2");
    });
    expect(screen.getByTestId("child1-height-count")).toHaveTextContent("1");
  });

  it("deletes a measurement", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });

    await act(async () => {
      screen.getByTestId("delete-first").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });
  });

  it("calculates percentile within normal range", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress(); // 75.5cm at 12mo
    });

    await waitFor(() => {
      expect(screen.getByTestId("percentile")).not.toHaveTextContent("none");
    });
    // 75.5cm at 12 months for boy is near 50th percentile (WHO: p50=75.7)
    expect(screen.getByTestId("percentile-normal")).toHaveTextContent("true");
    expect(screen.getByTestId("percentile-desc")).toHaveTextContent(
      "15th-50th percentile"
    );
  });

  it("calculates percentile below normal range", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-low-height").props.onPress(); // 68cm at 12mo
    });

    await waitFor(() => {
      expect(screen.getByTestId("percentile-normal")).toHaveTextContent("false");
    });
    expect(screen.getByTestId("percentile-desc")).toHaveTextContent(
      "Below 3rd percentile"
    );
  });

  it("calculates percentile above normal range", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-high-height").props.onPress(); // 82cm at 12mo
    });

    await waitFor(() => {
      expect(screen.getByTestId("percentile-normal")).toHaveTextContent("false");
    });
    expect(screen.getByTestId("percentile-desc")).toHaveTextContent(
      "Above 97th percentile"
    );
  });

  it("gets latest measurement by type", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    await act(async () => {
      screen.getByTestId("add-height").props.onPress(); // 75.5cm June 15
    });
    await act(async () => {
      screen.getByTestId("add-height-with-photo").props.onPress(); // 78.0cm July 20
    });
    await act(async () => {
      screen.getByTestId("add-weight").props.onPress(); // 9.5kg
    });

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("3");
    });
    // Latest height should be 78.0 (July 20 is after June 15)
    expect(screen.getByTestId("latest-height")).toHaveTextContent("78");
    expect(screen.getByTestId("latest-weight")).toHaveTextContent("9.5");
  });

  it("changes preferred standard", async () => {
    render(
      <GrowthTrackingProvider>
        <TestConsumer />
      </GrowthTrackingProvider>
    );

    expect(screen.getByTestId("preferred-standard")).toHaveTextContent("who");

    await act(async () => {
      screen.getByTestId("set-singapore").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("preferred-standard")).toHaveTextContent(
        "singapore"
      );
    });
  });

  it("throws when useGrowthTracking is used outside GrowthTrackingProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useGrowthTracking must be used within a GrowthTrackingProvider"
    );

    consoleSpy.mockRestore();
  });

  // GROWTH-004: Singapore growth standards tests
  describe("GROWTH-004: Singapore Standards", () => {
    it("defaults to WHO standard", () => {
      render(
        <GrowthTrackingProvider>
          <TestConsumer />
        </GrowthTrackingProvider>
      );

      expect(screen.getByTestId("preferred-standard")).toHaveTextContent("who");
    });

    it("can switch to Singapore standard", async () => {
      render(
        <GrowthTrackingProvider>
          <TestConsumer />
        </GrowthTrackingProvider>
      );

      await act(async () => {
        screen.getByTestId("set-singapore").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("preferred-standard")).toHaveTextContent(
          "singapore"
        );
      });
    });

    it("calculates percentile using Singapore standard when selected", async () => {
      render(
        <GrowthTrackingProvider>
          <TestConsumerWithSingapore />
        </GrowthTrackingProvider>
      );

      // Switch to Singapore standard
      await act(async () => {
        screen.getByTestId("set-singapore").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("preferred-standard")).toHaveTextContent(
          "singapore"
        );
      });

      // Add a height measurement
      await act(async () => {
        screen.getByTestId("add-sg-height").props.onPress();
      });

      // Check that Singapore percentile was calculated
      await waitFor(() => {
        expect(screen.getByTestId("sg-percentile-desc")).not.toHaveTextContent(
          "none"
        );
      });
    });
  });
});
