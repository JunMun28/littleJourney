import { render, screen, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  ExportProvider,
  useExport,
  type ExportData,
} from "@/contexts/export-context";
import { ChildProvider, useChild } from "@/contexts/child-context";
import { EntryProvider, useEntries } from "@/contexts/entry-context";
import { MilestoneProvider, useMilestones } from "@/contexts/milestone-context";

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    uri: "file:///mock/documents/export.json",
    write: jest.fn().mockResolvedValue(undefined),
  })),
  Paths: {
    document: { uri: "file:///mock/documents/" },
  },
}));

// Mock expo-sharing
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

function TestConsumer({ onExport }: { onExport?: (data: ExportData) => void }) {
  const { exportData, isExporting, lastExportDate } = useExport();
  const { setChild } = useChild();
  const { addEntry } = useEntries();
  const { addMilestone } = useMilestones();

  const handleSetupData = () => {
    setChild({
      name: "Test Baby",
      dateOfBirth: "2024-01-15",
      nickname: "Testy",
      culturalTradition: "chinese",
    });
    addEntry({
      type: "photo",
      mediaUris: ["file:///photo1.jpg"],
      caption: "First photo",
      date: "2024-01-16",
    });
    addMilestone({
      childId: "child-1",
      milestoneDate: "2024-02-14",
      templateId: "full_month",
    });
  };

  const handleExport = async () => {
    const data = await exportData();
    if (data && onExport) {
      onExport(data);
    }
  };

  return (
    <>
      <Text testID="is-exporting">{isExporting ? "yes" : "no"}</Text>
      <Text testID="last-export-date">{lastExportDate || "none"}</Text>
      <Text testID="setup-data" onPress={handleSetupData}>
        Setup
      </Text>
      <Text testID="export-data" onPress={handleExport}>
        Export
      </Text>
    </>
  );
}

function renderWithProviders(
  ui: React.ReactElement,
  { onExport }: { onExport?: (data: ExportData) => void } = {},
) {
  return render(
    <ChildProvider>
      <EntryProvider>
        <MilestoneProvider>
          <ExportProvider>{ui}</ExportProvider>
        </MilestoneProvider>
      </EntryProvider>
    </ChildProvider>,
  );
}

describe("ExportContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("provides default values", () => {
    renderWithProviders(<TestConsumer />);

    expect(screen.getByTestId("is-exporting")).toHaveTextContent("no");
    expect(screen.getByTestId("last-export-date")).toHaveTextContent("none");
  });

  it("exports data with correct structure", async () => {
    let exportedData: ExportData | null = null;

    renderWithProviders(
      <TestConsumer onExport={(data) => (exportedData = data)} />,
    );

    // Setup data first
    await act(async () => {
      screen.getByTestId("setup-data").props.onPress();
    });

    // Export
    await act(async () => {
      await screen.getByTestId("export-data").props.onPress();
    });

    await waitFor(() => {
      expect(exportedData).not.toBeNull();
    });

    // Verify structure
    expect(exportedData).toHaveProperty("exportDate");
    expect(exportedData).toHaveProperty("version");
    expect(exportedData).toHaveProperty("child");
    expect(exportedData).toHaveProperty("entries");
    expect(exportedData).toHaveProperty("milestones");
  });

  it("includes child data in export", async () => {
    let exportedData: ExportData | null = null;

    renderWithProviders(
      <TestConsumer onExport={(data) => (exportedData = data)} />,
    );

    await act(async () => {
      screen.getByTestId("setup-data").props.onPress();
    });

    await act(async () => {
      await screen.getByTestId("export-data").props.onPress();
    });

    await waitFor(() => {
      expect(exportedData?.child?.name).toBe("Test Baby");
      expect(exportedData?.child?.dateOfBirth).toBe("2024-01-15");
    });
  });

  it("includes entries in export", async () => {
    let exportedData: ExportData | null = null;

    renderWithProviders(
      <TestConsumer onExport={(data) => (exportedData = data)} />,
    );

    await act(async () => {
      screen.getByTestId("setup-data").props.onPress();
    });

    await act(async () => {
      await screen.getByTestId("export-data").props.onPress();
    });

    await waitFor(() => {
      expect(exportedData?.entries?.length).toBe(1);
      expect(exportedData?.entries?.[0].caption).toBe("First photo");
    });
  });

  it("updates lastExportDate after successful export", async () => {
    renderWithProviders(<TestConsumer />);

    expect(screen.getByTestId("last-export-date")).toHaveTextContent("none");

    await act(async () => {
      await screen.getByTestId("export-data").props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId("last-export-date")).not.toHaveTextContent(
        "none",
      );
    });
  });

  it("throws when useExport is used outside ExportProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() =>
      render(
        <ChildProvider>
          <EntryProvider>
            <MilestoneProvider>
              <TestConsumer />
            </MilestoneProvider>
          </EntryProvider>
        </ChildProvider>,
      ),
    ).toThrow("useExport must be used within an ExportProvider");

    consoleSpy.mockRestore();
  });
});
