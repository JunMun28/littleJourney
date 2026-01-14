import { renderHook, act } from "@testing-library/react-native";
import {
  FamilyProvider,
  useFamily,
  type FamilyMember,
  type PermissionLevel,
} from "@/contexts/family-context";

describe("FamilyContext", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FamilyProvider>{children}</FamilyProvider>
  );

  it("should throw error when used outside provider", () => {
    expect(() => {
      renderHook(() => useFamily());
    }).toThrow("useFamily must be used within a FamilyProvider");
  });

  it("should have empty family members initially", () => {
    const { result } = renderHook(() => useFamily(), { wrapper });
    expect(result.current.familyMembers).toEqual([]);
  });

  it("should add a family member with email and permission", () => {
    const { result } = renderHook(() => useFamily(), { wrapper });

    act(() => {
      result.current.inviteFamilyMember({
        email: "grandma@example.com",
        relationship: "Grandmother",
        permissionLevel: "view_only",
      });
    });

    expect(result.current.familyMembers).toHaveLength(1);
    expect(result.current.familyMembers[0]).toMatchObject({
      email: "grandma@example.com",
      relationship: "Grandmother",
      permissionLevel: "view_only",
      status: "pending",
    });
    expect(result.current.familyMembers[0].id).toBeDefined();
  });

  it("should add family member with view_interact permission", () => {
    const { result } = renderHook(() => useFamily(), { wrapper });

    act(() => {
      result.current.inviteFamilyMember({
        email: "uncle@example.com",
        relationship: "Uncle",
        permissionLevel: "view_interact",
      });
    });

    expect(result.current.familyMembers[0].permissionLevel).toBe(
      "view_interact",
    );
  });

  it("should remove a family member by id", () => {
    const { result } = renderHook(() => useFamily(), { wrapper });

    act(() => {
      result.current.inviteFamilyMember({
        email: "aunt@example.com",
        relationship: "Aunt",
        permissionLevel: "view_only",
      });
    });

    const memberId = result.current.familyMembers[0].id;

    act(() => {
      result.current.removeFamilyMember(memberId);
    });

    expect(result.current.familyMembers).toHaveLength(0);
  });

  it("should check if pending invites exist", () => {
    const { result } = renderHook(() => useFamily(), { wrapper });

    expect(result.current.hasPendingInvites).toBe(false);

    act(() => {
      result.current.inviteFamilyMember({
        email: "grandpa@example.com",
        relationship: "Grandfather",
        permissionLevel: "view_interact",
      });
    });

    expect(result.current.hasPendingInvites).toBe(true);
  });
});
