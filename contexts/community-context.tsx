import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface CommunityContextValue {
  // State
  communityDataSharingEnabled: boolean;
  sharingExplanation: string;

  // Actions
  setCommunityDataSharingEnabled: (enabled: boolean) => void;
}

const SHARING_EXPLANATION =
  "When enabled, anonymized milestone timing data (e.g., age when child reached milestones) " +
  "is shared to help other parents understand typical ranges. Your name, photos, and " +
  "personal details are never shared. You can disable this at any time.";

const CommunityContext = createContext<CommunityContextValue | null>(null);

interface CommunityProviderProps {
  children: ReactNode;
}

export function CommunityProvider({ children }: CommunityProviderProps) {
  // Default OFF per PRD requirement (COMMUNITY-003: "Verify default is OFF")
  const [communityDataSharingEnabled, setCommunityDataSharingEnabledState] =
    useState(false);

  const setCommunityDataSharingEnabled = useCallback((enabled: boolean) => {
    setCommunityDataSharingEnabledState(enabled);
  }, []);

  const value: CommunityContextValue = {
    communityDataSharingEnabled,
    sharingExplanation: SHARING_EXPLANATION,
    setCommunityDataSharingEnabled,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity(): CommunityContextValue {
  const context = useContext(CommunityContext);
  if (context === null) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
}
