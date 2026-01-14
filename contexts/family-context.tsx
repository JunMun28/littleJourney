import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export type PermissionLevel = "view_only" | "view_interact";
export type InviteStatus = "pending" | "accepted" | "expired";

export interface FamilyMember {
  id: string;
  email: string;
  relationship: string;
  permissionLevel: PermissionLevel;
  status: InviteStatus;
  invitedAt: string;
}

interface InviteFamilyMemberParams {
  email: string;
  relationship: string;
  permissionLevel: PermissionLevel;
}

interface FamilyContextValue {
  familyMembers: FamilyMember[];
  hasPendingInvites: boolean;
  inviteFamilyMember: (params: InviteFamilyMemberParams) => void;
  removeFamilyMember: (id: string) => void;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

interface FamilyProviderProps {
  children: ReactNode;
}

export function FamilyProvider({ children }: FamilyProviderProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const inviteFamilyMember = useCallback(
    ({ email, relationship, permissionLevel }: InviteFamilyMemberParams) => {
      const newMember: FamilyMember = {
        id: `family-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        email,
        relationship,
        permissionLevel,
        status: "pending",
        invitedAt: new Date().toISOString(),
      };

      // TODO: Send invite email via API
      setFamilyMembers((prev) => [...prev, newMember]);
    },
    [],
  );

  const removeFamilyMember = useCallback((id: string) => {
    // TODO: Revoke access via API
    setFamilyMembers((prev) => prev.filter((member) => member.id !== id));
  }, []);

  const hasPendingInvites = useMemo(
    () => familyMembers.some((member) => member.status === "pending"),
    [familyMembers],
  );

  const value: FamilyContextValue = {
    familyMembers,
    hasPendingInvites,
    inviteFamilyMember,
    removeFamilyMember,
  };

  return (
    <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
  );
}

export function useFamily(): FamilyContextValue {
  const context = useContext(FamilyContext);
  if (context === null) {
    throw new Error("useFamily must be used within a FamilyProvider");
  }
  return context;
}
