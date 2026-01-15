/**
 * ViewerContext - Tracks current viewer type and permissions (SHARE-005)
 *
 * Two viewer types:
 * 1. "parent" - Full access via mobile app (can edit/delete/comment/react)
 * 2. "family" - Access via magic link, permissions based on invitation level
 *
 * Permission levels for family viewers:
 * - "view_only" - Can only view entries (no comments/reactions) - PRD SHARE-005
 * - "view_interact" - Can view, comment, and react - PRD SHARE-006
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export type ViewerType = "parent" | "family";
export type PermissionLevel = "view_only" | "view_interact";

interface ViewerContextValue {
  // Current viewer state
  viewerType: ViewerType;
  permissionLevel: PermissionLevel | null;
  familyMemberId: string | null;

  // Computed permission helpers
  isParent: boolean;
  canComment: boolean;
  canReact: boolean;
  canEdit: boolean;
  canDelete: boolean;

  // State setters
  setFamilyViewer: (permission: PermissionLevel, memberId: string) => void;
  setParentViewer: () => void;
}

const ViewerContext = createContext<ViewerContextValue | null>(null);

interface ViewerProviderProps {
  children: ReactNode;
}

export function ViewerProvider({ children }: ViewerProviderProps) {
  const [viewerType, setViewerType] = useState<ViewerType>("parent");
  const [permissionLevel, setPermissionLevel] =
    useState<PermissionLevel | null>(null);
  const [familyMemberId, setFamilyMemberId] = useState<string | null>(null);

  // Set viewer as family member with specific permission level
  const setFamilyViewer = useCallback(
    (permission: PermissionLevel, memberId: string) => {
      setViewerType("family");
      setPermissionLevel(permission);
      setFamilyMemberId(memberId);
    },
    [],
  );

  // Reset to parent viewer (full permissions)
  const setParentViewer = useCallback(() => {
    setViewerType("parent");
    setPermissionLevel(null);
    setFamilyMemberId(null);
  }, []);

  // Computed permission helpers
  const isParent = viewerType === "parent";

  // Parents have full access
  // Family with view_interact can comment/react
  // Family with view_only cannot comment/react (PRD SHARE-005)
  const canComment = useMemo(() => {
    if (isParent) return true;
    return permissionLevel === "view_interact";
  }, [isParent, permissionLevel]);

  const canReact = useMemo(() => {
    if (isParent) return true;
    return permissionLevel === "view_interact";
  }, [isParent, permissionLevel]);

  // Only parents can edit/delete entries
  const canEdit = isParent;
  const canDelete = isParent;

  const value: ViewerContextValue = {
    viewerType,
    permissionLevel,
    familyMemberId,
    isParent,
    canComment,
    canReact,
    canEdit,
    canDelete,
    setFamilyViewer,
    setParentViewer,
  };

  return (
    <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>
  );
}

export function useViewer(): ViewerContextValue {
  const context = useContext(ViewerContext);
  if (context === null) {
    throw new Error("useViewer must be used within a ViewerProvider");
  }
  return context;
}
