/**
 * TDD tests for ViewerContext - tracks viewer type and permissions (SHARE-005)
 *
 * Two viewer types:
 * 1. "parent" - Full access, can edit/delete entries, manage family
 * 2. "family" - Accessed via magic link, permissions based on invitation
 *
 * Permission levels for family viewers:
 * - "view_only" - Can only view entries (no comments/reactions)
 * - "view_interact" - Can view, comment, and react
 */
import { renderHook, act } from "@testing-library/react-native";
import { ReactNode } from "react";
import {
  ViewerProvider,
  useViewer,
  ViewerType,
  PermissionLevel,
} from "@/contexts/viewer-context";

// Wrapper for hooks
const wrapper = ({ children }: { children: ReactNode }) => (
  <ViewerProvider>{children}</ViewerProvider>
);

describe("ViewerContext", () => {
  describe("default state", () => {
    it("defaults to parent viewer type", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      expect(result.current.viewerType).toBe("parent");
    });

    it("defaults to null permission level for parent", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      // Parents don't have permission levels (they have full access)
      expect(result.current.permissionLevel).toBeNull();
    });

    it("returns canComment as true for parent", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      expect(result.current.canComment).toBe(true);
    });

    it("returns canReact as true for parent", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      expect(result.current.canReact).toBe(true);
    });

    it("returns canEdit as true for parent", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      expect(result.current.canEdit).toBe(true);
    });

    it("returns canDelete as true for parent", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      expect(result.current.canDelete).toBe(true);
    });
  });

  describe("setFamilyViewer", () => {
    it("sets viewer type to family with view_interact permission", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_interact", "family-123");
      });

      expect(result.current.viewerType).toBe("family");
      expect(result.current.permissionLevel).toBe("view_interact");
      expect(result.current.familyMemberId).toBe("family-123");
    });

    it("sets viewer type to family with view_only permission", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_only", "family-456");
      });

      expect(result.current.viewerType).toBe("family");
      expect(result.current.permissionLevel).toBe("view_only");
      expect(result.current.familyMemberId).toBe("family-456");
    });
  });

  describe("view_interact permissions", () => {
    it("allows commenting for view_interact family member", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_interact", "family-123");
      });

      expect(result.current.canComment).toBe(true);
    });

    it("allows reacting for view_interact family member", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_interact", "family-123");
      });

      expect(result.current.canReact).toBe(true);
    });

    it("disallows editing for view_interact family member", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_interact", "family-123");
      });

      expect(result.current.canEdit).toBe(false);
    });

    it("disallows deleting for view_interact family member", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_interact", "family-123");
      });

      expect(result.current.canDelete).toBe(false);
    });
  });

  describe("view_only permissions (SHARE-005)", () => {
    it("disallows commenting for view_only family member", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_only", "family-456");
      });

      expect(result.current.canComment).toBe(false);
    });

    it("disallows reacting for view_only family member", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_only", "family-456");
      });

      expect(result.current.canReact).toBe(false);
    });

    it("disallows editing for view_only family member", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_only", "family-456");
      });

      expect(result.current.canEdit).toBe(false);
    });

    it("disallows deleting for view_only family member", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_only", "family-456");
      });

      expect(result.current.canDelete).toBe(false);
    });
  });

  describe("setParentViewer", () => {
    it("resets to parent viewer type from family", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      // First set as family
      act(() => {
        result.current.setFamilyViewer("view_only", "family-456");
      });

      expect(result.current.viewerType).toBe("family");

      // Reset to parent
      act(() => {
        result.current.setParentViewer();
      });

      expect(result.current.viewerType).toBe("parent");
      expect(result.current.permissionLevel).toBeNull();
      expect(result.current.familyMemberId).toBeNull();
    });

    it("restores full permissions when switching to parent", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      // First set as view_only family
      act(() => {
        result.current.setFamilyViewer("view_only", "family-456");
      });

      expect(result.current.canComment).toBe(false);
      expect(result.current.canReact).toBe(false);

      // Reset to parent
      act(() => {
        result.current.setParentViewer();
      });

      expect(result.current.canComment).toBe(true);
      expect(result.current.canReact).toBe(true);
      expect(result.current.canEdit).toBe(true);
      expect(result.current.canDelete).toBe(true);
    });
  });

  describe("isParent helper", () => {
    it("returns true when viewer is parent", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      expect(result.current.isParent).toBe(true);
    });

    it("returns false when viewer is family", () => {
      const { result } = renderHook(() => useViewer(), { wrapper });

      act(() => {
        result.current.setFamilyViewer("view_interact", "family-123");
      });

      expect(result.current.isParent).toBe(false);
    });
  });

  describe("useViewer outside provider", () => {
    it("throws error when used outside ViewerProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useViewer());
      }).toThrow("useViewer must be used within a ViewerProvider");

      consoleSpy.mockRestore();
    });
  });
});

// Type assertion tests (compile-time checks)
describe("ViewerContext types", () => {
  it("ViewerType only allows parent or family", () => {
    const validTypes: ViewerType[] = ["parent", "family"];
    expect(validTypes).toHaveLength(2);
  });

  it("PermissionLevel only allows view_only or view_interact", () => {
    const validLevels: PermissionLevel[] = ["view_only", "view_interact"];
    expect(validLevels).toHaveLength(2);
  });
});
