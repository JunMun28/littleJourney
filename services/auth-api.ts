/**
 * Auth API and Token Management
 *
 * Handles auth token storage, retrieval, and API authentication.
 * PRD Section 1.2: Token Storage using expo-secure-store
 */

import * as SecureStore from "expo-secure-store";
import type { ApiResult } from "./api-client";

// Storage key for auth token
const AUTH_TOKEN_KEY = "auth_token";

// In-memory token for immediate access (avoid async for every API call)
let currentToken: string | null = null;

// Mock user storage (for development)
let mockCurrentUser: { id: string; email: string; name?: string } | null = null;

// API configuration
const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "https://api.littlejourney.sg",
  useMock: process.env.EXPO_PUBLIC_USE_MOCK_API !== "false",
};

// Helper to simulate network delay
async function simulateDelay(ms: number = 100): Promise<void> {
  if (API_CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Helper to generate mock tokens
function generateMockToken(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

/**
 * Set auth token in memory and persist to SecureStore
 */
export async function setAuthToken(token: string): Promise<void> {
  currentToken = token;
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

/**
 * Get current auth token from memory (synchronous for performance)
 */
export function getAuthToken(): string | null {
  return currentToken;
}

/**
 * Clear auth token from memory and SecureStore
 */
export async function clearAuthToken(): Promise<void> {
  currentToken = null;
  mockCurrentUser = null;
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

/**
 * Restore auth token from SecureStore on app startup
 * Call this during app initialization
 */
export async function restoreAuthToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token) {
      currentToken = token;
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Get Authorization headers for API requests
 * Returns empty object if not authenticated
 */
export function getAuthHeaders(): Record<string, string> {
  if (currentToken) {
    return {
      Authorization: `Bearer ${currentToken}`,
    };
  }
  return {};
}

// Auth API types
export interface SignInRequest {
  email: string;
}

export interface SignInResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name?: string;
}

// Auth API endpoints
export const authApi = {
  /**
   * Sign in with email (magic link flow)
   * In mock mode, immediately returns a user and token
   * In production, this would trigger magic link email
   */
  async signIn(request: SignInRequest): Promise<ApiResult<SignInResponse>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      const token = generateMockToken();
      const user = {
        id: `user_${Date.now()}`,
        email: request.email,
        name: request.email.split("@")[0], // Use email prefix as name
      };

      // Store token and user
      await setAuthToken(token);
      mockCurrentUser = user;

      return {
        data: {
          user,
          accessToken: token,
        },
      };
    }

    // Real API call
    const response = await fetch(`${API_CONFIG.baseUrl}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const result = await response.json();

    if (result.data?.accessToken) {
      await setAuthToken(result.data.accessToken);
    }

    return result;
  },

  /**
   * Sign out - clear token and session
   */
  async signOut(): Promise<ApiResult<{ success: boolean }>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      await clearAuthToken();
      return { data: { success: true } };
    }

    // Real API call
    const response = await fetch(`${API_CONFIG.baseUrl}/auth/signout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    await clearAuthToken();
    return response.json();
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ApiResult<UserResponse>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      if (!currentToken || !mockCurrentUser) {
        return {
          error: {
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          },
        };
      }
      return { data: mockCurrentUser };
    }

    // Real API call
    const response = await fetch(`${API_CONFIG.baseUrl}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Request magic link for email sign-in
   * Returns success when email is sent
   */
  async requestMagicLink(email: string): Promise<ApiResult<{ sent: boolean }>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      // In mock mode, immediately "send" the link
      return { data: { sent: true } };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/auth/magic-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  /**
   * Verify magic link token and complete sign-in
   */
  async verifyMagicLink(token: string): Promise<ApiResult<SignInResponse>> {
    await simulateDelay();

    if (API_CONFIG.useMock) {
      // Mock verification - extract email from token or use default
      const user = {
        id: `user_${Date.now()}`,
        email: "verified@example.com",
        name: "Verified User",
      };
      const accessToken = generateMockToken();

      await setAuthToken(accessToken);
      mockCurrentUser = user;

      return {
        data: {
          user,
          accessToken,
        },
      };
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const result = await response.json();

    if (result.data?.accessToken) {
      await setAuthToken(result.data.accessToken);
    }

    return result;
  },
};
