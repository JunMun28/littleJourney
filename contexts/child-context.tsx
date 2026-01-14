import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface Child {
  name: string;
  dateOfBirth: string; // ISO date string (YYYY-MM-DD)
  nickname?: string;
  photoUri?: string;
}

interface ChildContextValue {
  child: Child | null;
  setChild: (child: Child) => void;
  clearChild: () => void;
}

const ChildContext = createContext<ChildContextValue | null>(null);

interface ChildProviderProps {
  children: ReactNode;
}

export function ChildProvider({ children }: ChildProviderProps) {
  const [child, setChildState] = useState<Child | null>(null);

  const setChild = useCallback((newChild: Child) => {
    // TODO: Persist to backend/storage
    setChildState(newChild);
  }, []);

  const clearChild = useCallback(() => {
    // TODO: Clear from backend/storage
    setChildState(null);
  }, []);

  const value: ChildContextValue = {
    child,
    setChild,
    clearChild,
  };

  return (
    <ChildContext.Provider value={value}>{children}</ChildContext.Provider>
  );
}

export function useChild(): ChildContextValue {
  const context = useContext(ChildContext);
  if (context === null) {
    throw new Error("useChild must be used within a ChildProvider");
  }
  return context;
}
