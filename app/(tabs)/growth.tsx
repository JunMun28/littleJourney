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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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

type ModalState = "closed" | "selectType" | "addHeight" | "addWeight" | "addHead";

// Calculate age in months from birthdate to measurement date
function calculateAgeInMonths(birthDate: string, measurementDate: string): number {
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

export default function GrowthScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { child } = useChild();
  const {
    addMeasurement,
    getMeasurements,
    deleteMeasurement,
    calculatePercentile,
  } = useGrowthTracking();

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [measurementValue, setMeasurementValue] = useState("");
  const [measurementDate, setMeasurementDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const handleDeleteMeasurement = (id: string) => {
    deleteMeasurement(id);
  };

  const renderMeasurementCard = (measurement: GrowthMeasurement) => {
    const ageMonths = child?.dateOfBirth
      ? calculateAgeInMonths(child.dateOfBirth, measurement.date)
      : null;

    // Calculate percentile if we have child sex
    let percentileInfo = null;
    if (child?.sex && ageMonths !== null) {
      percentileInfo = calculatePercentile(measurement, ageMonths, child.sex);
    }

    return (
      <Pressable
        key={measurement.id}
        style={[
          styles.measurementCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          Shadows.small,
        ]}
        onLongPress={() => handleDeleteMeasurement(measurement.id)}
      >
        <View style={styles.measurementHeader}>
          <Text style={[styles.measurementType, { color: colors.text }]}>
            {formatMeasurementType(measurement.type)}
          </Text>
          <Text style={[styles.measurementValue, { color: PRIMARY_COLOR }]}>
            {formatValueWithUnit(measurement.value, measurement.type)}
          </Text>
        </View>
        <Text
          style={[styles.measurementDate, { color: colors.textSecondary }]}
        >
          {new Date(measurement.date).toLocaleDateString("en-SG")}
          {ageMonths !== null && ` (${ageMonths} months old)`}
        </Text>
        {percentileInfo && (
          <Text
            style={[
              styles.percentileText,
              {
                color: percentileInfo.isWithinNormalRange
                  ? SemanticColors.success
                  : SemanticColors.warning,
              },
            ]}
          >
            {percentileInfo.rangeDescription}
          </Text>
        )}
      </Pressable>
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
      <Pressable style={styles.emptyStateButton} onPress={handleOpenTypeSelector}>
        <Text style={styles.emptyStateButtonText}>Add Measurement</Text>
      </Pressable>
    </View>
  );

  const isValidValue = measurementValue.trim() !== "" &&
    !isNaN(parseFloat(measurementValue)) &&
    parseFloat(measurementValue) > 0;

  return (
    <ThemedView style={styles.container}>
      {!hasMeasurements ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.scrollView}>
          {heightMeasurements.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Height ({heightMeasurements.length})
              </Text>
              {heightMeasurements.map(renderMeasurementCard)}
            </View>
          )}
          {weightMeasurements.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Weight ({weightMeasurements.length})
              </Text>
              {weightMeasurements.map(renderMeasurementCard)}
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB to add measurement */}
      {hasMeasurements && (
        <Pressable
          testID="add-measurement-fab"
          style={[styles.fab, Shadows.large]}
          onPress={handleOpenTypeSelector}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      {/* Type Selector Modal */}
      <Modal visible={modalState === "selectType"} animationType="slide" transparent>
        <View style={styles.typeModalOverlay}>
          <View style={[styles.typeModalContent, { backgroundColor: colors.card }]}>
            <ThemedText type="subtitle" style={styles.typeModalTitle}>
              Add Measurement
            </ThemedText>
            <Pressable
              style={[styles.typeOption, { borderColor: colors.border }]}
              onPress={handleSelectHeight}
            >
              <Text style={[styles.typeOptionIcon]}>📏</Text>
              <Text style={[styles.typeOptionText, { color: colors.text }]}>Height</Text>
            </Pressable>
            <Pressable
              style={[styles.typeOption, { borderColor: colors.border }]}
              onPress={handleSelectWeight}
            >
              <Text style={[styles.typeOptionIcon]}>⚖️</Text>
              <Text style={[styles.typeOptionText, { color: colors.text }]}>Weight</Text>
            </Pressable>
            <Pressable
              style={styles.typeModalCancel}
              onPress={() => setModalState("closed")}
            >
              <Text style={[styles.typeModalCancelText, { color: colors.textSecondary }]}>
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
            <Text style={[styles.label, { color: colors.text }]}>
              Height *
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

            <Pressable
              style={[
                styles.submitButton,
                !isValidValue && styles.submitButtonDisabled,
              ]}
              onPress={handleSaveHeight}
              disabled={!isValidValue}
            >
              <Text style={styles.submitButtonText}>Save</Text>
            </Pressable>
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
            <Text style={[styles.label, { color: colors.text }]}>
              Weight *
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

            <Pressable
              style={[
                styles.submitButton,
                !isValidValue && styles.submitButtonDisabled,
              ]}
              onPress={handleSaveWeight}
              disabled={!isValidValue}
            >
              <Text style={styles.submitButtonText}>Save</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
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
    marginBottom: Spacing.xs,
  },
  percentileText: {
    fontSize: 13,
    fontWeight: "500",
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
});
