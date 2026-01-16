import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// Measurement types per PRD GROWTH-001, GROWTH-002, GROWTH-007
export type MeasurementType = "height" | "weight" | "head_circumference";

// Percentile standard options per PRD GROWTH-003, GROWTH-004
export type PercentileStandard = "who" | "singapore";

export interface GrowthMeasurement {
  id: string;
  type: MeasurementType;
  value: number; // cm for height/head, kg for weight
  date: string; // ISO date string
  photoUri?: string; // Optional attached photo
  childId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewMeasurement {
  type: MeasurementType;
  value: number;
  date: string;
  photoUri?: string;
  childId: string;
}

export interface PercentileResult {
  percentile: number; // 0-100
  isWithinNormalRange: boolean;
  rangeDescription: string; // e.g., "50th percentile" or "within normal range"
}

// WHO Growth Standard Reference Data (simplified - key percentile boundaries)
// Based on WHO Child Growth Standards for 0-5 years
// Values represent measurement at given percentile for age in months
// Source: WHO Multicentre Growth Reference Study
interface PercentileTable {
  // age in months -> { p3, p15, p50, p85, p97 } values
  [ageMonths: number]: {
    p3: number;
    p15: number;
    p50: number;
    p85: number;
    p97: number;
  };
}

// WHO Height (Length/Stature) for Boys 0-24 months (cm)
const WHO_HEIGHT_BOYS: PercentileTable = {
  0: { p3: 46.1, p15: 47.9, p50: 49.9, p85: 51.8, p97: 53.7 },
  3: { p3: 57.3, p15: 59.4, p50: 61.4, p85: 63.5, p97: 65.5 },
  6: { p3: 63.3, p15: 65.5, p50: 67.6, p85: 69.8, p97: 71.9 },
  9: { p3: 68.0, p15: 70.1, p50: 72.0, p85: 74.2, p97: 76.5 },
  12: { p3: 71.0, p15: 73.4, p50: 75.7, p85: 78.1, p97: 80.5 },
  18: { p3: 76.9, p15: 79.6, p50: 82.3, p85: 85.0, p97: 87.7 },
  24: { p3: 81.7, p15: 84.6, p50: 87.8, p85: 91.0, p97: 94.0 },
};

// WHO Height (Length/Stature) for Girls 0-24 months (cm)
const WHO_HEIGHT_GIRLS: PercentileTable = {
  0: { p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
  3: { p3: 55.6, p15: 57.7, p50: 59.8, p85: 61.9, p97: 64.0 },
  6: { p3: 61.2, p15: 63.5, p50: 65.7, p85: 67.9, p97: 70.1 },
  9: { p3: 65.7, p15: 68.0, p50: 70.1, p85: 72.4, p97: 74.7 },
  12: { p3: 68.9, p15: 71.4, p50: 74.0, p85: 76.6, p97: 79.2 },
  18: { p3: 74.9, p15: 77.8, p50: 80.7, p85: 83.6, p97: 86.5 },
  24: { p3: 80.0, p15: 83.2, p50: 86.4, p85: 89.6, p97: 92.9 },
};

// WHO Weight for Boys 0-24 months (kg)
const WHO_WEIGHT_BOYS: PercentileTable = {
  0: { p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.4 },
  3: { p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  6: { p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.8 },
  9: { p3: 7.1, p15: 8.0, p50: 8.9, p85: 9.9, p97: 11.0 },
  12: { p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 12.0 },
  18: { p3: 8.6, p15: 9.7, p50: 10.9, p85: 12.2, p97: 13.7 },
  24: { p3: 9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.3 },
};

// WHO Weight for Girls 0-24 months (kg)
const WHO_WEIGHT_GIRLS: PercentileTable = {
  0: { p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  3: { p3: 4.5, p15: 5.2, p50: 5.8, p85: 6.6, p97: 7.5 },
  6: { p3: 5.7, p15: 6.5, p50: 7.3, p85: 8.2, p97: 9.3 },
  9: { p3: 6.5, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.5 },
  12: { p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.1, p97: 11.5 },
  18: { p3: 7.9, p15: 9.0, p50: 10.2, p85: 11.6, p97: 13.2 },
  24: { p3: 9.0, p15: 10.2, p50: 11.5, p85: 13.0, p97: 14.8 },
};

// WHO Head Circumference for Boys 0-24 months (cm)
const WHO_HEAD_BOYS: PercentileTable = {
  0: { p3: 32.1, p15: 33.1, p50: 34.5, p85: 35.8, p97: 36.9 },
  3: { p3: 38.3, p15: 39.3, p50: 40.5, p85: 41.7, p97: 42.7 },
  6: { p3: 41.0, p15: 42.0, p50: 43.3, p85: 44.6, p97: 45.6 },
  9: { p3: 43.0, p15: 44.0, p50: 45.2, p85: 46.5, p97: 47.4 },
  12: { p3: 44.2, p15: 45.3, p50: 46.5, p85: 47.7, p97: 48.6 },
  18: { p3: 45.7, p15: 46.8, p50: 48.0, p85: 49.2, p97: 50.1 },
  24: { p3: 46.6, p15: 47.6, p50: 48.9, p85: 50.2, p97: 51.1 },
};

// WHO Head Circumference for Girls 0-24 months (cm)
const WHO_HEAD_GIRLS: PercentileTable = {
  0: { p3: 31.5, p15: 32.4, p50: 33.9, p85: 35.1, p97: 36.1 },
  3: { p3: 37.1, p15: 38.1, p50: 39.5, p85: 40.8, p97: 41.8 },
  6: { p3: 39.6, p15: 40.6, p50: 42.0, p85: 43.4, p97: 44.4 },
  9: { p3: 41.3, p15: 42.4, p50: 43.8, p85: 45.1, p97: 46.1 },
  12: { p3: 42.5, p15: 43.5, p50: 44.9, p85: 46.3, p97: 47.3 },
  18: { p3: 43.8, p15: 44.9, p50: 46.3, p85: 47.7, p97: 48.6 },
  24: { p3: 44.8, p15: 45.9, p50: 47.2, p85: 48.6, p97: 49.6 },
};

// Get the closest available age in months for lookup
function getClosestAge(ageMonths: number): number {
  const ages = [0, 3, 6, 9, 12, 18, 24];
  return ages.reduce((prev, curr) =>
    Math.abs(curr - ageMonths) < Math.abs(prev - ageMonths) ? curr : prev
  );
}

// Calculate percentile based on value and reference table
function calculatePercentileFromTable(
  value: number,
  table: PercentileTable,
  ageMonths: number
): PercentileResult {
  const closestAge = getClosestAge(ageMonths);
  const ref = table[closestAge];

  if (!ref) {
    return {
      percentile: 50,
      isWithinNormalRange: true,
      rangeDescription: "Unable to calculate - age out of range",
    };
  }

  // Determine percentile range
  let percentile: number;
  let rangeDescription: string;
  let isWithinNormalRange: boolean;

  if (value < ref.p3) {
    percentile = 1;
    rangeDescription = "Below 3rd percentile";
    isWithinNormalRange = false;
  } else if (value < ref.p15) {
    percentile = 9; // Midpoint 3-15
    rangeDescription = "3rd-15th percentile";
    isWithinNormalRange = true;
  } else if (value < ref.p50) {
    percentile = 33; // Midpoint 15-50
    rangeDescription = "15th-50th percentile";
    isWithinNormalRange = true;
  } else if (value < ref.p85) {
    percentile = 68; // Midpoint 50-85
    rangeDescription = "50th-85th percentile";
    isWithinNormalRange = true;
  } else if (value < ref.p97) {
    percentile = 91; // Midpoint 85-97
    rangeDescription = "85th-97th percentile";
    isWithinNormalRange = true;
  } else {
    percentile = 99;
    rangeDescription = "Above 97th percentile";
    isWithinNormalRange = false;
  }

  return { percentile, isWithinNormalRange, rangeDescription };
}

interface GrowthTrackingContextValue {
  measurements: GrowthMeasurement[];
  preferredStandard: PercentileStandard;
  setPreferredStandard: (standard: PercentileStandard) => void;
  addMeasurement: (measurement: NewMeasurement) => GrowthMeasurement;
  getMeasurements: (childId: string, type?: MeasurementType) => GrowthMeasurement[];
  deleteMeasurement: (id: string) => void;
  calculatePercentile: (
    measurement: GrowthMeasurement,
    childAgeMonths: number,
    childSex: "male" | "female"
  ) => PercentileResult;
  getLatestMeasurement: (
    childId: string,
    type: MeasurementType
  ) => GrowthMeasurement | undefined;
}

const GrowthTrackingContext = createContext<GrowthTrackingContextValue | null>(
  null
);

interface GrowthTrackingProviderProps {
  children: ReactNode;
}

function generateId(): string {
  return `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function GrowthTrackingProvider({
  children,
}: GrowthTrackingProviderProps) {
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
  const [preferredStandard, setPreferredStandard] =
    useState<PercentileStandard>("who");

  const addMeasurement = useCallback(
    (newMeasurement: NewMeasurement): GrowthMeasurement => {
      const now = new Date().toISOString();
      const measurement: GrowthMeasurement = {
        ...newMeasurement,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      // TODO: Persist to backend/storage
      setMeasurements((prev) => [...prev, measurement].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      return measurement;
    },
    []
  );

  const getMeasurements = useCallback(
    (childId: string, type?: MeasurementType): GrowthMeasurement[] => {
      return measurements.filter(
        (m) => m.childId === childId && (type === undefined || m.type === type)
      );
    },
    [measurements]
  );

  const deleteMeasurement = useCallback((id: string): void => {
    // TODO: Persist to backend/storage
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const calculatePercentile = useCallback(
    (
      measurement: GrowthMeasurement,
      childAgeMonths: number,
      childSex: "male" | "female"
    ): PercentileResult => {
      // Note: Singapore standards would use different reference tables
      // Currently only WHO is implemented; Singapore data requires official HPB data
      const isBoy = childSex === "male";

      let table: PercentileTable;
      switch (measurement.type) {
        case "height":
          table = isBoy ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
          break;
        case "weight":
          table = isBoy ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
          break;
        case "head_circumference":
          table = isBoy ? WHO_HEAD_BOYS : WHO_HEAD_GIRLS;
          break;
      }

      return calculatePercentileFromTable(measurement.value, table, childAgeMonths);
    },
    []
  );

  const getLatestMeasurement = useCallback(
    (childId: string, type: MeasurementType): GrowthMeasurement | undefined => {
      const filtered = measurements.filter(
        (m) => m.childId === childId && m.type === type
      );
      // Already sorted by date descending
      return filtered[0];
    },
    [measurements]
  );

  const value: GrowthTrackingContextValue = useMemo(
    () => ({
      measurements,
      preferredStandard,
      setPreferredStandard,
      addMeasurement,
      getMeasurements,
      deleteMeasurement,
      calculatePercentile,
      getLatestMeasurement,
    }),
    [
      measurements,
      preferredStandard,
      addMeasurement,
      getMeasurements,
      deleteMeasurement,
      calculatePercentile,
      getLatestMeasurement,
    ]
  );

  return (
    <GrowthTrackingContext.Provider value={value}>
      {children}
    </GrowthTrackingContext.Provider>
  );
}

export function useGrowthTracking(): GrowthTrackingContextValue {
  const context = useContext(GrowthTrackingContext);
  if (context === null) {
    throw new Error(
      "useGrowthTracking must be used within a GrowthTrackingProvider"
    );
  }
  return context;
}
