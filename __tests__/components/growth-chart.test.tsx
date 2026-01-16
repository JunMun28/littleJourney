import React from "react";
import { render, screen } from "@testing-library/react-native";
import { GrowthChart } from "@/components/growth-chart";
import type { GrowthMeasurement, MeasurementType } from "@/contexts/growth-tracking-context";

// Mock react-native-svg components
jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  const Svg = React.forwardRef(({ children, testID, ...props }: { children?: React.ReactNode; testID?: string }, ref: React.Ref<unknown>) =>
    React.createElement(View, { testID: testID || "svg-container", ref, ...props }, children)
  );
  Svg.displayName = "Svg";

  const G = React.forwardRef(({ children, ...props }: { children?: React.ReactNode }, ref: React.Ref<unknown>) =>
    React.createElement(View, { ref, ...props }, children)
  );
  G.displayName = "G";

  const Path = React.forwardRef(({ testID, d, stroke, ...props }: { testID?: string; d?: string; stroke?: string }, ref: React.Ref<unknown>) =>
    React.createElement(View, { testID, accessibilityLabel: d, ref, ...props })
  );
  Path.displayName = "Path";

  const Circle = React.forwardRef(({ testID, cx, cy, r, ...props }: { testID?: string; cx?: number; cy?: number; r?: number }, ref: React.Ref<unknown>) =>
    React.createElement(View, { testID, accessibilityLabel: `circle-${cx}-${cy}`, ref, ...props })
  );
  Circle.displayName = "Circle";

  const Line = React.forwardRef(({ x1, y1, x2, y2, ...props }: { x1?: number; y1?: number; x2?: number; y2?: number }, ref: React.Ref<unknown>) =>
    React.createElement(View, { ref, ...props })
  );
  Line.displayName = "Line";

  const SvgText = React.forwardRef(({ children, ...props }: { children?: React.ReactNode }, ref: React.Ref<unknown>) =>
    React.createElement(Text, { ref, ...props }, children)
  );
  SvgText.displayName = "SvgText";

  const Rect = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(View, { ref, ...props })
  );
  Rect.displayName = "Rect";

  return {
    __esModule: true,
    default: Svg,
    Svg,
    G,
    Path,
    Circle,
    Line,
    Text: SvgText,
    Rect,
  };
});

describe("GrowthChart component (GROWTH-003)", () => {
  const mockMeasurements: GrowthMeasurement[] = [
    {
      id: "m1",
      type: "height",
      value: 50,
      date: "2023-06-15",
      childId: "child-1",
      createdAt: "2023-06-15T00:00:00Z",
      updatedAt: "2023-06-15T00:00:00Z",
    },
    {
      id: "m2",
      type: "height",
      value: 62,
      date: "2023-09-15",
      childId: "child-1",
      createdAt: "2023-09-15T00:00:00Z",
      updatedAt: "2023-09-15T00:00:00Z",
    },
    {
      id: "m3",
      type: "height",
      value: 68,
      date: "2023-12-15",
      childId: "child-1",
      createdAt: "2023-12-15T00:00:00Z",
      updatedAt: "2023-12-15T00:00:00Z",
    },
  ];

  const mockWeightMeasurements: GrowthMeasurement[] = [
    {
      id: "w1",
      type: "weight",
      value: 3.5,
      date: "2023-06-15",
      childId: "child-1",
      createdAt: "2023-06-15T00:00:00Z",
      updatedAt: "2023-06-15T00:00:00Z",
    },
    {
      id: "w2",
      type: "weight",
      value: 6.5,
      date: "2023-09-15",
      childId: "child-1",
      createdAt: "2023-09-15T00:00:00Z",
      updatedAt: "2023-09-15T00:00:00Z",
    },
  ];

  const defaultProps = {
    measurements: mockMeasurements,
    childBirthDate: "2023-06-15",
    childSex: "male" as const,
    measurementType: "height" as MeasurementType,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // GROWTH-003: View growth chart
  it("renders chart container", () => {
    render(<GrowthChart {...defaultProps} />);
    expect(screen.getByTestId("growth-chart-container")).toBeTruthy();
  });

  // GROWTH-003: Verify WHO percentile curves displayed
  it("displays WHO percentile curves", () => {
    render(<GrowthChart {...defaultProps} />);

    // Should render the percentile curve paths
    expect(screen.getByTestId("percentile-curve-p3")).toBeTruthy();
    expect(screen.getByTestId("percentile-curve-p50")).toBeTruthy();
    expect(screen.getByTestId("percentile-curve-p97")).toBeTruthy();
  });

  // GROWTH-003: Verify child's data points plotted
  it("plots child measurement data points", () => {
    render(<GrowthChart {...defaultProps} />);

    // Should render data points for each measurement
    expect(screen.getByTestId("data-point-m1")).toBeTruthy();
    expect(screen.getByTestId("data-point-m2")).toBeTruthy();
    expect(screen.getByTestId("data-point-m3")).toBeTruthy();
  });

  // GROWTH-003: Verify current percentile shown
  it("shows current percentile text", () => {
    render(<GrowthChart {...defaultProps} />);

    // Should display percentile info
    expect(screen.getByTestId("current-percentile")).toBeTruthy();
  });

  // GROWTH-003: Handle height type
  it("renders height chart with correct axis labels", () => {
    render(<GrowthChart {...defaultProps} measurementType="height" />);

    // Check that cm appears in axis label
    expect(screen.getAllByText(/cm/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/months/i).length).toBeGreaterThan(0);
  });

  // GROWTH-003: Handle weight type
  it("renders weight chart with correct axis labels", () => {
    render(
      <GrowthChart
        {...defaultProps}
        measurements={mockWeightMeasurements}
        measurementType="weight"
      />
    );

    // Check that kg appears in axis label
    expect(screen.getAllByText(/kg/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/months/i).length).toBeGreaterThan(0);
  });

  // GROWTH-003: Handle female child
  it("uses female percentile curves when child sex is female", () => {
    render(<GrowthChart {...defaultProps} childSex="female" />);

    // Chart should render with female reference data
    expect(screen.getByTestId("growth-chart-container")).toBeTruthy();
    expect(screen.getByTestId("percentile-curve-p50")).toBeTruthy();
  });

  // GROWTH-003: Empty state when no measurements
  it("shows empty state message when no measurements", () => {
    render(<GrowthChart {...defaultProps} measurements={[]} />);

    expect(screen.getByText(/no measurements/i)).toBeTruthy();
  });

  // Chart legend
  it("displays chart legend explaining percentile curves", () => {
    render(<GrowthChart {...defaultProps} />);

    expect(screen.getByTestId("chart-legend")).toBeTruthy();
    // Legend should show percentile labels (may appear in both legend and current percentile text)
    expect(screen.getAllByText(/3rd/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/50th/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/97th/i).length).toBeGreaterThan(0);
  });

  // GROWTH-003: Add multiple measurements and view chart
  it("handles multiple measurements over time", () => {
    const multipleMeasurements: GrowthMeasurement[] = [
      ...mockMeasurements,
      {
        id: "m4",
        type: "height",
        value: 75,
        date: "2024-06-15",
        childId: "child-1",
        createdAt: "2024-06-15T00:00:00Z",
        updatedAt: "2024-06-15T00:00:00Z",
      },
    ];

    render(<GrowthChart {...defaultProps} measurements={multipleMeasurements} />);

    expect(screen.getByTestId("data-point-m1")).toBeTruthy();
    expect(screen.getByTestId("data-point-m4")).toBeTruthy();
  });
});
