import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// Red Packet (Ang Bao) tracking for CNY (SGLOCAL-001)
// Private tracking - not shared with family members

export interface RedPacket {
  id: string;
  amount: number;
  giverName: string;
  childId: string;
  year: number; // CNY year (e.g., 2024, 2025)
  receivedAt: string; // ISO date string
  notes?: string;
}

interface RedPacketContextValue {
  // Red packets for current child
  packets: RedPacket[];
  // Add a new red packet record
  addPacket: (packet: Omit<RedPacket, "id">) => void;
  // Remove a red packet record
  removePacket: (packetId: string) => void;
  // Get total collected for a specific year
  getTotalForYear: (year: number) => number;
  // Get packets for a specific year
  getPacketsForYear: (year: number) => RedPacket[];
  // Get all unique years with packets
  getYearsWithPackets: () => number[];
  // Check if we're in CNY period (roughly Jan 20 - Feb 20)
  isCNYPeriod: () => boolean;
}

const RedPacketContext = createContext<RedPacketContextValue | null>(null);

interface RedPacketProviderProps {
  children: ReactNode;
}

// Helper to check if current date is in CNY period
// CNY typically falls between Jan 21 - Feb 20
function checkCNYPeriod(): boolean {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  // January 20+ or February 1-20
  if (month === 0 && day >= 20) return true;
  if (month === 1 && day <= 20) return true;

  return false;
}

// Generate unique ID
function generateId(): string {
  return `rp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function RedPacketProvider({ children }: RedPacketProviderProps) {
  const [packets, setPackets] = useState<RedPacket[]>([]);

  const addPacket = useCallback((packet: Omit<RedPacket, "id">) => {
    const newPacket: RedPacket = {
      ...packet,
      id: generateId(),
    };
    setPackets((prev) => [newPacket, ...prev]);
  }, []);

  const removePacket = useCallback((packetId: string) => {
    setPackets((prev) => prev.filter((p) => p.id !== packetId));
  }, []);

  const getTotalForYear = useCallback(
    (year: number): number => {
      return packets
        .filter((p) => p.year === year)
        .reduce((sum, p) => sum + p.amount, 0);
    },
    [packets],
  );

  const getPacketsForYear = useCallback(
    (year: number): RedPacket[] => {
      return packets.filter((p) => p.year === year);
    },
    [packets],
  );

  const getYearsWithPackets = useCallback((): number[] => {
    const years = new Set(packets.map((p) => p.year));
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  }, [packets]);

  const isCNYPeriod = useCallback((): boolean => {
    return checkCNYPeriod();
  }, []);

  const value: RedPacketContextValue = {
    packets,
    addPacket,
    removePacket,
    getTotalForYear,
    getPacketsForYear,
    getYearsWithPackets,
    isCNYPeriod,
  };

  return (
    <RedPacketContext.Provider value={value}>
      {children}
    </RedPacketContext.Provider>
  );
}

export function useRedPacket(): RedPacketContextValue {
  const context = useContext(RedPacketContext);
  if (context === null) {
    throw new Error("useRedPacket must be used within a RedPacketProvider");
  }
  return context;
}
