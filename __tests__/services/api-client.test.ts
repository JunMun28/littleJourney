import {
  entryApi,
  childApi,
  familyApi,
  milestoneApi,
  isApiError,
  clearAllMockData,
} from "@/services/api-client";
import type { NewEntry } from "@/contexts/entry-context";

describe("API Client", () => {
  beforeEach(() => {
    clearAllMockData();
  });

  describe("entryApi", () => {
    const mockEntry: NewEntry = {
      type: "photo",
      mediaUris: ["file://test.jpg"],
      caption: "Test caption",
      date: "2024-01-15",
    };

    it("creates an entry and returns it with id and timestamps", async () => {
      const result = await entryApi.createEntry({ entry: mockEntry });

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data.id).toMatch(/^entry_/);
        expect(result.data.type).toBe("photo");
        expect(result.data.caption).toBe("Test caption");
        expect(result.data.createdAt).toBeDefined();
        expect(result.data.updatedAt).toBeDefined();
      }
    });

    it("gets entries with pagination", async () => {
      // Create 3 entries
      await entryApi.createEntry({ entry: mockEntry });
      await entryApi.createEntry({
        entry: { ...mockEntry, caption: "Second" },
      });
      await entryApi.createEntry({ entry: { ...mockEntry, caption: "Third" } });

      const result = await entryApi.getEntries({ limit: 2 });

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.hasMore).toBe(true);
        expect(result.data.cursor).toBe("2");
      }
    });

    it("gets a single entry by id", async () => {
      const created = await entryApi.createEntry({ entry: mockEntry });
      if (isApiError(created)) throw new Error("Failed to create");

      const result = await entryApi.getEntry(created.data.id);

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data.id).toBe(created.data.id);
      }
    });

    it("returns error for non-existent entry", async () => {
      const result = await entryApi.getEntry("non-existent");

      expect(isApiError(result)).toBe(true);
      if (isApiError(result)) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });

    it("updates an entry", async () => {
      const created = await entryApi.createEntry({ entry: mockEntry });
      if (isApiError(created)) throw new Error("Failed to create");

      const result = await entryApi.updateEntry({
        id: created.data.id,
        updates: { caption: "Updated caption" },
      });

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data.caption).toBe("Updated caption");
        expect(result.data.updatedAt).not.toBe(created.data.updatedAt);
      }
    });

    it("deletes an entry", async () => {
      const created = await entryApi.createEntry({ entry: mockEntry });
      if (isApiError(created)) throw new Error("Failed to create");

      const deleteResult = await entryApi.deleteEntry(created.data.id);
      expect(isApiError(deleteResult)).toBe(false);

      const getResult = await entryApi.getEntry(created.data.id);
      expect(isApiError(getResult)).toBe(true);
    });
  });

  describe("childApi", () => {
    it("creates a child with id", async () => {
      const result = await childApi.createChild({
        name: "Emma",
        dateOfBirth: "2024-06-15",
        culturalTradition: "chinese",
      });

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data.id).toMatch(/^child_/);
        expect(result.data.name).toBe("Emma");
        expect(result.data.culturalTradition).toBe("chinese");
      }
    });

    it("gets all children", async () => {
      await childApi.createChild({ name: "Emma", dateOfBirth: "2024-06-15" });
      await childApi.createChild({ name: "Liam", dateOfBirth: "2023-03-20" });

      const result = await childApi.getChildren();

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("updates a child", async () => {
      const created = await childApi.createChild({
        name: "Emma",
        dateOfBirth: "2024-06-15",
      });
      if (isApiError(created)) throw new Error("Failed to create");

      const result = await childApi.updateChild({
        id: created.data.id!,
        updates: { nickname: "Emmy" },
      });

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data.nickname).toBe("Emmy");
      }
    });
  });

  describe("familyApi", () => {
    it("invites a family member", async () => {
      const result = await familyApi.inviteFamilyMember({
        email: "grandma@example.com",
        relationship: "Grandmother",
        permissionLevel: "view_interact",
      });

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data.id).toMatch(/^family_/);
        expect(result.data.email).toBe("grandma@example.com");
        expect(result.data.status).toBe("pending");
      }
    });

    it("gets all family members", async () => {
      await familyApi.inviteFamilyMember({
        email: "grandma@example.com",
        relationship: "Grandmother",
        permissionLevel: "view_interact",
      });

      const result = await familyApi.getFamilyMembers();

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("removes a family member", async () => {
      const invited = await familyApi.inviteFamilyMember({
        email: "grandma@example.com",
        relationship: "Grandmother",
        permissionLevel: "view_interact",
      });
      if (isApiError(invited)) throw new Error("Failed to invite");

      const result = await familyApi.removeFamilyMember(invited.data.id);
      expect(isApiError(result)).toBe(false);

      const list = await familyApi.getFamilyMembers();
      if (!isApiError(list)) {
        expect(list.data).toHaveLength(0);
      }
    });
  });

  describe("milestoneApi", () => {
    it("creates a milestone", async () => {
      const result = await milestoneApi.createMilestone({
        templateId: "full_month",
        childId: "child_123",
        milestoneDate: "2024-07-15",
      });

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data.id).toMatch(/^milestone_/);
        expect(result.data.templateId).toBe("full_month");
        expect(result.data.isCompleted).toBe(false);
      }
    });

    it("completes a milestone", async () => {
      const created = await milestoneApi.createMilestone({
        templateId: "full_month",
        childId: "child_123",
        milestoneDate: "2024-07-15",
      });
      if (isApiError(created)) throw new Error("Failed to create");

      const result = await milestoneApi.completeMilestone({
        id: created.data.id,
        celebrationDate: "2024-07-16",
        notes: "Great celebration!",
      });

      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect(result.data.isCompleted).toBe(true);
        expect(result.data.celebrationDate).toBe("2024-07-16");
        expect(result.data.notes).toBe("Great celebration!");
      }
    });

    it("deletes a milestone", async () => {
      const created = await milestoneApi.createMilestone({
        templateId: "full_month",
        childId: "child_123",
        milestoneDate: "2024-07-15",
      });
      if (isApiError(created)) throw new Error("Failed to create");

      const result = await milestoneApi.deleteMilestone(created.data.id);
      expect(isApiError(result)).toBe(false);

      const list = await milestoneApi.getMilestones();
      if (!isApiError(list)) {
        expect(list.data).toHaveLength(0);
      }
    });
  });

  describe("isApiError", () => {
    it("correctly identifies success responses", () => {
      const success = { data: { test: true } };
      expect(isApiError(success)).toBe(false);
    });

    it("correctly identifies error responses", () => {
      const error = { error: { code: "ERROR", message: "test" } };
      expect(isApiError(error)).toBe(true);
    });
  });
});
