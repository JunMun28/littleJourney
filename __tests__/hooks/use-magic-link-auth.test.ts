/**
 * Tests for Magic Link authentication hook
 * PRD: AUTH-001 - Email magic link authentication
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";

// Mock Linking from expo
const mockAddEventListener = jest.fn();
const mockGetInitialURL = jest.fn();

jest.mock("expo-linking", () => ({
  addEventListener: (...args: unknown[]) => {
    mockAddEventListener(...args);
    return { remove: jest.fn() };
  },
  getInitialURL: () => mockGetInitialURL(),
  parse: jest.fn((url: string) => {
    const match = url.match(/\?token=(.+)$/);
    return {
      queryParams: match ? { token: match[1] } : {},
    };
  }),
}));

// Mock auth-api
const mockRequestMagicLink = jest.fn();
const mockVerifyMagicLink = jest.fn();

jest.mock("@/services/auth-api", () => ({
  authApi: {
    requestMagicLink: (...args: unknown[]) => mockRequestMagicLink(...args),
    verifyMagicLink: (...args: unknown[]) => mockVerifyMagicLink(...args),
  },
}));

import { useMagicLinkAuth } from "@/hooks/use-magic-link-auth";

describe("useMagicLinkAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInitialURL.mockResolvedValue(null);
    mockRequestMagicLink.mockResolvedValue({ data: { sent: true } });
    mockVerifyMagicLink.mockResolvedValue({
      data: {
        user: { id: "user_123", email: "test@example.com" },
        accessToken: "mock-token",
      },
    });
  });

  describe("initial state", () => {
    it("should return initial state correctly", () => {
      const { result } = renderHook(() => useMagicLinkAuth());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSent).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.sendMagicLink).toBeInstanceOf(Function);
      expect(result.current.reset).toBeInstanceOf(Function);
    });
  });

  describe("sendMagicLink", () => {
    it("should set isLoading true when sending", async () => {
      mockRequestMagicLink.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { sent: true } }), 100),
          ),
      );

      const { result } = renderHook(() => useMagicLinkAuth());

      act(() => {
        result.current.sendMagicLink("test@example.com");
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("should call authApi.requestMagicLink with email", async () => {
      const { result } = renderHook(() => useMagicLinkAuth());

      await act(async () => {
        await result.current.sendMagicLink("test@example.com");
      });

      expect(mockRequestMagicLink).toHaveBeenCalledWith("test@example.com");
    });

    it("should set isSent true on success", async () => {
      const { result } = renderHook(() => useMagicLinkAuth());

      await act(async () => {
        await result.current.sendMagicLink("test@example.com");
      });

      expect(result.current.isSent).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should set error on API error", async () => {
      mockRequestMagicLink.mockResolvedValue({
        error: { code: "RATE_LIMIT", message: "Too many requests" },
      });

      const { result } = renderHook(() => useMagicLinkAuth());

      await act(async () => {
        await result.current.sendMagicLink("test@example.com");
      });

      expect(result.current.error).toBe("Too many requests");
      expect(result.current.isSent).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle network errors gracefully", async () => {
      mockRequestMagicLink.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useMagicLinkAuth());

      await act(async () => {
        await result.current.sendMagicLink("test@example.com");
      });

      expect(result.current.error).toBe(
        "Failed to send magic link. Please try again.",
      );
      expect(result.current.isLoading).toBe(false);
    });

    it("should clear error on new attempt", async () => {
      mockRequestMagicLink.mockResolvedValueOnce({
        error: { code: "ERROR", message: "First error" },
      });

      const { result } = renderHook(() => useMagicLinkAuth());

      await act(async () => {
        await result.current.sendMagicLink("test@example.com");
      });

      expect(result.current.error).toBe("First error");

      mockRequestMagicLink.mockResolvedValueOnce({ data: { sent: true } });

      await act(async () => {
        await result.current.sendMagicLink("test@example.com");
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("reset", () => {
    it("should reset state to initial", async () => {
      const { result } = renderHook(() => useMagicLinkAuth());

      await act(async () => {
        await result.current.sendMagicLink("test@example.com");
      });

      expect(result.current.isSent).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isSent).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("deep link handling", () => {
    it("should register deep link listener on mount", () => {
      renderHook(() => useMagicLinkAuth());

      expect(mockAddEventListener).toHaveBeenCalledWith(
        "url",
        expect.any(Function),
      );
    });

    it("should check initial URL on mount", async () => {
      renderHook(() => useMagicLinkAuth());

      await waitFor(() => {
        expect(mockGetInitialURL).toHaveBeenCalled();
      });
    });

    it("should handle initial URL with token", async () => {
      const onSuccess = jest.fn();
      mockGetInitialURL.mockResolvedValue(
        "littlejourney://verify?token=initial-token",
      );

      renderHook(() => useMagicLinkAuth({ onSuccess }));

      await waitFor(() => {
        expect(mockVerifyMagicLink).toHaveBeenCalledWith("initial-token");
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          user: { id: "user_123", email: "test@example.com" },
          accessToken: "mock-token",
        });
      });
    });

    it("should handle deep link URL with token", async () => {
      const onSuccess = jest.fn();

      renderHook(() => useMagicLinkAuth({ onSuccess }));

      // Simulate deep link event
      const eventHandler = mockAddEventListener.mock.calls[0][1];
      await act(async () => {
        await eventHandler({
          url: "littlejourney://verify?token=deep-link-token",
        });
      });

      expect(mockVerifyMagicLink).toHaveBeenCalledWith("deep-link-token");

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("should set isLoading during verification", async () => {
      mockVerifyMagicLink.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    user: { id: "user_123", email: "test@example.com" },
                    accessToken: "mock-token",
                  },
                }),
              100,
            ),
          ),
      );

      mockGetInitialURL.mockResolvedValue(
        "littlejourney://verify?token=test-token",
      );

      const { result } = renderHook(() => useMagicLinkAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it("should set error on verification failure", async () => {
      mockVerifyMagicLink.mockResolvedValue({
        error: { code: "EXPIRED", message: "Magic link expired" },
      });

      mockGetInitialURL.mockResolvedValue(
        "littlejourney://verify?token=expired-token",
      );

      const { result } = renderHook(() => useMagicLinkAuth());

      await waitFor(() => {
        expect(result.current.error).toBe("Magic link expired");
      });
    });

    it("should call onError callback on verification failure", async () => {
      const onError = jest.fn();
      mockVerifyMagicLink.mockResolvedValue({
        error: { code: "EXPIRED", message: "Magic link expired" },
      });

      mockGetInitialURL.mockResolvedValue(
        "littlejourney://verify?token=expired-token",
      );

      renderHook(() => useMagicLinkAuth({ onError }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Magic link expired");
      });
    });

    it("should ignore URLs without token", async () => {
      mockGetInitialURL.mockResolvedValue("littlejourney://other-path");

      renderHook(() => useMagicLinkAuth());

      await waitFor(() => {
        expect(mockGetInitialURL).toHaveBeenCalled();
      });

      expect(mockVerifyMagicLink).not.toHaveBeenCalled();
    });
  });
});
