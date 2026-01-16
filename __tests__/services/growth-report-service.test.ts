import {
  generateGrowthReportHtml,
  type GrowthReportData,
} from "@/services/growth-report-service";
import type {
  GrowthMeasurement,
  MeasurementType,
  PercentileStandard,
} from "@/contexts/growth-tracking-context";

// Mock expo-print
jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: "file:///test-report.pdf" }),
}));

// Mock expo-sharing
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

describe("GrowthReportService", () => {
  const mockChild = {
    id: "child-1",
    name: "Emma",
    dateOfBirth: "2024-01-15",
    sex: "female" as const,
  };

  const mockMeasurements: GrowthMeasurement[] = [
    {
      id: "m1",
      type: "height",
      value: 75.5,
      date: "2025-01-15",
      childId: "child-1",
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "m2",
      type: "weight",
      value: 9.8,
      date: "2025-01-15",
      childId: "child-1",
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "m3",
      type: "head_circumference",
      value: 45.2,
      date: "2025-01-15",
      childId: "child-1",
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "m4",
      type: "height",
      value: 70.0,
      date: "2024-10-15",
      childId: "child-1",
      createdAt: "2024-10-15T10:00:00Z",
      updatedAt: "2024-10-15T10:00:00Z",
    },
  ];

  const mockPercentileData = {
    m1: { percentile: 50, isWithinNormalRange: true, rangeDescription: "50th-85th percentile" },
    m2: { percentile: 68, isWithinNormalRange: true, rangeDescription: "50th-85th percentile" },
    m3: { percentile: 33, isWithinNormalRange: true, rangeDescription: "15th-50th percentile" },
    m4: { percentile: 50, isWithinNormalRange: true, rangeDescription: "50th-85th percentile" },
  };

  describe("generateGrowthReportHtml", () => {
    it("generates HTML with child name and date range", () => {
      const reportData: GrowthReportData = {
        child: mockChild,
        measurements: mockMeasurements,
        percentileData: mockPercentileData,
        standard: "who",
        startDate: "2024-10-01",
        endDate: "2025-01-31",
      };

      const html = generateGrowthReportHtml(reportData);

      expect(html).toContain("Emma");
      expect(html).toContain("Growth Report");
      expect(html).toContain("WHO");
    });

    it("includes all measurement types in the report", () => {
      const reportData: GrowthReportData = {
        child: mockChild,
        measurements: mockMeasurements,
        percentileData: mockPercentileData,
        standard: "who",
        startDate: "2024-10-01",
        endDate: "2025-01-31",
      };

      const html = generateGrowthReportHtml(reportData);

      expect(html).toContain("Height");
      expect(html).toContain("Weight");
      expect(html).toContain("Head Circumference");
      expect(html).toContain("75.5");
      expect(html).toContain("9.8");
      expect(html).toContain("45.2");
    });

    it("shows Singapore standard when selected", () => {
      const reportData: GrowthReportData = {
        child: mockChild,
        measurements: mockMeasurements,
        percentileData: mockPercentileData,
        standard: "singapore",
        startDate: "2024-10-01",
        endDate: "2025-01-31",
      };

      const html = generateGrowthReportHtml(reportData);

      expect(html).toContain("Singapore");
    });

    it("includes percentile information for each measurement", () => {
      const reportData: GrowthReportData = {
        child: mockChild,
        measurements: mockMeasurements,
        percentileData: mockPercentileData,
        standard: "who",
        startDate: "2024-10-01",
        endDate: "2025-01-31",
      };

      const html = generateGrowthReportHtml(reportData);

      expect(html).toContain("50th-85th percentile");
      expect(html).toContain("15th-50th percentile");
    });

    it("filters measurements by date range", () => {
      const reportData: GrowthReportData = {
        child: mockChild,
        measurements: mockMeasurements,
        percentileData: mockPercentileData,
        standard: "who",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      };

      const html = generateGrowthReportHtml(reportData);

      // Should include Jan 2025 measurements
      expect(html).toContain("75.5");
      // Should not include Oct 2024 measurement
      expect(html).not.toContain("70.0 cm");
    });

    it("handles empty measurements gracefully", () => {
      const reportData: GrowthReportData = {
        child: mockChild,
        measurements: [],
        percentileData: {},
        standard: "who",
        startDate: "2024-10-01",
        endDate: "2025-01-31",
      };

      const html = generateGrowthReportHtml(reportData);

      expect(html).toContain("Emma");
      expect(html).toContain("No measurements");
    });

    it("includes child age in the report", () => {
      const reportData: GrowthReportData = {
        child: mockChild,
        measurements: mockMeasurements,
        percentileData: mockPercentileData,
        standard: "who",
        startDate: "2024-10-01",
        endDate: "2025-01-31",
      };

      const html = generateGrowthReportHtml(reportData);

      expect(html).toContain("Date of Birth");
      expect(html).toContain("15/01/2024"); // en-SG format
    });

    it("formats dates in Singapore locale", () => {
      const reportData: GrowthReportData = {
        child: mockChild,
        measurements: mockMeasurements,
        percentileData: mockPercentileData,
        standard: "who",
        startDate: "2024-10-01",
        endDate: "2025-01-31",
      };

      const html = generateGrowthReportHtml(reportData);

      // Check for Singapore date format (DD/MM/YYYY)
      expect(html).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });
});
