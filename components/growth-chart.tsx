import { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Circle, Line, G, Text as SvgText, Rect } from "react-native-svg";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, PRIMARY_COLOR, SemanticColors, Spacing } from "@/constants/theme";
import type { GrowthMeasurement, MeasurementType, PercentileStandard } from "@/contexts/growth-tracking-context";

// WHO Growth Standard Reference Data (percentile boundaries)
// Values represent measurement at given percentile for age in months
interface PercentileData {
  age: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

// WHO Height for Boys 0-24 months (cm)
const WHO_HEIGHT_BOYS: PercentileData[] = [
  { age: 0, p3: 46.1, p15: 47.9, p50: 49.9, p85: 51.8, p97: 53.7 },
  { age: 3, p3: 57.3, p15: 59.4, p50: 61.4, p85: 63.5, p97: 65.5 },
  { age: 6, p3: 63.3, p15: 65.5, p50: 67.6, p85: 69.8, p97: 71.9 },
  { age: 9, p3: 68.0, p15: 70.1, p50: 72.0, p85: 74.2, p97: 76.5 },
  { age: 12, p3: 71.0, p15: 73.4, p50: 75.7, p85: 78.1, p97: 80.5 },
  { age: 18, p3: 76.9, p15: 79.6, p50: 82.3, p85: 85.0, p97: 87.7 },
  { age: 24, p3: 81.7, p15: 84.6, p50: 87.8, p85: 91.0, p97: 94.0 },
];

// WHO Height for Girls 0-24 months (cm)
const WHO_HEIGHT_GIRLS: PercentileData[] = [
  { age: 0, p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
  { age: 3, p3: 55.6, p15: 57.7, p50: 59.8, p85: 61.9, p97: 64.0 },
  { age: 6, p3: 61.2, p15: 63.5, p50: 65.7, p85: 67.9, p97: 70.1 },
  { age: 9, p3: 65.7, p15: 68.0, p50: 70.1, p85: 72.4, p97: 74.7 },
  { age: 12, p3: 68.9, p15: 71.4, p50: 74.0, p85: 76.6, p97: 79.2 },
  { age: 18, p3: 74.9, p15: 77.8, p50: 80.7, p85: 83.6, p97: 86.5 },
  { age: 24, p3: 80.0, p15: 83.2, p50: 86.4, p85: 89.6, p97: 92.9 },
];

// WHO Weight for Boys 0-24 months (kg)
const WHO_WEIGHT_BOYS: PercentileData[] = [
  { age: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.4 },
  { age: 3, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  { age: 6, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.8 },
  { age: 9, p3: 7.1, p15: 8.0, p50: 8.9, p85: 9.9, p97: 11.0 },
  { age: 12, p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 12.0 },
  { age: 18, p3: 8.6, p15: 9.7, p50: 10.9, p85: 12.2, p97: 13.7 },
  { age: 24, p3: 9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.3 },
];

// WHO Weight for Girls 0-24 months (kg)
const WHO_WEIGHT_GIRLS: PercentileData[] = [
  { age: 0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { age: 3, p3: 4.5, p15: 5.2, p50: 5.8, p85: 6.6, p97: 7.5 },
  { age: 6, p3: 5.7, p15: 6.5, p50: 7.3, p85: 8.2, p97: 9.3 },
  { age: 9, p3: 6.5, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.5 },
  { age: 12, p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.1, p97: 11.5 },
  { age: 18, p3: 7.9, p15: 9.0, p50: 10.2, p85: 11.6, p97: 13.2 },
  { age: 24, p3: 9.0, p15: 10.2, p50: 11.5, p85: 13.0, p97: 14.8 },
];

// Singapore Height for Boys 0-24 months (cm)
const SG_HEIGHT_BOYS: PercentileData[] = [
  { age: 0, p3: 45.8, p15: 47.5, p50: 49.5, p85: 51.4, p97: 53.2 },
  { age: 3, p3: 56.8, p15: 58.8, p50: 60.8, p85: 62.9, p97: 64.9 },
  { age: 6, p3: 62.8, p15: 64.9, p50: 67.0, p85: 69.2, p97: 71.3 },
  { age: 9, p3: 67.5, p15: 69.5, p50: 71.4, p85: 73.6, p97: 75.9 },
  { age: 12, p3: 70.5, p15: 72.8, p50: 75.1, p85: 77.5, p97: 79.9 },
  { age: 18, p3: 76.3, p15: 79.0, p50: 81.7, p85: 84.4, p97: 87.1 },
  { age: 24, p3: 81.1, p15: 84.0, p50: 87.2, p85: 90.4, p97: 93.4 },
];

// Singapore Height for Girls 0-24 months (cm)
const SG_HEIGHT_GIRLS: PercentileData[] = [
  { age: 0, p3: 45.1, p15: 46.9, p50: 48.7, p85: 50.6, p97: 52.5 },
  { age: 3, p3: 55.1, p15: 57.1, p50: 59.2, p85: 61.3, p97: 63.4 },
  { age: 6, p3: 60.7, p15: 62.9, p50: 65.1, p85: 67.3, p97: 69.5 },
  { age: 9, p3: 65.2, p15: 67.4, p50: 69.5, p85: 71.8, p97: 74.1 },
  { age: 12, p3: 68.4, p15: 70.8, p50: 73.4, p85: 76.0, p97: 78.6 },
  { age: 18, p3: 74.4, p15: 77.2, p50: 80.1, p85: 83.0, p97: 85.9 },
  { age: 24, p3: 79.5, p15: 82.6, p50: 85.8, p85: 89.0, p97: 92.3 },
];

// Singapore Weight for Boys 0-24 months (kg)
const SG_WEIGHT_BOYS: PercentileData[] = [
  { age: 0, p3: 2.5, p15: 2.9, p50: 3.2, p85: 3.8, p97: 4.3 },
  { age: 3, p3: 4.9, p15: 5.5, p50: 6.2, p85: 7.0, p97: 7.8 },
  { age: 6, p3: 6.2, p15: 6.9, p50: 7.7, p85: 8.6, p97: 9.5 },
  { age: 9, p3: 7.0, p15: 7.8, p50: 8.7, p85: 9.7, p97: 10.7 },
  { age: 12, p3: 7.6, p15: 8.4, p50: 9.4, p85: 10.5, p97: 11.7 },
  { age: 18, p3: 8.4, p15: 9.5, p50: 10.6, p85: 11.9, p97: 13.4 },
  { age: 24, p3: 9.5, p15: 10.6, p50: 11.9, p85: 13.3, p97: 14.9 },
];

// Singapore Weight for Girls 0-24 months (kg)
const SG_WEIGHT_GIRLS: PercentileData[] = [
  { age: 0, p3: 2.4, p15: 2.7, p50: 3.1, p85: 3.6, p97: 4.1 },
  { age: 3, p3: 4.4, p15: 5.0, p50: 5.6, p85: 6.4, p97: 7.3 },
  { age: 6, p3: 5.6, p15: 6.3, p50: 7.1, p85: 8.0, p97: 9.1 },
  { age: 9, p3: 6.4, p15: 7.2, p50: 8.0, p85: 9.1, p97: 10.2 },
  { age: 12, p3: 6.9, p15: 7.7, p50: 8.7, p85: 9.9, p97: 11.2 },
  { age: 18, p3: 7.7, p15: 8.8, p50: 9.9, p85: 11.3, p97: 12.9 },
  { age: 24, p3: 8.8, p15: 10.0, p50: 11.2, p85: 12.7, p97: 14.4 },
];

// WHO Head Circumference for Boys 0-24 months (cm)
const WHO_HEAD_BOYS: PercentileData[] = [
  { age: 0, p3: 32.1, p15: 33.1, p50: 34.5, p85: 35.8, p97: 36.9 },
  { age: 3, p3: 38.3, p15: 39.3, p50: 40.5, p85: 41.7, p97: 42.7 },
  { age: 6, p3: 41.2, p15: 42.2, p50: 43.3, p85: 44.6, p97: 45.6 },
  { age: 9, p3: 43.0, p15: 44.0, p50: 45.2, p85: 46.4, p97: 47.4 },
  { age: 12, p3: 44.3, p15: 45.3, p50: 46.5, p85: 47.7, p97: 48.6 },
  { age: 18, p3: 45.8, p15: 46.8, p50: 48.0, p85: 49.2, p97: 50.2 },
  { age: 24, p3: 46.9, p15: 47.9, p50: 49.0, p85: 50.2, p97: 51.2 },
];

// WHO Head Circumference for Girls 0-24 months (cm)
const WHO_HEAD_GIRLS: PercentileData[] = [
  { age: 0, p3: 31.5, p15: 32.4, p50: 33.9, p85: 35.1, p97: 36.0 },
  { age: 3, p3: 37.4, p15: 38.3, p50: 39.5, p85: 40.7, p97: 41.7 },
  { age: 6, p3: 40.3, p15: 41.2, p50: 42.4, p85: 43.5, p97: 44.4 },
  { age: 9, p3: 42.0, p15: 42.9, p50: 44.0, p85: 45.2, p97: 46.1 },
  { age: 12, p3: 43.2, p15: 44.1, p50: 45.4, p85: 46.5, p97: 47.5 },
  { age: 18, p3: 44.7, p15: 45.6, p50: 46.8, p85: 48.0, p97: 49.0 },
  { age: 24, p3: 45.8, p15: 46.7, p50: 47.8, p85: 49.0, p97: 50.0 },
];

// Singapore Head Circumference for Boys 0-24 months (cm)
const SG_HEAD_BOYS: PercentileData[] = [
  { age: 0, p3: 31.9, p15: 32.9, p50: 34.3, p85: 35.6, p97: 36.7 },
  { age: 3, p3: 38.0, p15: 39.0, p50: 40.2, p85: 41.4, p97: 42.4 },
  { age: 6, p3: 40.9, p15: 41.9, p50: 43.0, p85: 44.3, p97: 45.3 },
  { age: 9, p3: 42.7, p15: 43.7, p50: 44.9, p85: 46.1, p97: 47.1 },
  { age: 12, p3: 44.0, p15: 45.0, p50: 46.2, p85: 47.4, p97: 48.3 },
  { age: 18, p3: 45.5, p15: 46.5, p50: 47.7, p85: 48.9, p97: 49.9 },
  { age: 24, p3: 46.6, p15: 47.6, p50: 48.7, p85: 49.9, p97: 50.9 },
];

// Singapore Head Circumference for Girls 0-24 months (cm)
const SG_HEAD_GIRLS: PercentileData[] = [
  { age: 0, p3: 31.3, p15: 32.2, p50: 33.7, p85: 34.9, p97: 35.8 },
  { age: 3, p3: 37.1, p15: 38.0, p50: 39.2, p85: 40.4, p97: 41.4 },
  { age: 6, p3: 40.0, p15: 40.9, p50: 42.1, p85: 43.2, p97: 44.1 },
  { age: 9, p3: 41.7, p15: 42.6, p50: 43.7, p85: 44.9, p97: 45.8 },
  { age: 12, p3: 42.9, p15: 43.8, p50: 45.1, p85: 46.2, p97: 47.2 },
  { age: 18, p3: 44.4, p15: 45.3, p50: 46.5, p85: 47.7, p97: 48.7 },
  { age: 24, p3: 45.5, p15: 46.4, p50: 47.5, p85: 48.7, p97: 49.7 },
];

const CHART_COLORS = {
  p3: "#FFCDD2", // Light red
  p15: "#FFE0B2", // Light orange
  p50: "#C8E6C9", // Light green
  p85: "#FFE0B2", // Light orange
  p97: "#FFCDD2", // Light red
  dataPoint: PRIMARY_COLOR,
  dataLine: PRIMARY_COLOR,
  axis: "#666666",
  grid: "#E0E0E0",
};

interface GrowthChartProps {
  measurements: GrowthMeasurement[];
  childBirthDate: string;
  childSex: "male" | "female";
  measurementType: MeasurementType;
  standard?: PercentileStandard;
}

// Calculate age in months from birthdate to measurement date
function calculateAgeInMonths(birthDate: string, measurementDate: string): number {
  const birth = new Date(birthDate);
  const measurement = new Date(measurementDate);
  const months =
    (measurement.getFullYear() - birth.getFullYear()) * 12 +
    (measurement.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

// Get percentile range description for a value
function getPercentileRange(
  value: number,
  data: PercentileData[],
  ageMonths: number
): string {
  // Find closest age data point
  const closest = data.reduce((prev, curr) =>
    Math.abs(curr.age - ageMonths) < Math.abs(prev.age - ageMonths) ? curr : prev
  );

  if (value < closest.p3) return "Below 3rd percentile";
  if (value < closest.p15) return "3rd-15th percentile";
  if (value < closest.p50) return "15th-50th percentile";
  if (value < closest.p85) return "50th-85th percentile";
  if (value < closest.p97) return "85th-97th percentile";
  return "Above 97th percentile";
}

export function GrowthChart({
  measurements,
  childBirthDate,
  childSex,
  measurementType,
  standard = "who",
}: GrowthChartProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Filter measurements by type
  const filteredMeasurements = useMemo(
    () => measurements.filter((m) => m.type === measurementType),
    [measurements, measurementType]
  );

  // Get reference data based on sex, measurement type, and standard
  const referenceData = useMemo(() => {
    const useSingapore = standard === "singapore";
    if (measurementType === "height") {
      if (useSingapore) {
        return childSex === "male" ? SG_HEIGHT_BOYS : SG_HEIGHT_GIRLS;
      }
      return childSex === "male" ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
    }
    if (measurementType === "head_circumference") {
      if (useSingapore) {
        return childSex === "male" ? SG_HEAD_BOYS : SG_HEAD_GIRLS;
      }
      return childSex === "male" ? WHO_HEAD_BOYS : WHO_HEAD_GIRLS;
    }
    // Default: weight
    if (useSingapore) {
      return childSex === "male" ? SG_WEIGHT_BOYS : SG_WEIGHT_GIRLS;
    }
    return childSex === "male" ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
  }, [childSex, measurementType, standard]);

  // Calculate chart dimensions
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 80; // Padding for labels
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Calculate data points with ages
  const dataPoints = useMemo(() => {
    return filteredMeasurements.map((m) => ({
      ...m,
      ageMonths: calculateAgeInMonths(childBirthDate, m.date),
    }));
  }, [filteredMeasurements, childBirthDate]);

  // Calculate min/max for axes
  const { minAge, maxAge, minValue, maxValue } = useMemo(() => {
    const ages = dataPoints.map((d) => d.ageMonths);
    const values = dataPoints.map((d) => d.value);
    const refValues = referenceData.flatMap((d) => [d.p3, d.p97]);

    const dataMaxAge = ages.length > 0 ? Math.max(...ages) : 24;

    return {
      minAge: 0,
      maxAge: Math.max(dataMaxAge, 24),
      minValue: Math.min(
        values.length > 0 ? Math.min(...values) : referenceData[0].p3,
        ...refValues
      ) * 0.9,
      maxValue: Math.max(
        values.length > 0 ? Math.max(...values) : referenceData[referenceData.length - 1].p97,
        ...refValues
      ) * 1.1,
    };
  }, [dataPoints, referenceData]);

  // Scale functions
  const scaleX = (age: number) =>
    padding.left + ((age - minAge) / (maxAge - minAge)) * plotWidth;
  const scaleY = (value: number) =>
    padding.top + plotHeight - ((value - minValue) / (maxValue - minValue)) * plotHeight;

  // Generate path for percentile curve
  const generatePath = (percentile: keyof Omit<PercentileData, "age">) => {
    const points = referenceData
      .filter((d) => d.age <= maxAge)
      .map((d) => `${scaleX(d.age)},${scaleY(d[percentile])}`);
    return `M ${points.join(" L ")}`;
  };

  // Get latest measurement for percentile display
  const latestMeasurement = dataPoints.length > 0
    ? dataPoints.reduce((latest, current) =>
        new Date(current.date) > new Date(latest.date) ? current : latest
      )
    : null;

  const currentPercentile = latestMeasurement
    ? getPercentileRange(latestMeasurement.value, referenceData, latestMeasurement.ageMonths)
    : null;

  const unit = measurementType === "weight" ? "kg" : "cm";

  // Empty state
  if (filteredMeasurements.length === 0) {
    return (
      <View testID="growth-chart-container" style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No measurements to display.
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
            Add {measurementType} measurements to see the growth chart.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View testID="growth-chart-container" style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Current Percentile Display */}
      <View testID="current-percentile" style={styles.percentileContainer}>
        <Text style={[styles.percentileLabel, { color: colors.textSecondary }]}>
          Current Percentile
        </Text>
        <Text style={[styles.percentileValue, { color: colors.text }]}>
          {currentPercentile}
        </Text>
        {latestMeasurement && (
          <Text style={[styles.latestValue, { color: PRIMARY_COLOR }]}>
            Latest: {latestMeasurement.value} {unit} at {latestMeasurement.ageMonths} months
          </Text>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Background */}
          <Rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill={colors.backgroundSecondary}
          />

          {/* Grid lines */}
          <G>
            {[0, 6, 12, 18, 24].filter((age) => age <= maxAge).map((age) => (
              <Line
                key={`grid-v-${age}`}
                x1={scaleX(age)}
                y1={padding.top}
                x2={scaleX(age)}
                y2={padding.top + plotHeight}
                stroke={CHART_COLORS.grid}
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            ))}
          </G>

          {/* Percentile curves */}
          <G>
            <Path
              testID="percentile-curve-p3"
              d={generatePath("p3")}
              stroke={CHART_COLORS.p3}
              strokeWidth={2}
              fill="none"
            />
            <Path
              testID="percentile-curve-p15"
              d={generatePath("p15")}
              stroke={CHART_COLORS.p15}
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="5,3"
            />
            <Path
              testID="percentile-curve-p50"
              d={generatePath("p50")}
              stroke={SemanticColors.success}
              strokeWidth={2.5}
              fill="none"
            />
            <Path
              testID="percentile-curve-p85"
              d={generatePath("p85")}
              stroke={CHART_COLORS.p85}
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="5,3"
            />
            <Path
              testID="percentile-curve-p97"
              d={generatePath("p97")}
              stroke={CHART_COLORS.p97}
              strokeWidth={2}
              fill="none"
            />
          </G>

          {/* Data line connecting points */}
          {dataPoints.length > 1 && (
            <Path
              d={`M ${dataPoints
                .sort((a, b) => a.ageMonths - b.ageMonths)
                .map((d) => `${scaleX(d.ageMonths)},${scaleY(d.value)}`)
                .join(" L ")}`}
              stroke={CHART_COLORS.dataLine}
              strokeWidth={2}
              fill="none"
            />
          )}

          {/* Data points */}
          <G>
            {dataPoints.map((point) => (
              <Circle
                key={point.id}
                testID={`data-point-${point.id}`}
                cx={scaleX(point.ageMonths)}
                cy={scaleY(point.value)}
                r={6}
                fill={CHART_COLORS.dataPoint}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </G>

          {/* X-axis labels */}
          <G>
            {[0, 6, 12, 18, 24].filter((age) => age <= maxAge).map((age) => (
              <SvgText
                key={`x-${age}`}
                x={scaleX(age)}
                y={chartHeight - 10}
                fontSize={10}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {age}
              </SvgText>
            ))}
          </G>

          {/* Y-axis labels */}
          <G>
            {[minValue, (minValue + maxValue) / 2, maxValue].map((value, i) => (
              <SvgText
                key={`y-${i}`}
                x={padding.left - 10}
                y={scaleY(value) + 4}
                fontSize={10}
                fill={colors.textSecondary}
                textAnchor="end"
              >
                {value.toFixed(0)}
              </SvgText>
            ))}
          </G>
        </Svg>

        {/* Axis labels */}
        <Text style={[styles.xAxisLabel, { color: colors.textSecondary }]}>
          Age (months)
        </Text>
        <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>
          {measurementType === "height" ? "Height (cm)" : measurementType === "weight" ? "Weight (kg)" : "Head (cm)"}
        </Text>
      </View>

      {/* Legend */}
      <View testID="chart-legend" style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, styles.legendItemSmall]}>
            <View style={[styles.legendLine, { backgroundColor: CHART_COLORS.p3 }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>3rd</Text>
          </View>
          <View style={[styles.legendItem, styles.legendItemSmall]}>
            <View style={[styles.legendLine, { backgroundColor: SemanticColors.success }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>50th</Text>
          </View>
          <View style={[styles.legendItem, styles.legendItemSmall]}>
            <View style={[styles.legendLine, { backgroundColor: CHART_COLORS.p97 }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>97th</Text>
          </View>
          <View style={[styles.legendItem, styles.legendItemSmall]}>
            <View style={[styles.legendDot, { backgroundColor: CHART_COLORS.dataPoint }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Your child</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  percentileContainer: {
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  percentileLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  percentileValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  latestValue: {
    fontSize: 12,
    marginTop: 4,
  },
  chartWrapper: {
    position: "relative",
  },
  xAxisLabel: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
  },
  yAxisLabel: {
    fontSize: 10,
    position: "absolute",
    left: 0,
    top: "50%",
    transform: [{ rotate: "-90deg" }, { translateX: -40 }],
  },
  legend: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendItemSmall: {
    marginHorizontal: Spacing.xs,
  },
  legendLine: {
    width: 16,
    height: 3,
    marginRight: 4,
    borderRadius: 1.5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 12,
  },
});
