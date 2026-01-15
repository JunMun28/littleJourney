/**
 * API Client abstraction layer
 *
 * This module provides a typed API client that:
 * - Uses mock implementations during development
 * - Ready for real Cloudflare Workers backend integration
 * - Works with TanStack Query for caching/revalidation
 * - Includes auth token handling via getAuthHeaders
 */

import { Entry, NewEntry } from "@/contexts/entry-context";
import {
  Child as ChildBase,
  CulturalTradition,
} from "@/contexts/child-context";
import { FamilyMember, PermissionLevel } from "@/contexts/family-context";
import { Milestone } from "@/contexts/milestone-context";
import { getAuthHeaders } from "./auth-api";

// API version of Child with ID (context version may not have it yet)
export interface Child extends ChildBase {
  id?: string;
}

// API configuration
const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "https://api.littlejourney.sg",
  useMock: process.env.EXPO_PUBLIC_USE_MOCK_API !== "false", // Default to mock
};

// Generic API response types
export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  cursor?: string;
  hasMore: boolean;
}

// Entry API types
export interface CreateEntryRequest {
  entry: NewEntry;
}

export interface UpdateEntryRequest {
  id: string;
  updates: Partial<NewEntry>;
}

export interface GetEntriesParams {
  childId?: string;
  cursor?: string;
  limit?: number;
}

// Child API types
export interface CreateChildRequest {
  name: string;
  dateOfBirth: string;
  nickname?: string;
  photoUri?: string;
  culturalTradition?: CulturalTradition;
}

export interface UpdateChildRequest {
  id: string;
  updates: Partial<CreateChildRequest>;
}

// Family API types
export interface InviteFamilyRequest {
  email: string;
  relationship: string;
  permissionLevel: PermissionLevel;
}

// Milestone API types
export interface CreateMilestoneRequest {
  templateId?: string;
  childId: string;
  customTitle?: string;
  customDescription?: string;
  milestoneDate: string;
}

export interface CompleteMilestoneRequest {
  id: string;
  celebrationDate?: string;
  notes?: string;
}

// Comment and Reaction types
export interface Comment {
  id: string;
  entryId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Reaction {
  id: string;
  entryId: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  entryId: string;
  text: string;
  authorId: string;
  authorName: string;
}

export interface AddReactionRequest {
  entryId: string;
  emoji: string;
  userId: string;
  userName: string;
}

// Mock data store (in-memory for development)
let mockEntries: Entry[] = [];
let mockChildren: Child[] = [];
let mockFamilyMembers: FamilyMember[] = [];
let mockMilestones: Milestone[] = [];
let mockComments: Comment[] = [];
let mockReactions: Reaction[] = [];

// Helper to generate IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to simulate network delay
async function simulateDelay(ms: number = 100): Promise<void> {
  if (API_CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Entry API
export const entryApi = {
  async getEntries(
    params?: GetEntriesParams,
  ): Promise<ApiResult<PaginatedResponse<Entry>>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const limit = params?.limit || 20;
      const startIndex = params?.cursor ? parseInt(params.cursor, 10) : 0;
      const items = mockEntries.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < mockEntries.length;

      return {
        data: {
          items,
          cursor: hasMore ? String(startIndex + limit) : undefined,
          hasMore,
        },
      };
    }

    // Real API call
    const response = await fetch(
      `${API_CONFIG.baseUrl}/entries?${new URLSearchParams(params as Record<string, string>)}`,
      { headers: getAuthHeaders() },
    );
    return response.json();
  },

  async getEntry(id: string): Promise<ApiResult<Entry>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const entry = mockEntries.find((e) => e.id === id);
      if (!entry) {
        return { error: { code: "NOT_FOUND", message: "Entry not found" } };
      }
      return { data: entry };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/entries/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async createEntry(request: CreateEntryRequest): Promise<ApiResult<Entry>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const now = new Date().toISOString();
      const entry: Entry = {
        ...request.entry,
        id: generateId("entry"),
        createdAt: now,
        updatedAt: now,
      };
      mockEntries.unshift(entry); // Add to beginning (newest first)
      return { data: entry };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async updateEntry(request: UpdateEntryRequest): Promise<ApiResult<Entry>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockEntries.findIndex((e) => e.id === request.id);
      if (index === -1) {
        return { error: { code: "NOT_FOUND", message: "Entry not found" } };
      }
      const updatedEntry: Entry = {
        ...mockEntries[index],
        ...request.updates,
        updatedAt: new Date().toISOString(),
      };
      mockEntries[index] = updatedEntry;
      return { data: updatedEntry };
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}/entries/${request.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(request.updates),
      },
    );
    return response.json();
  },

  async deleteEntry(id: string): Promise<ApiResult<{ success: boolean }>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockEntries.findIndex((e) => e.id === id);
      if (index === -1) {
        return { error: { code: "NOT_FOUND", message: "Entry not found" } };
      }
      mockEntries.splice(index, 1);
      return { data: { success: true } };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/entries/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Clear mock data (for testing)
  _clearMockData(): void {
    mockEntries = [];
  },
};

// Child API
export const childApi = {
  async getChildren(): Promise<ApiResult<Child[]>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      return { data: mockChildren };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/children`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async createChild(request: CreateChildRequest): Promise<ApiResult<Child>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const child: Child = {
        ...request,
        id: generateId("child"),
      };
      mockChildren.push(child);
      return { data: child };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async updateChild(request: UpdateChildRequest): Promise<ApiResult<Child>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockChildren.findIndex((c) => c.id === request.id);
      if (index === -1) {
        return { error: { code: "NOT_FOUND", message: "Child not found" } };
      }
      const updatedChild: Child = {
        ...mockChildren[index],
        ...request.updates,
      };
      mockChildren[index] = updatedChild;
      return { data: updatedChild };
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}/children/${request.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(request.updates),
      },
    );
    return response.json();
  },

  // Clear mock data (for testing)
  _clearMockData(): void {
    mockChildren = [];
  },
};

// Family API
export const familyApi = {
  async getFamilyMembers(): Promise<ApiResult<FamilyMember[]>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      return { data: mockFamilyMembers };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/family`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async inviteFamilyMember(
    request: InviteFamilyRequest,
  ): Promise<ApiResult<FamilyMember>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const member: FamilyMember = {
        id: generateId("family"),
        email: request.email,
        relationship: request.relationship,
        permissionLevel: request.permissionLevel,
        status: "pending",
        invitedAt: new Date().toISOString(),
      };
      mockFamilyMembers.push(member);
      return { data: member };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/family/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async removeFamilyMember(
    id: string,
  ): Promise<ApiResult<{ success: boolean }>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockFamilyMembers.findIndex((m) => m.id === id);
      if (index === -1) {
        return {
          error: { code: "NOT_FOUND", message: "Family member not found" },
        };
      }
      mockFamilyMembers.splice(index, 1);
      return { data: { success: true } };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/family/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async resendInvite(id: string): Promise<ApiResult<FamilyMember>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockFamilyMembers.findIndex((m) => m.id === id);
      if (index === -1) {
        return {
          error: { code: "NOT_FOUND", message: "Family member not found" },
        };
      }
      // Update invitedAt to now (simulates resending invite)
      const updated: FamilyMember = {
        ...mockFamilyMembers[index],
        invitedAt: new Date().toISOString(),
        status: "pending",
      };
      mockFamilyMembers[index] = updated;
      return { data: updated };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/family/${id}/resend`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // PRD SHARE-007: Record family member view activity
  async recordFamilyView(id: string): Promise<ApiResult<FamilyMember>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockFamilyMembers.findIndex((m) => m.id === id);
      if (index === -1) {
        return {
          error: { code: "NOT_FOUND", message: "Family member not found" },
        };
      }
      // Update lastViewedAt to now
      const updated: FamilyMember = {
        ...mockFamilyMembers[index],
        lastViewedAt: new Date().toISOString(),
      };
      mockFamilyMembers[index] = updated;
      return { data: updated };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/family/${id}/view`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Clear mock data (for testing)
  _clearMockData(): void {
    mockFamilyMembers = [];
  },
};

// Milestone API
export const milestoneApi = {
  async getMilestones(): Promise<ApiResult<Milestone[]>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      return { data: mockMilestones };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/milestones`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async createMilestone(
    request: CreateMilestoneRequest,
  ): Promise<ApiResult<Milestone>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const now = new Date().toISOString();
      const milestone: Milestone = {
        id: generateId("milestone"),
        templateId: request.templateId,
        childId: request.childId,
        milestoneDate: request.milestoneDate,
        customTitle: request.customTitle,
        customDescription: request.customDescription,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      };
      mockMilestones.push(milestone);
      return { data: milestone };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async completeMilestone(
    request: CompleteMilestoneRequest,
  ): Promise<ApiResult<Milestone>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockMilestones.findIndex((m) => m.id === request.id);
      if (index === -1) {
        return { error: { code: "NOT_FOUND", message: "Milestone not found" } };
      }
      const completed: Milestone = {
        ...mockMilestones[index],
        isCompleted: true,
        celebrationDate: request.celebrationDate,
        notes: request.notes,
        updatedAt: new Date().toISOString(),
      };
      mockMilestones[index] = completed;
      return { data: completed };
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}/milestones/${request.id}/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(request),
      },
    );
    return response.json();
  },

  async deleteMilestone(id: string): Promise<ApiResult<{ success: boolean }>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockMilestones.findIndex((m) => m.id === id);
      if (index === -1) {
        return { error: { code: "NOT_FOUND", message: "Milestone not found" } };
      }
      mockMilestones.splice(index, 1);
      return { data: { success: true } };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/milestones/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Clear mock data (for testing)
  _clearMockData(): void {
    mockMilestones = [];
  },
};

// Comment API
export const commentApi = {
  async getComments(entryId: string): Promise<ApiResult<Comment[]>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const comments = mockComments.filter((c) => c.entryId === entryId);
      return { data: comments };
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}/entries/${entryId}/comments`,
      { headers: getAuthHeaders() },
    );
    return response.json();
  },

  async createComment(
    request: CreateCommentRequest,
  ): Promise<ApiResult<Comment>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const comment: Comment = {
        id: generateId("comment"),
        entryId: request.entryId,
        text: request.text,
        authorId: request.authorId,
        authorName: request.authorName,
        createdAt: new Date().toISOString(),
      };
      mockComments.push(comment);
      return { data: comment };
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}/entries/${request.entryId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(request),
      },
    );
    return response.json();
  },

  async deleteComment(id: string): Promise<ApiResult<{ success: boolean }>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockComments.findIndex((c) => c.id === id);
      if (index === -1) {
        return { error: { code: "NOT_FOUND", message: "Comment not found" } };
      }
      mockComments.splice(index, 1);
      return { data: { success: true } };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/comments/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async getReactions(entryId: string): Promise<ApiResult<Reaction[]>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const reactions = mockReactions.filter((r) => r.entryId === entryId);
      return { data: reactions };
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}/entries/${entryId}/reactions`,
      { headers: getAuthHeaders() },
    );
    return response.json();
  },

  async addReaction(request: AddReactionRequest): Promise<ApiResult<Reaction>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      // Check for duplicate reaction from same user with same emoji
      const existing = mockReactions.find(
        (r) =>
          r.entryId === request.entryId &&
          r.userId === request.userId &&
          r.emoji === request.emoji,
      );
      if (existing) {
        return {
          error: {
            code: "DUPLICATE",
            message: "User already reacted with this emoji",
          },
        };
      }

      const reaction: Reaction = {
        id: generateId("reaction"),
        entryId: request.entryId,
        emoji: request.emoji,
        userId: request.userId,
        userName: request.userName,
        createdAt: new Date().toISOString(),
      };
      mockReactions.push(reaction);
      return { data: reaction };
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}/entries/${request.entryId}/reactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(request),
      },
    );
    return response.json();
  },

  async removeReaction(id: string): Promise<ApiResult<{ success: boolean }>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const index = mockReactions.findIndex((r) => r.id === id);
      if (index === -1) {
        return { error: { code: "NOT_FOUND", message: "Reaction not found" } };
      }
      mockReactions.splice(index, 1);
      return { data: { success: true } };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/reactions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async getCommentCount(entryId: string): Promise<ApiResult<number>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const count = mockComments.filter((c) => c.entryId === entryId).length;
      return { data: count };
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}/entries/${entryId}/comments/count`,
      { headers: getAuthHeaders() },
    );
    return response.json();
  },

  async getReactionCount(entryId: string): Promise<ApiResult<number>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const count = mockReactions.filter((r) => r.entryId === entryId).length;
      return { data: count };
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}/entries/${entryId}/reactions/count`,
      { headers: getAuthHeaders() },
    );
    return response.json();
  },

  // Clear mock data (for testing)
  _clearMockData(): void {
    mockComments = [];
    mockReactions = [];
  },
};

// Utility to check if result is error
export function isApiError<T>(result: ApiResult<T>): result is ApiError {
  return "error" in result && result.error !== undefined;
}

// Clear all mock data (for testing)
export function clearAllMockData(): void {
  entryApi._clearMockData();
  childApi._clearMockData();
  familyApi._clearMockData();
  milestoneApi._clearMockData();
  commentApi._clearMockData();
}
