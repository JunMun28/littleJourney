// Mock expo-secure-store before importing auth-api
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from "expo-secure-store";
import {
  authApi,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  restoreAuthToken,
  getAuthHeaders,
} from "@/services/auth-api";

describe("Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAuthToken(); // Clear in-memory token
  });

  describe("Token Management", () => {
    it("setAuthToken stores token in memory for immediate access", async () => {
      await setAuthToken("test-token-123");

      const token = getAuthToken();
      expect(token).toBe("test-token-123");
    });

    it("setAuthToken persists token to SecureStore", async () => {
      await setAuthToken("test-token-456");

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "auth_token",
        "test-token-456",
      );
    });

    it("clearAuthToken removes token from memory and SecureStore", async () => {
      await setAuthToken("test-token-789");
      await clearAuthToken();

      expect(getAuthToken()).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_token");
    });

    it("restoreAuthToken loads token from SecureStore on startup", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        "restored-token",
      );

      const token = await restoreAuthToken();

      expect(token).toBe("restored-token");
      expect(getAuthToken()).toBe("restored-token");
    });
  });

  describe("getAuthHeaders", () => {
    it("returns Authorization header when token is set", async () => {
      await setAuthToken("my-bearer-token");

      const headers = getAuthHeaders();

      expect(headers).toEqual({
        Authorization: "Bearer my-bearer-token",
      });
    });

    it("returns empty object when no token is set", () => {
      const headers = getAuthHeaders();

      expect(headers).toEqual({});
    });
  });

  describe("authApi.signIn", () => {
    it("returns mock user and token in mock mode", async () => {
      const result = await authApi.signIn({ email: "test@example.com" });

      expect(result.data?.user.email).toBe("test@example.com");
      expect(result.data?.accessToken).toBeDefined();
      expect(result.data?.accessToken.length).toBeGreaterThan(10);
    });

    it("stores the returned token automatically", async () => {
      await authApi.signIn({ email: "test@example.com" });

      const token = getAuthToken();
      expect(token).toBeDefined();
      expect(token?.length).toBeGreaterThan(10);
    });
  });

  describe("authApi.signOut", () => {
    it("clears the auth token", async () => {
      await authApi.signIn({ email: "test@example.com" });
      expect(getAuthToken()).toBeDefined();

      await authApi.signOut();

      expect(getAuthToken()).toBeNull();
    });
  });

  describe("authApi.getCurrentUser", () => {
    it("returns current user when authenticated", async () => {
      await authApi.signIn({ email: "test@example.com" });

      const result = await authApi.getCurrentUser();

      expect(result.data?.email).toBe("test@example.com");
    });

    it("returns error when not authenticated", async () => {
      const result = await authApi.getCurrentUser();

      expect(result.error?.code).toBe("UNAUTHORIZED");
    });
  });
});
