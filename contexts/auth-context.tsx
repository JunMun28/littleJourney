import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";

// Storage key for auth session
const AUTH_SESSION_KEY = "auth_session";

// Session data structure stored in SecureStore
interface StoredSession {
  user: User;
  hasCompletedOnboarding: boolean;
  deletionScheduledAt?: string | null;
}

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
    // Restore session from SecureStore on mount
    const restoreSession = async () => {
      try {
        const storedData = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
        if (storedData) {
          const session: StoredSession = JSON.parse(storedData);
          setUser(session.user);
          setHasCompletedOnboarding(session.hasCompletedOnboarding);
          if (session.deletionScheduledAt) {
            setDeletionScheduledAt(session.deletionScheduledAt);
          }
        }
      } catch {
        // Failed to restore session, start fresh
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Helper to persist session to SecureStore
  const persistSession = useCallback(
    async (
      newUser: User | null,
      newOnboarding: boolean,
      newDeletion: string | null,
    ) => {
      if (newUser) {
        const session: StoredSession = {
          user: newUser,
          hasCompletedOnboarding: newOnboarding,
          deletionScheduledAt: newDeletion,
        };
        await SecureStore.setItemAsync(
          AUTH_SESSION_KEY,
          JSON.stringify(session),
        );
      } else {
        await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
      }
    },
    [],
  );

  const signIn = useCallback(
    async (email: string) => {
      // TODO: Replace with actual auth flow (magic link, OAuth)
      const newUser = {
        id: "mock-user-id",
        email,
      };
      setUser(newUser);
      await persistSession(
        newUser,
        hasCompletedOnboarding,
        deletionScheduledAt,
      );
    },
    [persistSession, hasCompletedOnboarding, deletionScheduledAt],
  );

  const signOut = useCallback(async () => {
    setUser(null);
    setHasCompletedOnboarding(false);
    setDeletionScheduledAt(null);
    await persistSession(null, false, null);
  }, [persistSession]);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    if (user) {
      await persistSession(user, true, deletionScheduledAt);
    }
  }, [persistSession, user, deletionScheduledAt]);

  const requestAccountDeletion = useCallback(async () => {
    // TODO: Send deletion request to backend
    // PRD Section 11.2: 30-day grace period before permanent deletion
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    const deletionIso = deletionDate.toISOString();
    setDeletionScheduledAt(deletionIso);
    if (user) {
      await persistSession(user, hasCompletedOnboarding, deletionIso);
    }
  }, [persistSession, user, hasCompletedOnboarding]);

  const cancelAccountDeletion = useCallback(async () => {
    // TODO: Cancel deletion request on backend
    setDeletionScheduledAt(null);
    if (user) {
      await persistSession(user, hasCompletedOnboarding, null);
    }
  }, [persistSession, user, hasCompletedOnboarding]);

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
