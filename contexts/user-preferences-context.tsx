import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface UserPreferencesContextValue {
  dailyPromptTime: string | null; // 24-hour format "HH:mm" (e.g., "20:00")
  setDailyPromptTime: (time: string | null) => void;
}

const UserPreferencesContext =
  createContext<UserPreferencesContextValue | null>(null);

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export function UserPreferencesProvider({
  children,
}: UserPreferencesProviderProps) {
  const [dailyPromptTime, setDailyPromptTimeState] = useState<string | null>(
    null,
  );

  const setDailyPromptTime = useCallback((time: string | null) => {
    // TODO: Persist to backend/storage
    setDailyPromptTimeState(time);
  }, []);

  const value: UserPreferencesContextValue = {
    dailyPromptTime,
    setDailyPromptTime,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextValue {
  const context = useContext(UserPreferencesContext);
  if (context === null) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider",
    );
  }
  return context;
}
