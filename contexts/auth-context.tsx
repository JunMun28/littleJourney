import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  deletionScheduledAt: string | null;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  requestAccountDeletion: () => Promise<void>;
  cancelAccountDeletion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    // Check for existing session on mount
    // TODO: Replace with actual session check from expo-secure-store
    // TODO: Also check if onboarding was completed
    const checkSession = async () => {
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const signIn = useCallback(async (email: string) => {
    // TODO: Replace with actual auth flow (magic link, OAuth)
    setUser({
      id: "mock-user-id",
      email,
    });
  }, []);

  const signOut = useCallback(async () => {
    // TODO: Clear token from expo-secure-store
    setUser(null);
    setHasCompletedOnboarding(false);
    setDeletionScheduledAt(null);
  }, []);

  const completeOnboarding = useCallback(async () => {
    // TODO: Persist onboarding completion to backend/storage
    setHasCompletedOnboarding(true);
  }, []);

  const requestAccountDeletion = useCallback(async () => {
    // TODO: Send deletion request to backend
    // PRD Section 11.2: 30-day grace period before permanent deletion
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    setDeletionScheduledAt(deletionDate.toISOString());
  }, []);

  const cancelAccountDeletion = useCallback(async () => {
    // TODO: Cancel deletion request on backend
    setDeletionScheduledAt(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    hasCompletedOnboarding,
    deletionScheduledAt,
    signIn,
    signOut,
    completeOnboarding,
    requestAccountDeletion,
    cancelAccountDeletion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
