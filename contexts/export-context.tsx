import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useChild, type Child } from "./child-context";
import { useEntries, type Entry } from "./entry-context";
import { useMilestones, type Milestone } from "./milestone-context";

export interface ExportData {
  exportDate: string;
  version: string;
  child: Child | null;
  entries: Entry[];
  milestones: Milestone[];
}

interface ExportContextValue {
  exportData: () => Promise<ExportData | null>;
  isExporting: boolean;
  lastExportDate: string | null;
}

const ExportContext = createContext<ExportContextValue | null>(null);

interface ExportProviderProps {
  children: ReactNode;
}

const EXPORT_VERSION = "1.0.0";

export function ExportProvider({ children }: ExportProviderProps) {
  const { child } = useChild();
  const { entries } = useEntries();
  const { milestones } = useMilestones();

  const [isExporting, setIsExporting] = useState(false);
  const [lastExportDate, setLastExportDate] = useState<string | null>(null);

  const exportData = useCallback(async (): Promise<ExportData | null> => {
    setIsExporting(true);

    try {
      const exportDate = new Date().toISOString();

      const data: ExportData = {
        exportDate,
        version: EXPORT_VERSION,
        child,
        entries,
        milestones,
      };

      // Generate filename with date
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `little-journey-export-${dateStr}.json`;
      const file = new File(Paths.document, filename);

      // Write JSON file
      await file.write(JSON.stringify(data, null, 2));

      // Share the file if available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Export Little Journey Data",
        });
      }

      setLastExportDate(exportDate);
      return data;
    } catch (error) {
      console.error("Export failed:", error);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [child, entries, milestones]);

  const value: ExportContextValue = {
    exportData,
    isExporting,
    lastExportDate,
  };

  return (
    <ExportContext.Provider value={value}>{children}</ExportContext.Provider>
  );
}

export function useExport(): ExportContextValue {
  const context = useContext(ExportContext);
  if (context === null) {
    throw new Error("useExport must be used within an ExportProvider");
  }
  return context;
}
