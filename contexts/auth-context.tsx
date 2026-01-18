import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";

// Storage key for auth session
const AUTH_SESSION_KEY = "auth_session";

// CAPSULE-006: User roles for parent vs child access
export type UserRole = "parent" | "child";

// Session data structure stored in SecureStore
interface StoredSession {
  user: User;
  hasCompletedOnboarding: boolean;
  deletionScheduledAt?: string | null;
  userRole?: UserRole; // CAPSULE-006: Role of the logged-in user
  linkedChildId?: string; // CAPSULE-006: Child ID if logged in as child
}

export interface User {
  id: string;
  email: string;
  name?: string; // Display name for attribution (PRD Section 3.6, 4.2)
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  deletionScheduledAt: string | null;
  signIn: (email: string) => Promise<void>;
  signInAsChild: (childId: string, pin: string) => Promise<void>; // CAPSULE-006
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  requestAccountDeletion: () => Promise<void>;
  cancelAccountDeletion: () => Promise<void>;
  // CAPSULE-006: Child access properties
  userRole: UserRole;
  isChildView: boolean;
  linkedChildId: string | null;
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
  // CAPSULE-006: Child access state
  const [userRole, setUserRole] = useState<UserRole>("parent");
  const [linkedChildId, setLinkedChildId] = useState<string | null>(null);

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
          // CAPSULE-006: Restore role and linked child
          if (session.userRole) {
            setUserRole(session.userRole);
          }
          if (session.linkedChildId) {
            setLinkedChildId(session.linkedChildId);
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
      newRole: UserRole = "parent",
      newLinkedChildId: string | null = null,
    ) => {
      if (newUser) {
        const session: StoredSession = {
          user: newUser,
          hasCompletedOnboarding: newOnboarding,
          deletionScheduledAt: newDeletion,
          userRole: newRole,
          linkedChildId: newLinkedChildId ?? undefined,
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
      setUserRole("parent");
      setLinkedChildId(null);
      await persistSession(
        newUser,
        hasCompletedOnboarding,
        deletionScheduledAt,
        "parent",
        null,
      );
    },
    [persistSession, hasCompletedOnboarding, deletionScheduledAt],
  );

  // CAPSULE-006: Sign in as child with PIN
  const signInAsChild = useCallback(
    async (childId: string, _pin: string) => {
      // TODO: Replace with actual child auth flow (PIN verification)
      // For now, create a mock child user
      const newUser = {
        id: `child-user-${childId}`,
        email: `child-${childId}@littlejourney.app`,
        name: "Child",
      };
      setUser(newUser);
      setUserRole("child");
      setLinkedChildId(childId);
      await persistSession(
        newUser,
        true, // Children skip onboarding
        null, // No deletion for child accounts
        "child",
        childId,
      );
    },
    [persistSession],
  );

  const signOut = useCallback(async () => {
    setUser(null);
    setHasCompletedOnboarding(false);
    setDeletionScheduledAt(null);
    setUserRole("parent");
    setLinkedChildId(null);
    await persistSession(null, false, null, "parent", null);
  }, [persistSession]);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    if (user) {
      await persistSession(
        user,
        true,
        deletionScheduledAt,
        userRole,
        linkedChildId,
      );
    }
  }, [persistSession, user, deletionScheduledAt, userRole, linkedChildId]);

  const requestAccountDeletion = useCallback(async () => {
    // TODO: Send deletion request to backend
    // PRD Section 11.2: 30-day grace period before permanent deletion
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    const deletionIso = deletionDate.toISOString();
    setDeletionScheduledAt(deletionIso);
    if (user) {
      await persistSession(
        user,
        hasCompletedOnboarding,
        deletionIso,
        userRole,
        linkedChildId,
      );
    }
  }, [persistSession, user, hasCompletedOnboarding, userRole, linkedChildId]);

  const cancelAccountDeletion = useCallback(async () => {
    // TODO: Cancel deletion request on backend
    setDeletionScheduledAt(null);
    if (user) {
      await persistSession(
        user,
        hasCompletedOnboarding,
        null,
        userRole,
        linkedChildId,
      );
    }
  }, [persistSession, user, hasCompletedOnboarding, userRole, linkedChildId]);

  // CAPSULE-006: Computed property for child view check
  const isChildView = useMemo(() => userRole === "child", [userRole]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    hasCompletedOnboarding,
    deletionScheduledAt,
    signIn,
    signInAsChild,
    signOut,
    completeOnboarding,
    requestAccountDeletion,
    cancelAccountDeletion,
    // CAPSULE-006: Child access properties
    userRole,
    isChildView,
    linkedChildId,
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
