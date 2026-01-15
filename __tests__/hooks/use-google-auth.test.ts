/**
 * Tests for Google OAuth hook
 * PRD: AUTH-002 - Google OAuth authentication
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";

// Define mock functions that will be used in jest.mock
const mockPromptAsync = jest.fn();
let mockAuthRequestResult: [unknown, unknown, typeof mockPromptAsync] = [
  null,
  null,
  mockPromptAsync,
];

// Mock expo-auth-session
jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "littlejourney://oauth"),
}));

// Mock expo-auth-session/providers/google
jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: jest.fn(() => mockAuthRequestResult),
}));

// Mock expo-web-browser
jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

import { makeRedirectUri } from "expo-auth-session";
import { useAuthRequest } from "expo-auth-session/providers/google";
import { useGoogleAuth } from "@/hooks/use-google-auth";

const mockMakeRedirectUri = makeRedirectUri as jest.Mock;
const mockUseAuthRequest = useAuthRequest as jest.Mock;

describe("useGoogleAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthRequestResult = [null, null, mockPromptAsync];
    mockUseAuthRequest.mockImplementation(() => mockAuthRequestResult);
    mockPromptAsync.mockResolvedValue({
      type: "success",
      params: { code: "mock-auth-code" },
    });
  });

  it("should return initial state with signIn function", () => {
    mockAuthRequestResult = [null, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);

    const { result } = renderHook(() => useGoogleAuth());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.signIn).toBeInstanceOf(Function);
  });

  it("should set isLoading true when signing in", async () => {
    mockAuthRequestResult = [{ type: "success" }, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);
    mockPromptAsync.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ type: "success" }), 100),
        ),
    );

    const { result } = renderHook(() => useGoogleAuth());

    act(() => {
      result.current.signIn();
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle successful authentication", async () => {
    const mockResponse = {
      type: "success" as const,
      authentication: {
        accessToken: "mock-access-token",
        idToken: "mock-id-token",
      },
      params: {},
      url: "https://example.com",
    };

    mockAuthRequestResult = [
      { type: "success" },
      mockResponse,
      mockPromptAsync,
    ];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);

    const { result } = renderHook(() => useGoogleAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle user cancellation", async () => {
    mockAuthRequestResult = [{ type: "success" }, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);
    mockPromptAsync.mockResolvedValue({ type: "cancel" });

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle authentication error", async () => {
    mockAuthRequestResult = [{ type: "success" }, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);
    mockPromptAsync.mockResolvedValue({
      type: "error",
      error: new Error("Auth failed"),
    });

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe(
      "Authentication failed. Please try again.",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle dismiss", async () => {
    mockAuthRequestResult = [{ type: "success" }, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);
    mockPromptAsync.mockResolvedValue({ type: "dismiss" });

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should require request to be ready before signing in", async () => {
    mockAuthRequestResult = [null, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(mockPromptAsync).not.toHaveBeenCalled();
  });

  it("should call promptAsync when signing in", async () => {
    mockAuthRequestResult = [{ type: "success" }, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);
    mockPromptAsync.mockResolvedValue({ type: "success" });

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(mockPromptAsync).toHaveBeenCalled();
  });

  it("should clear error on new sign in attempt", async () => {
    mockAuthRequestResult = [{ type: "success" }, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);

    // First call errors
    mockPromptAsync.mockResolvedValueOnce({
      type: "error",
      error: new Error("First error"),
    });

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe(
      "Authentication failed. Please try again.",
    );

    // Second call succeeds
    mockPromptAsync.mockResolvedValueOnce({ type: "success" });

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBeNull();
  });

  it("should handle network errors gracefully", async () => {
    mockAuthRequestResult = [{ type: "success" }, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);
    mockPromptAsync.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe(
      "Authentication failed. Please try again.",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("should call onSuccess callback when auth succeeds", async () => {
    const mockOnSuccess = jest.fn();
    const mockResponse = {
      type: "success" as const,
      authentication: {
        accessToken: "mock-access-token",
        idToken: "mock-id-token",
      },
      params: {},
      url: "https://example.com",
    };

    mockAuthRequestResult = [
      { type: "success" },
      mockResponse,
      mockPromptAsync,
    ];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);

    renderHook(() => useGoogleAuth({ onSuccess: mockOnSuccess }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.authentication);
    });
  });

  it("should use correct redirect URI", () => {
    mockAuthRequestResult = [null, null, mockPromptAsync];
    mockUseAuthRequest.mockReturnValue(mockAuthRequestResult);

    renderHook(() => useGoogleAuth());

    expect(mockMakeRedirectUri).toHaveBeenCalledWith({
      scheme: "littlejourney",
      path: "oauth",
    });
  });
});
