import { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ruler, Scale, Circle } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { GrowthChart } from "@/components/growth-chart";
import {
  useGrowthTracking,
  type GrowthMeasurement,
  type MeasurementType,
} from "@/contexts/growth-tracking-context";
import { useChild } from "@/contexts/child-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  PRIMARY_COLOR,
  Colors,
  SemanticColors,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { Primary, Radius } from "@/constants/design-tokens";
import { FAB } from "@/components/ui/fab";
import { Button } from "@/components/ui/button";
import { Entering } from "@/utils/animations";
import {
  generateAndShareGrowthReport,
  type GrowthReportData,
} from "@/services/growth-report-service";

type ModalState =
  | "closed"
  | "selectType"
  | "addHeight"
  | "addWeight"
  | "addHead"
  | "exportReport";
type ViewMode = "list" | "chart";
type ChartType = "height" | "weight" | "head";
type ExportDateField = "start" | "end" | null;

// Calculate age in months from birthdate to measurement date
function calculateAgeInMonths(
  birthDate: string,
  measurementDate: string,
): number {
  const birth = new Date(birthDate);
  const measurement = new Date(measurementDate);
  const months =
    (measurement.getFullYear() - birth.getFullYear()) * 12 +
    (measurement.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

// Format measurement type for display
function formatMeasurementType(type: MeasurementType): string {
  switch (type) {
    case "height":
      return "Height";
    case "weight":
      return "Weight";
    case "head_circumference":
      return "Head Circumference";
  }
}

// Format value with unit
function formatValueWithUnit(value: number, type: MeasurementType): string {
  switch (type) {
    case "height":
    case "head_circumference":
      return `${value} cm`;
    case "weight":
      return `${value} kg`;
  }
}

// UI-020: Get icon for measurement type
function getMeasurementIcon(type: MeasurementType, color: string) {
  switch (type) {
    case "height":
      return <Ruler size={20} color={color} />;
    case "weight":
      return <Scale size={20} color={color} />;
    case "head_circumference":
      return <Circle size={20} color={color} />;
  }
}

export default function GrowthScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  const { child } = useChild();
  const {
    addMeasurement,
    getMeasurements,
    deleteMeasurement,
    calculatePercentile,
    preferredStandard,
    setPreferredStandard,
  } = useGrowthTracking();

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [measurementValue, setMeasurementValue] = useState("");
  const [measurementDate, setMeasurementDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [chartType, setChartType] = useState<ChartType>("height");

  // Export report state
  const [exportStartDate, setExportStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6); // Default to 6 months ago
    return date;
  });
  const [exportEndDate, setExportEndDate] = useState(new Date());
  const [showExportDatePicker, setShowExportDatePicker] =
    useState<ExportDateField>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Get measurements for current child
  const measurements = useMemo(() => {
    if (!child?.id) return [];
    return getMeasurements(child.id);
  }, [child?.id, getMeasurements]);

  const heightMeasurements = useMemo(() => {
    return measurements.filter((m) => m.type === "height");
  }, [measurements]);

  const weightMeasurements = useMemo(() => {
    return measurements.filter((m) => m.type === "weight");
  }, [measurements]);

  const headMeasurements = useMemo(() => {
    return measurements.filter((m) => m.type === "head_circumference");
  }, [measurements]);

  const hasMeasurements = measurements.length > 0;

  const handleOpenTypeSelector = () => {
    setMeasurementValue("");
    setMeasurementDate(new Date());
    setModalState("selectType");
  };

  const handleSelectHeight = () => {
    setModalState("addHeight");
  };

  const handleSelectWeight = () => {
    setModalState("addWeight");
  };

  const handleSelectHead = () => {
    setModalState("addHead");
  };

  const handleSaveHeight = () => {
    if (!child?.id || !measurementValue.trim()) return;

    const value = parseFloat(measurementValue);
    if (isNaN(value) || value <= 0) return;

    addMeasurement({
      type: "height",
      value,
      date: measurementDate.toISOString().split("T")[0],
      childId: child.id,
    });

    setModalState("closed");
    setMeasurementValue("");
  };

  const handleSaveWeight = () => {
    if (!child?.id || !measurementValue.trim()) return;

    const value = parseFloat(measurementValue);
    if (isNaN(value) || value <= 0) return;

    addMeasurement({
      type: "weight",
      value,
      date: measurementDate.toISOString().split("T")[0],
      childId: child.id,
    });

    setModalState("closed");
    setMeasurementValue("");
  };

  const handleSaveHead = () => {
    if (!child?.id || !measurementValue.trim()) return;

    const value = parseFloat(measurementValue);
    if (isNaN(value) || value <= 0) return;

    addMeasurement({
      type: "head_circumference",
      value,
      date: measurementDate.toISOString().split("T")[0],
      childId: child.id,
    });

    setModalState("closed");
    setMeasurementValue("");
  };

  const handleDeleteMeasurement = (id: string) => {
    deleteMeasurement(id);
  };

  const handleOpenExportModal = () => {
    setModalState("exportReport");
  };

  const handleExportReport = async () => {
    if (!child) return;

    setIsExporting(true);

    // Build percentile data for all measurements
    const percentileData: Record<
      string,
      {
        percentile: number;
        isWithinNormalRange: boolean;
        rangeDescription: string;
      }
    > = {};
    measurements.forEach((m) => {
      if (child.sex && child.dateOfBirth) {
        const ageMonths = calculateAgeInMonths(child.dateOfBirth, m.date);
        const result = calculatePercentile(m, ageMonths, child.sex);
        percentileData[m.id] = result;
      }
    });

    const reportData: GrowthReportData = {
      child: {
        id: child.id,
        name: child.name,
        dateOfBirth: child.dateOfBirth ?? "",
        sex: child.sex,
      },
      measurements,
      percentileData,
      standard: preferredStandard,
      startDate: exportStartDate.toISOString().split("T")[0],
      endDate: exportEndDate.toISOString().split("T")[0],
    };

    const result = await generateAndShareGrowthReport(reportData);

    setIsExporting(false);
    setModalState("closed");

    if (!result.success) {
      Alert.alert("Export Failed", result.error ?? "Unable to generate report");
    }
  };

  const renderMeasurementCard = (
    measurement: GrowthMeasurement,
    index: number,
  ) => {
    const ageMonths = child?.dateOfBirth
      ? calculateAgeInMonths(child.dateOfBirth, measurement.date)
      : null;

    // Calculate percentile if we have child sex
    let percentileInfo = null;
    if (child?.sex && ageMonths !== null) {
      percentileInfo = calculatePercentile(measurement, ageMonths, child.sex);
    }

    // UI-022: Color-coded percentile badge
    const getPercentileBadgeColor = () => {
      if (!percentileInfo) return colors.textSecondary;
      // Green for normal range (15th-85th percentile)
      return percentileInfo.isWithinNormalRange
        ? SemanticColors.success
        : SemanticColors.warning;
    };

    // Format relative date
    const formatRelativeDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 14) return "1 week ago";
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 60) return "1 month ago";
      return `${Math.floor(diffDays / 30)} months ago`;
    };

    return (
      <Animated.View
        key={measurement.id}
        entering={reduceMotion ? undefined : Entering.listItem(index)}
      >
        <Pressable
          style={[
            styles.measurementCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            Shadows.small,
          ]}
          onLongPress={() => handleDeleteMeasurement(measurement.id)}
        >
          <View style={styles.measurementHeader}>
            {/* UI-020: Icon badge for measurement type */}
            <View style={styles.measurementIconRow}>
              <View
                style={[
                  styles.measurementIconBadge,
                  { backgroundColor: Primary[50] },
                ]}
              >
                {getMeasurementIcon(measurement.type, Primary[500])}
              </View>
              <Text style={[styles.measurementType, { color: colors.text }]}>
                {formatMeasurementType(measurement.type)}
              </Text>
            </View>
            <Text style={[styles.measurementValue, { color: PRIMARY_COLOR }]}>
              {formatValueWithUnit(measurement.value, measurement.type)}
            </Text>
          </View>
          <Text
            style={[styles.measurementDate, { color: colors.textSecondary }]}
          >
            {formatRelativeDate(measurement.date)}
            {ageMonths !== null && ` · ${ageMonths} months old`}
          </Text>
          {/* UI-022: Percentile badge with color-coded indicator */}
          {percentileInfo && (
            <View
              style={[
                styles.percentileBadge,
                { backgroundColor: `${getPercentileBadgeColor()}15` },
              ]}
            >
              <Text
                style={[
                  styles.percentileText,
                  { color: getPercentileBadgeColor() },
                ]}
              >
                {percentileInfo.rangeDescription}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📏</Text>
      <ThemedText type="subtitle" style={styles.emptyStateTitle}>
        No Measurements Yet
      </ThemedText>
      <ThemedText
        style={[styles.emptyStateText, { color: colors.textSecondary }]}
      >
        Track your baby&apos;s growth by recording height, weight, and head
        circumference measurements.
      </ThemedText>
      <Button variant="primary" onPress={handleOpenTypeSelector}>
        Add Measurement
      </Button>
    </View>
  );

  const isValidValue =
    measurementValue.trim() !== "" &&
    !isNaN(parseFloat(measurementValue)) &&
    parseFloat(measurementValue) > 0;

  const renderViewModeToggle = () => (
    <View testID="view-mode-toggle" style={styles.viewModeContainer}>
      <View style={styles.viewModeToggle}>
        <Pressable
          style={[
            styles.viewModeButton,
            viewMode === "list" && styles.viewModeButtonActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setViewMode("list")}
        >
          <Text
            style={[
              styles.viewModeButtonText,
              { color: viewMode === "list" ? "#fff" : colors.text },
            ]}
          >
            List
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.viewModeButton,
            viewMode === "chart" && styles.viewModeButtonActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setViewMode("chart")}
        >
          <Text
            style={[
              styles.viewModeButtonText,
              { color: viewMode === "chart" ? "#fff" : colors.text },
            ]}
          >
            Chart
          </Text>
        </Pressable>
      </View>
      <Pressable
        testID="export-report-button"
        style={[styles.exportButton, { borderColor: colors.border }]}
        onPress={handleOpenExportModal}
      >
        <Text style={[styles.exportButtonText, { color: PRIMARY_COLOR }]}>
          Export
        </Text>
      </Pressable>
    </View>
  );

  const renderChartTypeSelector = () => (
    <View testID="chart-type-selector" style={styles.chartTypeSelector}>
      <Pressable
        style={[
          styles.chartTypeButton,
          chartType === "height" && styles.chartTypeButtonActive,
        ]}
        onPress={() => setChartType("height")}
      >
        <Text
          style={[
            styles.chartTypeButtonText,
            {
              color:
                chartType === "height" ? PRIMARY_COLOR : colors.textSecondary,
            },
          ]}
        >
          Height
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.chartTypeButton,
          chartType === "weight" && styles.chartTypeButtonActive,
        ]}
        onPress={() => setChartType("weight")}
      >
        <Text
          style={[
            styles.chartTypeButtonText,
            {
              color:
                chartType === "weight" ? PRIMARY_COLOR : colors.textSecondary,
            },
          ]}
        >
          Weight
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.chartTypeButton,
          chartType === "head" && styles.chartTypeButtonActive,
        ]}
        onPress={() => setChartType("head")}
      >
        <Text
          style={[
            styles.chartTypeButtonText,
            {
              color:
                chartType === "head" ? PRIMARY_COLOR : colors.textSecondary,
            },
          ]}
        >
          Head
        </Text>
      </Pressable>
    </View>
  );

  const renderStandardsSelector = () => (
    <View testID="standards-selector" style={styles.standardsSelector}>
      <Text style={[styles.standardsLabel, { color: colors.textSecondary }]}>
        Growth Standard:
      </Text>
      <View style={styles.standardsButtons}>
        <Pressable
          testID="standard-who"
          style={[
            styles.standardButton,
            preferredStandard === "who" && styles.standardButtonActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setPreferredStandard("who")}
        >
          <Text
            style={[
              styles.standardButtonText,
              { color: preferredStandard === "who" ? "#fff" : colors.text },
            ]}
          >
            WHO
          </Text>
        </Pressable>
        <Pressable
          testID="standard-singapore"
          style={[
            styles.standardButton,
            preferredStandard === "singapore" && styles.standardButtonActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setPreferredStandard("singapore")}
        >
          <Text
            style={[
              styles.standardButtonText,
              {
                color: preferredStandard === "singapore" ? "#fff" : colors.text,
              },
            ]}
          >
            Singapore
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // Map chart type to measurement type
  const chartMeasurementType: MeasurementType =
    chartType === "head" ? "head_circumference" : chartType;

  const renderChartView = () => (
    <ScrollView style={styles.scrollView}>
      {renderChartTypeSelector()}
      {renderStandardsSelector()}
      {child?.dateOfBirth && child?.sex && (
        <GrowthChart
          measurements={measurements}
          childBirthDate={child.dateOfBirth}
          childSex={child.sex}
          measurementType={chartMeasurementType}
          standard={preferredStandard}
        />
      )}
      {(!child?.dateOfBirth || !child?.sex) && (
        <View style={styles.chartError}>
          <Text
            style={[styles.chartErrorText, { color: colors.textSecondary }]}
          >
            Child birth date and sex are required to display growth chart.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderListView = () => (
    <ScrollView style={styles.scrollView}>
      {heightMeasurements.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Height ({heightMeasurements.length})
          </Text>
          {heightMeasurements.map((m, i) => renderMeasurementCard(m, i))}
        </View>
      )}
      {weightMeasurements.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Weight ({weightMeasurements.length})
          </Text>
          {weightMeasurements.map((m, i) => renderMeasurementCard(m, i))}
        </View>
      )}
      {headMeasurements.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Head Circumference ({headMeasurements.length})
          </Text>
          {headMeasurements.map((m, i) => renderMeasurementCard(m, i))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      {!hasMeasurements ? (
        renderEmptyState()
      ) : (
        <>
          {renderViewModeToggle()}
          {viewMode === "list" ? renderListView() : renderChartView()}
        </>
      )}

      {/* FAB to add measurement */}
      {hasMeasurements && (
        <FAB
          icon="plus"
          onPress={handleOpenTypeSelector}
          testID="add-measurement-fab"
        />
      )}

      {/* Type Selector Modal */}
      <Modal
        visible={modalState === "selectType"}
        animationType="slide"
        transparent
      >
        <View style={styles.typeModalOverlay}>
          <View
            style={[styles.typeModalContent, { backgroundColor: colors.card }]}
          >
            <ThemedText type="subtitle" style={styles.typeModalTitle}>
              Add Measurement
            </ThemedText>
            <Pressable
              style={[styles.typeOption, { borderColor: colors.border }]}
              onPress={handleSelectHeight}
            >
              <Text style={[styles.typeOptionIcon]}>📏</Text>
              <Text style={[styles.typeOptionText, { color: colors.text }]}>
                Height
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeOption, { borderColor: colors.border }]}
              onPress={handleSelectWeight}
            >
              <Text style={[styles.typeOptionIcon]}>⚖️</Text>
              <Text style={[styles.typeOptionText, { color: colors.text }]}>
                Weight
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeOption, { borderColor: colors.border }]}
              onPress={handleSelectHead}
            >
              <Text style={[styles.typeOptionIcon]}>📐</Text>
              <Text style={[styles.typeOptionText, { color: colors.text }]}>
                Head Circumference
              </Text>
            </Pressable>
            <Pressable
              style={styles.typeModalCancel}
              onPress={() => setModalState("closed")}
            >
              <Text
                style={[
                  styles.typeModalCancelText,
                  { color: colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Height Modal */}
      <Modal visible={modalState === "addHeight"} animationType="slide">
        <KeyboardAvoidingView
          style={[styles.fullModal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.fullModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.backButton}>Cancel</Text>
            </Pressable>
            <ThemedText type="subtitle">Add Height</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Height *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              value={measurementValue}
              onChangeText={setMeasurementValue}
              placeholder="Height in cm"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Text style={[styles.label, { color: colors.text }]}>Date</Text>
            <Pressable
              style={[styles.dateButton, { borderColor: colors.inputBorder }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {measurementDate.toLocaleDateString("en-SG")}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={measurementDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) setMeasurementDate(date);
                }}
              />
            )}

            <Button
              variant="primary"
              fullWidth
              disabled={!isValidValue}
              onPress={handleSaveHeight}
            >
              Save
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Weight Modal */}
      <Modal visible={modalState === "addWeight"} animationType="slide">
        <KeyboardAvoidingView
          style={[styles.fullModal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.fullModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.backButton}>Cancel</Text>
            </Pressable>
            <ThemedText type="subtitle">Add Weight</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Weight *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              value={measurementValue}
              onChangeText={setMeasurementValue}
              placeholder="Weight in kg"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Text style={[styles.label, { color: colors.text }]}>Date</Text>
            <Pressable
              style={[styles.dateButton, { borderColor: colors.inputBorder }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {measurementDate.toLocaleDateString("en-SG")}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={measurementDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) setMeasurementDate(date);
                }}
              />
            )}

            <Button
              variant="primary"
              fullWidth
              disabled={!isValidValue}
              onPress={handleSaveWeight}
            >
              Save
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Head Circumference Modal */}
      <Modal visible={modalState === "addHead"} animationType="slide">
        <KeyboardAvoidingView
          style={[styles.fullModal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.fullModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable onPress={() => setModalState("closed")}>
              <Text style={styles.backButton}>Cancel</Text>
            </Pressable>
            <ThemedText type="subtitle">Add Head Circumference</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Head Circumference *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              value={measurementValue}
              onChangeText={setMeasurementValue}
              placeholder="Head circumference in cm"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Text style={[styles.label, { color: colors.text }]}>Date</Text>
            <Pressable
              style={[styles.dateButton, { borderColor: colors.inputBorder }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {measurementDate.toLocaleDateString("en-SG")}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={measurementDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) setMeasurementDate(date);
                }}
              />
            )}

            <Button
              variant="primary"
              fullWidth
              disabled={!isValidValue}
              onPress={handleSaveHead}
            >
              Save
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Export Report Modal */}
      <Modal
        visible={modalState === "exportReport"}
        animationType="slide"
        transparent
      >
        <View style={styles.typeModalOverlay}>
          <View
            style={[
              styles.exportModalContent,
              { backgroundColor: colors.card },
            ]}
          >
            <ThemedText type="subtitle" style={styles.typeModalTitle}>
              Export Growth Report
            </ThemedText>
            <Text
              style={[
                styles.exportModalDescription,
                { color: colors.textSecondary },
              ]}
            >
              Generate a PDF report for your pediatrician with growth
              measurements and percentiles.
            </Text>

            <View style={styles.exportDateRow}>
              <Text style={[styles.exportDateLabel, { color: colors.text }]}>
                From:
              </Text>
              <Pressable
                testID="export-start-date"
                style={[
                  styles.exportDateButton,
                  { borderColor: colors.inputBorder },
                ]}
                onPress={() => setShowExportDatePicker("start")}
              >
                <Text
                  style={[styles.exportDateButtonText, { color: colors.text }]}
                >
                  {exportStartDate.toLocaleDateString("en-SG")}
                </Text>
              </Pressable>
            </View>

            <View style={styles.exportDateRow}>
              <Text style={[styles.exportDateLabel, { color: colors.text }]}>
                To:
              </Text>
              <Pressable
                testID="export-end-date"
                style={[
                  styles.exportDateButton,
                  { borderColor: colors.inputBorder },
                ]}
                onPress={() => setShowExportDatePicker("end")}
              >
                <Text
                  style={[styles.exportDateButtonText, { color: colors.text }]}
                >
                  {exportEndDate.toLocaleDateString("en-SG")}
                </Text>
              </Pressable>
            </View>

            {showExportDatePicker && (
              <DateTimePicker
                testID="export-date-picker"
                value={
                  showExportDatePicker === "start"
                    ? exportStartDate
                    : exportEndDate
                }
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={
                  showExportDatePicker === "start" ? exportEndDate : new Date()
                }
                minimumDate={
                  showExportDatePicker === "end" ? exportStartDate : undefined
                }
                onChange={(_, date) => {
                  if (Platform.OS !== "ios") {
                    setShowExportDatePicker(null);
                  }
                  if (date) {
                    if (showExportDatePicker === "start") {
                      setExportStartDate(date);
                    } else {
                      setExportEndDate(date);
                    }
                  }
                }}
              />
            )}

            {Platform.OS === "ios" && showExportDatePicker && (
              <Pressable
                style={styles.exportDateDone}
                onPress={() => setShowExportDatePicker(null)}
              >
                <Text
                  style={[styles.exportDateDoneText, { color: PRIMARY_COLOR }]}
                >
                  Done
                </Text>
              </Pressable>
            )}

            <View style={styles.exportStandardInfo}>
              <Text
                style={[
                  styles.exportStandardLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Using {preferredStandard === "who" ? "WHO" : "Singapore"} growth
                standards
              </Text>
            </View>

            <Button
              variant="primary"
              fullWidth
              loading={isExporting}
              disabled={isExporting}
              onPress={handleExportReport}
              testID="export-generate-button"
            >
              Generate & Share
            </Button>

            <Pressable
              style={styles.typeModalCancel}
              onPress={() => {
                setModalState("closed");
                setShowExportDatePicker(null);
              }}
            >
              <Text
                style={[
                  styles.typeModalCancelText,
                  { color: colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  measurementCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  measurementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  measurementType: {
    fontSize: 16,
    fontWeight: "600",
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  measurementDate: {
    fontSize: 13,
    marginBottom: Spacing.sm,
    marginLeft: 44, // Align with text after icon badge
  },
  measurementIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  measurementIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  percentileBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginLeft: 44, // Align with text after icon badge
  },
  percentileText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyStateText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  emptyStateButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 36,
  },
  fullModal: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    color: PRIMARY_COLOR,
  },
  formContainer: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dateButtonText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  typeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  typeModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
  },
  typeModalTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  typeOptionIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  typeModalCancel: {
    alignItems: "center",
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  typeModalCancelText: {
    fontSize: 16,
  },
  viewModeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  viewModeToggle: {
    flexDirection: "row",
  },
  viewModeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  viewModeButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chartTypeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  chartTypeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: 4,
  },
  chartTypeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_COLOR,
  },
  chartTypeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  chartError: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  chartErrorText: {
    fontSize: 14,
    textAlign: "center",
  },
  standardsSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  standardsLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  standardsButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  standardButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
  },
  standardButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  standardButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  exportButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  exportModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
  },
  exportModalDescription: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    fontSize: 14,
  },
  exportDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  exportDateLabel: {
    fontSize: 14,
    fontWeight: "500",
    width: 50,
  },
  exportDateButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
  },
  exportDateButtonText: {
    fontSize: 16,
  },
  exportDateDone: {
    alignItems: "center",
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exportDateDoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  exportStandardInfo: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  exportStandardLabel: {
    fontSize: 13,
  },
  exportGenerateButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: "center",
    marginTop: Spacing.md,
  },
});
