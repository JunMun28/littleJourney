import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type EntryType = "photo" | "video" | "text";

export interface Entry {
  id: string;
  type: EntryType;
  mediaUris?: string[]; // Photo or video URIs (carousel for photos)
  thumbnailUrl?: string; // Cloudflare Stream thumbnail URL for videos (VIDEO-002)
  caption?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  tags?: string[];
  milestoneId?: string; // Reference to linked milestone (PRD SEARCH-005)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  createdBy?: string; // User ID who created (for attribution)
  createdByName?: string; // Display name for "Posted by" (PRD Section 4.2)
  updatedBy?: string; // User ID who last edited
  updatedByName?: string; // Display name for "Edited by" (PRD ENTRY-013)
}

export type NewEntry = Omit<Entry, "id" | "createdAt" | "updatedAt">;

interface EntryContextValue {
  entries: Entry[];
  addEntry: (entry: NewEntry) => Entry;
  updateEntry: (id: string, updates: Partial<NewEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => Entry | undefined;
  getOnThisDayEntries: () => Entry[];
}

const EntryContext = createContext<EntryContextValue | null>(null);

interface EntryProviderProps {
  children: ReactNode;
}

function generateId(): string {
  return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function EntryProvider({ children }: EntryProviderProps) {
  const [entries, setEntries] = useState<Entry[]>([]);

  const addEntry = useCallback((newEntry: NewEntry): Entry => {
    const now = new Date().toISOString();
    const entry: Entry = {
      ...newEntry,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    // TODO: Persist to backend/storage
    setEntries((prev) => [entry, ...prev]); // Newest first (reverse chronological)
    return entry;
  }, []);

  const updateEntry = useCallback(
    (id: string, updates: Partial<NewEntry>): void => {
      const now = new Date().toISOString();
      // TODO: Persist to backend/storage
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, ...updates, updatedAt: now } : entry,
        ),
      );
    },
    [],
  );

  const deleteEntry = useCallback((id: string): void => {
    // TODO: Persist to backend/storage
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const getEntry = useCallback(
    (id: string): Entry | undefined => {
      return entries.find((entry) => entry.id === id);
    },
    [entries],
  );

  const getOnThisDayEntries = useCallback((): Entry[] => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const todayYear = today.getFullYear();

    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === todayMonth &&
        entryDate.getDate() === todayDay &&
        entryDate.getFullYear() < todayYear
      );
    });
  }, [entries]);

  const value: EntryContextValue = {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getOnThisDayEntries,
  };

  return (
    <EntryContext.Provider value={value}>{children}</EntryContext.Provider>
  );
}

export function useEntries(): EntryContextValue {
  const context = useContext(EntryContext);
  if (context === null) {
    throw new Error("useEntries must be used within an EntryProvider");
  }
  return context;
}
