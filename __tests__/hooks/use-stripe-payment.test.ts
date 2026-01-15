/**
 * Tests for useStripePayment hook
 * PRD ref: PAY-002 (Credit card via Stripe)
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useStripePayment } from "@/hooks/use-stripe-payment";
import * as stripeService from "@/services/stripe";

// Mock the stripe service
jest.mock("@/services/stripe", () => ({
  createPaymentSheet: jest.fn(),
  presentPaymentSheet: jest.fn(),
  setStripeHooks: jest.fn(),
  isStripeError: jest.fn((result) => "error" in result),
  isStripeAvailable: jest.fn(() => true),
  getPlanAmountInCents: jest.fn((plan, cycle) => {
    if (plan === "standard") return cycle === "monthly" ? 499 : 3999;
    if (plan === "premium") return cycle === "monthly" ? 999 : 7999;
    return 0;
  }),
}));

// Mock @stripe/stripe-react-native
const mockInitPaymentSheet = jest.fn();
const mockPresentPaymentSheet = jest.fn();

jest.mock("@stripe/stripe-react-native", () => ({
  useStripe: () => ({
    initPaymentSheet: mockInitPaymentSheet,
    presentPaymentSheet: mockPresentPaymentSheet,
  }),
  StripeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock fetch for payment intent
global.fetch = jest.fn();

describe("useStripePayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (stripeService.createPaymentSheet as jest.Mock).mockResolvedValue({
      data: { ready: true },
    });
    (stripeService.presentPaymentSheet as jest.Mock).mockResolvedValue({
      data: { success: true },
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          clientSecret: "pi_test_secret",
          ephemeralKey: "ek_test",
          customerId: "cus_test",
        }),
    });
  });

  it("returns initial state correctly", () => {
    const { result } = renderHook(() => useStripePayment());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.processPayment).toBe("function");
    expect(typeof result.current.clearError).toBe("function");
  });

  it("returns true immediately for free plan", async () => {
    const { result } = renderHook(() => useStripePayment());

    let success: boolean = false;
    await act(async () => {
      success = await result.current.processPayment("free", "monthly");
    });

    expect(success).toBe(true);
    expect(stripeService.createPaymentSheet).not.toHaveBeenCalled();
  });

  it("processes standard monthly payment successfully", async () => {
    const { result } = renderHook(() => useStripePayment());

    let success: boolean = false;
    await act(async () => {
      success = await result.current.processPayment("standard", "monthly");
    });

    expect(success).toBe(true);
    expect(stripeService.getPlanAmountInCents).toHaveBeenCalledWith(
      "standard",
      "monthly",
    );
    expect(stripeService.createPaymentSheet).toHaveBeenCalled();
    expect(stripeService.presentPaymentSheet).toHaveBeenCalled();
  });

  it("processes premium yearly payment successfully", async () => {
    const { result } = renderHook(() => useStripePayment());

    let success: boolean = false;
    await act(async () => {
      success = await result.current.processPayment("premium", "yearly");
    });

    expect(success).toBe(true);
    expect(stripeService.getPlanAmountInCents).toHaveBeenCalledWith(
      "premium",
      "yearly",
    );
  });

  it("sets loading state during payment process", async () => {
    // Make createPaymentSheet take some time
    (stripeService.createPaymentSheet as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { ready: true } }), 100),
        ),
    );

    const { result } = renderHook(() => useStripePayment());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.processPayment("standard", "monthly");
    });

    // Should be loading during process
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Wait for completion
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("handles payment sheet initialization error", async () => {
    (stripeService.createPaymentSheet as jest.Mock).mockResolvedValue({
      error: { code: "Failed", message: "Failed to initialize" },
    });

    const { result } = renderHook(() => useStripePayment());

    let success: boolean = true;
    await act(async () => {
      success = await result.current.processPayment("standard", "monthly");
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Failed to initialize");
  });

  it("handles user cancellation gracefully", async () => {
    (stripeService.presentPaymentSheet as jest.Mock).mockResolvedValue({
      error: { code: "Canceled", message: "The payment was canceled" },
    });

    const { result } = renderHook(() => useStripePayment());

    let success: boolean = true;
    await act(async () => {
      success = await result.current.processPayment("standard", "monthly");
    });

    // Cancellation returns false but doesn't set error
    expect(success).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles payment failure error", async () => {
    (stripeService.presentPaymentSheet as jest.Mock).mockResolvedValue({
      error: { code: "Failed", message: "Card declined" },
    });

    const { result } = renderHook(() => useStripePayment());

    let success: boolean = true;
    await act(async () => {
      success = await result.current.processPayment("standard", "monthly");
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Card declined");
  });

  it("clears error with clearError", async () => {
    (stripeService.createPaymentSheet as jest.Mock).mockResolvedValue({
      error: { code: "Failed", message: "Test error" },
    });

    const { result } = renderHook(() => useStripePayment());

    await act(async () => {
      await result.current.processPayment("standard", "monthly");
    });

    expect(result.current.error).toBe("Test error");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("handles network error when fetching payment intent", async () => {
    // Disable mock mode to test real fetch
    const originalEnv = process.env.EXPO_PUBLIC_USE_MOCK_API;
    process.env.EXPO_PUBLIC_USE_MOCK_API = "false";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() => useStripePayment());

    let success: boolean = true;
    await act(async () => {
      success = await result.current.processPayment("standard", "monthly");
    });

    expect(success).toBe(false);
    expect(result.current.error).toContain("Unable to connect");

    // Restore env
    process.env.EXPO_PUBLIC_USE_MOCK_API = originalEnv;
  });
});
