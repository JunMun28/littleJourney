/**
 * Tests for Apple Sign-In hook
 * PRD: AUTH-003 - Apple Sign-In authentication
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

// Define mock functions
const mockSignInAsync = jest.fn();
const mockGetCredentialStateAsync = jest.fn();

// Mock expo-apple-authentication
jest.mock("expo-apple-authentication", () => ({
  signInAsync: (...args: unknown[]) => mockSignInAsync(...args),
  getCredentialStateAsync: (...args: unknown[]) =>
    mockGetCredentialStateAsync(...args),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
  AppleAuthenticationCredentialState: {
    REVOKED: 0,
    AUTHORIZED: 1,
    NOT_FOUND: 2,
    TRANSFERRED: 3,
  },
}));

import { useAppleAuth } from "@/hooks/use-apple-auth";

describe("useAppleAuth", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock iOS platform by default for Apple Sign-In
    Object.defineProperty(Platform, "OS", { value: "ios", writable: true });
  });

  afterAll(() => {
    Object.defineProperty(Platform, "OS", { value: originalPlatform });
  });

  it("should return initial state with signIn function", () => {
    const { result } = renderHook(() => useAppleAuth());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.signIn).toBeInstanceOf(Function);
  });

  it("should set isLoading true when signing in", async () => {
    mockSignInAsync.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                user: "test-user-id",
                email: "test@example.com",
                fullName: { givenName: "Test", familyName: "User" },
                identityToken: "mock-identity-token",
                authorizationCode: "mock-auth-code",
              }),
            100,
          ),
        ),
    );

    const { result } = renderHook(() => useAppleAuth());

    act(() => {
      result.current.signIn();
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle successful authentication", async () => {
    const mockCredential = {
      user: "test-user-id",
      email: "test@example.com",
      fullName: { givenName: "Test", familyName: "User" },
      identityToken: "mock-identity-token",
      authorizationCode: "mock-auth-code",
    };
    mockSignInAsync.mockResolvedValue(mockCredential);

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useAppleAuth({ onSuccess }));

    await act(async () => {
      await result.current.signIn();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          user: "test-user-id",
          email: "test@example.com",
          identityToken: "mock-identity-token",
        }),
      );
    });
  });

  it("should handle user cancellation", async () => {
    const error = new Error("The user canceled the sign-in operation.");
    error.name = "ERR_REQUEST_CANCELED";
    mockSignInAsync.mockRejectedValue(error);

    const { result } = renderHook(() => useAppleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    // Cancellation is not an error
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle authentication error", async () => {
    mockSignInAsync.mockRejectedValue(new Error("Authentication failed"));

    const { result } = renderHook(() => useAppleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe(
      "Apple Sign-In failed. Please try again.",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("should call onError callback when auth fails", async () => {
    mockSignInAsync.mockRejectedValue(new Error("Auth error"));

    const onError = jest.fn();
    const { result } = renderHook(() => useAppleAuth({ onError }));

    await act(async () => {
      await result.current.signIn();
    });

    expect(onError).toHaveBeenCalledWith(
      "Apple Sign-In failed. Please try again.",
    );
  });

  it("should request full name and email scopes", async () => {
    mockSignInAsync.mockResolvedValue({
      user: "test-user-id",
      email: "test@example.com",
      identityToken: "mock-token",
    });

    const { result } = renderHook(() => useAppleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(mockSignInAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedScopes: expect.arrayContaining([0, 1]), // FULL_NAME, EMAIL
      }),
    );
  });

  it("should clear error on new sign in attempt", async () => {
    // First call errors
    mockSignInAsync.mockRejectedValueOnce(new Error("First error"));

    const { result } = renderHook(() => useAppleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe(
      "Apple Sign-In failed. Please try again.",
    );

    // Second call succeeds
    mockSignInAsync.mockResolvedValueOnce({
      user: "test-user-id",
      email: "test@example.com",
      identityToken: "mock-token",
    });

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBeNull();
  });

  it("should indicate availability on iOS", async () => {
    const { result } = renderHook(() => useAppleAuth());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(true);
    });
  });

  it("should not be available on Android", async () => {
    Object.defineProperty(Platform, "OS", { value: "android" });

    const { result } = renderHook(() => useAppleAuth());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(false);
    });
  });

  it("should handle case when email is hidden", async () => {
    // Apple allows users to hide their email
    const mockCredential = {
      user: "test-user-id",
      email: null, // Email hidden
      fullName: { givenName: "Test", familyName: "User" },
      identityToken: "mock-identity-token",
      authorizationCode: "mock-auth-code",
    };
    mockSignInAsync.mockResolvedValue(mockCredential);

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useAppleAuth({ onSuccess }));

    await act(async () => {
      await result.current.signIn();
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          user: "test-user-id",
          email: null,
        }),
      );
    });
  });

  it("should handle network errors gracefully", async () => {
    mockSignInAsync.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAppleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe(
      "Apple Sign-In failed. Please try again.",
    );
    expect(result.current.isLoading).toBe(false);
  });
});
